# 🔐 CONTEXTE NIATALA - À COLLER DANS CHAQUE PROMPT

## PROJET
- **Nom**: NIATALA
- **Type**: Application POS (Caisse) pour petits commerces
- **Chemin**: `C:\Users\TanguyColin\niatala`
- **Tech**: React/Vite (frontend) + Express/Prisma (backend) + PostgreSQL
- **Port Dev Frontend**: 5174
- **Port Dev Backend**: 3001
- **DB**: PostgreSQL sur localhost:5433

## STATUT ACTUELS
- Frontend: Quasi-complet, modifications locales préservées
- Backend: Authentification multi-tenant opérationnelle
- DB: Schéma Prisma complet, migrations appliquées
- Inventaire: Fonctionnel en localStorage (Phase 2A: migration vers PostgreSQL)

## FONCTIONNALITÉS EXISTANTES (À PRÉSERVER)
✅ Caisse (CashierScreen)
✅ Produits & Stock (ProductsScreen, InventoryScreen)
✅ Clients & Crédits (ClientsScreen, CreditsScreen)
✅ Sommes libres (FreeAmountsScreen)
✅ Dashboard & Calculatrice
✅ Authentification multi-tenant (SUPER_ADMIN, ADMIN, CAISSIER)
✅ Payment Engine (Wave, Orange Money, Free Money, QR codes)
✅ Historique & Audit

## ⚠️ RÈGLES ABSOLUES

### NE JAMAIS MODIFIER:
- 🔴 Payment Engine (Wave, Orange Money, Free Money, QR)
- 🔴 paymentTransactionService
- 🔴 paymentEngine/* folder
- 🔴 routes/payments.ts & routes/webhooks.ts
- 🔴 Modifications locales existantes (App.tsx, LoginScreen, AdminScreen, etc.)

### TOUJOURS VÉRIFIER:
- ✅ Multi-tenant isolation (tenantId depuis req.user.tenantId, jamais du client)
- ✅ Permissions (SUPER_ADMIN > ADMIN > CAISSIER)
- ✅ Authentification middleware sur les routes
- ✅ Pas de perte de données

### GIT RULES:
- ✅ NE PAS faire git reset, checkout, clean
- ✅ NE PAS supprimer les modifications locales
- ✅ Commit nouveau code au lieu de modifier les commits existants
- ✅ Vérifier git status avant/après modifications

## MODIFICATIONS LOCALES ACTUELLES
```
M src/App.tsx
M src/screens/AdminScreen.tsx
M src/screens/CashierScreen.tsx
M src/screens/LoginScreen.tsx (fix SUPER_ADMIN access)
M src/services/authService.ts (functions added)
M src/types/index.ts
M vite.config.ts
```

## POINTS D'ENTRÉE CLÉS

### Frontend
- `src/App.tsx` - Router principal
- `src/screens/InventoryScreen.tsx` - Gestion stocks
- `src/screens/CashierScreen.tsx` - Caisse
- `src/types/index.ts` - Modèles de données
- `src/services/authService.ts` - Auth
- `src/services/inventoryService.ts` - Logique stock (localStorage)

### Backend
- `backend/src/index.ts` - Server Express
- `backend/src/routes/*.ts` - Routes API
- `backend/src/services/*.ts` - Business logic
- `backend/src/middleware/auth.ts` - Auth middleware
- `backend/prisma/schema.prisma` - Modèle DB
- `backend/.env` - Configuration

## MODÈLE DE DONNÉES CLÉS

### Product (localStorage + Prisma)
```typescript
{
  id: string
  tenantId: string (Prisma only)
  name: string
  category: string
  price: number (salePrice en Prisma)
  costPrice?: number
  stock: number (currentStock en Prisma)
  useDefaultThresholds: boolean
  customThresholdOrange?: number
  customThresholdRed?: number
  emoji?: string
}
```

### StockMovement
```typescript
{
  id: string
  productId: string
  tenantId: string
  type: 'SALE' | 'REFUND' | 'CANCELLATION' | 'ADJUSTMENT' | 'ENTRY' | etc.
  quantity: number
  before: number (stockBefore)
  after: number (stockAfter)
  date: number
  userId?: string
  username?: string
  reference?: string (saleId, etc.)
  motif?: string (reason)
}
```

## COMMANDES UTILES

```bash
# Frontend
npm run dev          # Lancer Vite dev server (port 5174)
npm run build        # Build production
npm run type-check   # TypeScript check

# Backend
cd backend
npm run dev          # Lancer Express dev server (port 3001)
npm run build        # Build TypeScript
npm test             # Run Jest tests

# Database
npx prisma generate # Generate Prisma client
npx prisma migrate status  # Check migrations
npx prisma migrate dev --name "description"  # Create new migration
npx prisma studio   # Prisma Studio (GUI)
```

## ARCHITECTURE MULTI-TENANT

```
Tenant (isolation totale)
  ├─ Users (SUPER_ADMIN, ADMIN, CAISSIER)
  ├─ Products
  ├─ Categories
  ├─ Stock Movements
  ├─ Sales
  ├─ Clients
  ├─ Credits
  └─ Thresholds

RÈGLE: Toujours extraire tenantId de req.user.tenantId (authentifié)
JAMAIS faire confiance à tenantId du client
```

## PHASE 2A - INVENTAIRE POSTGRESQL
État: Audit terminé, prêt pour implémentation
- Backend routes: À créer
- Backend services: À créer
- Connexion frontend: Phase future
- Tests: À écrire

---

**UTILISE CE DOCUMENT COMME BASE POUR TOUS LES PROMPTS FUTURS**
