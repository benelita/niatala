# 🔐 PHASE 2A - INVENTAIRE POSTGRESQL
## À COLLER POUR LES TÂCHES DE PHASE 2A

**Inclure d'abord**: [PROMPT_NIATALA_CONTEXT.md](PROMPT_NIATALA_CONTEXT.md)

---

## PHASE 2A OBJECTIF

Migrer l'inventaire du localStorage vers PostgreSQL **SANS supprimer ni simplifier les fonctionnalités existantes**.

### État actuel
- ✅ Inventaire fonctionnel en localStorage
- ✅ Schéma Prisma prêt (Product, StockMovement, StockThresholdSettings)
- ✅ Migrations appliquées
- ✅ Frontend complet
- ❌ Routes API backend: À créer
- ❌ Services backend: À créer

### Fonctionnalités à préserver
✅ Écran InventoryScreen.tsx (UI inchangée)
✅ Filtres (NORMAL, LOW, CRITICAL, OUTOFSTOCK)
✅ Recherche par nom/catégorie
✅ Ajustement manuel du stock
✅ Seuils orange/rouge par produit
✅ Mouvements de stock enregistrés
✅ Calculs: valeur achat, valeur vente, marge
✅ Audit trail (qui, quand, pourquoi)

---

## PARTIE ACTUELLE À TRAITER

### Option A: Routes API (si pas encore fait)
Créer `backend/src/routes/inventory.ts` avec endpoints:
- POST /api/inventory/products (créer produit)
- GET /api/inventory/products (lister produits)
- GET /api/inventory/products/:id (détail produit)
- PATCH /api/inventory/products/:id (modifier produit)
- DELETE /api/inventory/products/:id (supprimer produit)
- POST /api/inventory/products/:id/stock (ajuster stock)
- GET /api/inventory/products/:id/movements (historique)
- GET /api/inventory/categories
- GET /api/inventory/thresholds
- PATCH /api/inventory/thresholds

### Option B: Services backend (si pas encore fait)
Créer `backend/src/services/inventoryService.ts` avec:
- createProduct()
- updateProduct()
- deleteProduct()
- getProductsByTenant()
- adjustStock()
- recordStockMovement()
- getStockMovements()
- getThresholds()
- setThresholds()

### Option C: Tests (si routes/services créés)
Écrire tests Jest:
- Multi-tenant isolation
- Permissions (ADMIN vs CAISSIER)
- Stock calculations
- Price preservation
- Stock movements

### Option D: Connexion frontend (Phase future)
Remplacer localStorage par appels API

---

## RÈGLES PHASE 2A

### ✅ À FAIRE
- Préserver TOUTES les fonctionnalités de l'inventaire
- Implémenter multi-tenant strict
- Valider les permissions (ADMIN > CAISSIER)
- Enregistrer les mouvements de stock
- Conserver les prix (costPrice, salePrice)
- Respecter les seuils (orange/rouge)
- Tester réellement les endpoints

### ❌ À NE PAS FAIRE
- Refondre l'interface InventoryScreen
- Supprimer des colonnes du tableau
- Simplifier les filtres
- Perdre l'historique des mouvements
- Autoriser les caissiers à modifier les seuils
- Faire confiance au tenantId du client
- Modifier le Payment Engine
- Modifier la caisse existante (sauf relation technique directe)

### 🔐 SÉCURITÉ
- Toujours valider tenantId depuis req.user.tenantId
- Vérifier les permissions avant chaque opération
- Enregistrer les mouvements sensibles en audit
- Ne jamais exposer les seuils sans authentification

---

## CHECKLIST VALIDATION

### Routes API
- [ ] POST /api/inventory/products (ADMIN/SUPER_ADMIN only)
- [ ] GET /api/inventory/products (tous, filtré par tenant)
- [ ] GET /api/inventory/products/:id
- [ ] PATCH /api/inventory/products/:id (ADMIN/SUPER_ADMIN)
- [ ] DELETE /api/inventory/products/:id (ADMIN/SUPER_ADMIN)
- [ ] POST /api/inventory/products/:id/stock (ADMIN/SUPER_ADMIN)
- [ ] GET /api/inventory/products/:id/movements
- [ ] GET /api/inventory/categories
- [ ] GET /api/inventory/thresholds
- [ ] PATCH /api/inventory/thresholds (ADMIN/SUPER_ADMIN)

### Tests
- [ ] Créer produit pour Tenant A
- [ ] Créer produit même nom pour Tenant B
- [ ] Vérifier isolation (A ne voit pas B)
- [ ] Vérifier permissions (CAISSIER ne peut pas modifier seuils)
- [ ] Vérifier stock movements
- [ ] Vérifier calculs seuils (NORMAL/LOW/CRITICAL/OUTOFSTOCK)
- [ ] Vérifier prix conservés
- [ ] Vérifier dates (createdAt, updatedAt)

### Fonctionnalités
- [ ] Interface inchangée
- [ ] Filtres fonctionnels
- [ ] Recherche fonctionnelle
- [ ] Ajustement stock fonctionne
- [ ] Calculs (valeur achat, vente, marge)
- [ ] Historique enregistré
- [ ] Audit trail complet
- [ ] Aucune perte de données

---

## EXÉCUTION FINALE

```bash
# Vérifier migrations
npx prisma migrate status

# Générer client Prisma
npx prisma generate

# Lancer les tests
npm test

# Vérifier les types
npm run type-check

# Build
npm run build
```

---

**PIÈCES JOINTES**:
- Audit Phase 2A (voir rapport complet)
- Schéma Prisma (backend/prisma/schema.prisma)
- Frontend existant (src/screens/InventoryScreen.tsx)

