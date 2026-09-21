# 🔒 RÈGLES DE SÉCURITÉ NIATALA
## À COLLER POUR VÉRIFIER LA SÉCURITÉ

---

## MULTI-TENANT ISOLATION

### ✅ CORRECT - Extraire du contexte authentifié

```typescript
// ✅ BON
const tenantId = req.user.tenantId;  // Depuis le JWT authentifié
const products = await prisma.product.findMany({
  where: { tenantId }
});

// ✅ BON AUSSI
const { tenantId } = req.user;  // Destructurer de req.user
```

### ❌ INCORRECT - Faire confiance au client

```typescript
// ❌ MAUVAIS
const tenantId = req.body.tenantId;  // Client envoie n'importe quoi
const tenantId = req.query.tenantId; // Client peut modifier
const tenantId = req.params.tenantId; // Pas sûr

// ❌ TRÈS MAUVAIS
const tenantId = req.headers['x-tenant-id'];  // Client contrôle
```

---

## PERMISSIONS & RÔLES

### Hiérarchie
```
SUPER_ADMIN
    ↓
  ADMIN
    ↓
  CAISSIER
```

### Permissions par rôle

**SUPER_ADMIN**: Accès complet (tous les tenants)
- Gérer tous les tenants
- Gérer tous les utilisateurs
- Accès à tous les rapports

**ADMIN**: Accès complet à son tenant
- Créer/modifier/supprimer produits
- Gérer les seuils de stock
- Gérer les utilisateurs de son tenant
- Voir l'historique complet
- Gérer les prix

**CAISSIER**: Lecture + opérations caisse
- Consulter la liste des produits
- Faire des ventes
- Enregistrer les remboursements
- Consulter l'historique de ses ventes
- NE PAS modifier les produits
- NE PAS modifier les seuils
- NE PAS modifier les prix
- NE PAS accéder aux données d'autres tenants

### Vérification dans les routes

```typescript
// ✅ EXEMPLE SÉCURISÉ - Créer produit
router.post('/products', authMiddleware, async (req: AuthenticatedRequest, res) => {
  // 1. Vérifier authentification (authMiddleware l'a fait)
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  
  // 2. Vérifier rôle
  if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  // 3. Extraire tenantId du user
  const tenantId = req.user.tenantId;
  
  // 4. Créer produit TOUJOURS avec le tenantId de l'utilisateur
  const product = await prisma.product.create({
    data: {
      ...req.body,
      tenantId  // JAMAIS req.body.tenantId
    }
  });
});
```

---

## AUTHENTIFICATION

### JWT Middleware

```typescript
// ✅ MIDDLEWARE SÉCURISÉ
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.cookies.auth_token;
    
    if (!token) {
      res.status(401).json({ error: 'No token' });
      return;
    }
    
    const payload = verifyToken(token);  // Vérifier la signature
    
    if (!payload || !payload.userId) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }
    
    // Charger le user depuis la BD pour avoir l'état courant
    const user = await prisma.user.findUnique({
      where: { id: payload.userId }
    });
    
    if (!user || user.status !== 'ACTIVE') {
      res.status(401).json({ error: 'User not active' });
      return;
    }
    
    (req as AuthenticatedRequest).user = {
      id: user.id,
      username: user.username,
      role: user.role,
      tenantId: user.tenantId
    };
    
    next();
  } catch (error) {
    res.status(401).json({ error: 'Auth failed' });
  }
};
```

### Signature JWT

```typescript
// ✅ NE JAMAIS accepter de JWT non signé
const payload: JwtPayload = {
  userId: user.id,
  username: user.username,
  role: user.role,
  tenantId: user.tenantId,
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60
};

const token = jwt.sign(payload, process.env.JWT_SECRET!);
```

---

## VALIDATION DES DONNÉES

### ✅ À FAIRE
```typescript
// Valider les données du client
if (!req.body.name || req.body.name.trim() === '') {
  return res.status(400).json({ error: 'Name required' });
}

if (req.body.price < 0) {
  return res.status(400).json({ error: 'Price must be positive' });
}

if (req.body.customThresholdRed > req.body.customThresholdOrange) {
  return res.status(400).json({ error: 'Red threshold must be < orange' });
}
```

### ❌ À NE PAS FAIRE
```typescript
// Ne pas faire confiance aux données du client
const product = await prisma.product.create({
  data: req.body  // ❌ DANGEREUX - accepte n'importe quoi
});

// Ne pas faire confiance à des conversions silencieuses
const price = parseFloat(req.body.price);  // Peut être NaN
```

---

## INJECTION SQL

### ✅ Prisma prévient

```typescript
// ✅ SAFE - Prisma échappe les valeurs
const products = await prisma.product.findMany({
  where: {
    name: req.body.name  // Prisma échappe les caractères spéciaux
  }
});
```

### ❌ Ne jamais utiliser de requêtes brutes

```typescript
// ❌ DANGEREUX - Requête brute
const products = await db.raw(
  `SELECT * FROM Product WHERE name = '${req.body.name}'`
);

// Si vraiment nécessaire, utiliser les paramètres
// ✅ MOINS DANGEREUX
const products = await db.raw(
  `SELECT * FROM Product WHERE name = $1`,
  [req.body.name]
);
```

---

## PERTE DE DONNÉES

### ✅ Avant de supprimer

```typescript
// ✅ Vérifier d'abord si le produit existe
const product = await prisma.product.findUnique({
  where: { id: req.params.id }
});

if (!product) {
  return res.status(404).json({ error: 'Product not found' });
}

// ✅ Vérifier que ça appartient au tenant
if (product.tenantId !== req.user.tenantId) {
  return res.status(403).json({ error: 'Forbidden' });
}

// ✅ SEULEMENT ENSUITE supprimer
await prisma.product.delete({
  where: { id: req.params.id }
});
```

### ❌ Opérations destructrices

```typescript
// ❌ NE JAMAIS FAIRE
prisma.product.deleteMany({});  // Supprime TOUS les produits

// ❌ NE JAMAIS FAIRE
prisma.$executeRaw`TRUNCATE TABLE Product`;
```

---

## AUDIT & LOGGING

### ✅ Enregistrer les actions sensibles

```typescript
// Créer/modifier/supprimer produit
await prisma.auditLog.create({
  data: {
    userId: req.user.id,
    tenantId: req.user.tenantId,
    action: 'CREATE_PRODUCT',
    resourceType: 'PRODUCT',
    resourceId: product.id,
    details: {
      name: product.name,
      price: product.price
    },
    status: 'SUCCESS'
  }
});
```

### ❌ Ne pas exposer d'infos sensibles

```typescript
// ❌ NE PAS renvoyer
{
  password: user.passwordHash,  // Jamais les hashes
  sessionToken: token           // Jamais les tokens
}

// ✅ Renvoyer seulement
{
  id: user.id,
  username: user.username,
  role: user.role
}
```

---

## CHECKLIST DE SÉCURITÉ

Pour chaque nouvelle route:

- [ ] authMiddleware appliqué
- [ ] Rôle vérifié (ADMIN/SUPER_ADMIN si modifiable)
- [ ] tenantId extrait de req.user
- [ ] Validation des données d'entrée
- [ ] Vérification tenant_isolation (où applicable)
- [ ] Pas de SQL injection (utiliser Prisma)
- [ ] Pas de données sensibles en réponse
- [ ] Audit log créé si action sensible
- [ ] Erreurs retournées sans révéler l'interne
- [ ] Tests d'accès non-autorisé

---

## EXEMPLES DE VIOLATIONS DE SÉCURITÉ

### 1. Confusion de tenant

```typescript
// ❌ MAUVAIS
const products = await prisma.product.findMany({
  where: { tenantId: req.params.tenantId }
});
// Le client pourrait spécifier n'importe quel tenant!

// ✅ BON
const products = await prisma.product.findMany({
  where: { tenantId: req.user.tenantId }
});
```

### 2. Permissions insuffisantes

```typescript
// ❌ MAUVAIS
router.patch('/products/:id', authMiddleware, async (req, res) => {
  // Aucune vérification de rôle!
  // Un CAISSIER pourrait modifier les prix
});

// ✅ BON
router.patch('/products/:id', authMiddleware, adminOnly, async (req, res) => {
  // Seulement ADMIN/SUPER_ADMIN
});
```

### 3. Validation manquante

```typescript
// ❌ MAUVAIS
const price = req.body.price;
const product = await prisma.product.update({
  where: { id: req.params.id },
  data: { salePrice: price }
});
// Pas de vérification que price >= 0

// ✅ BON
if (typeof req.body.price !== 'number' || req.body.price < 0) {
  return res.status(400).json({ error: 'Price must be >= 0' });
}
```

---

**VÉRIFIER CETTE LISTE AVANT CHAQUE COMMIT**
