# 🧪 TEMPLATE TESTS NIATALA
## À COLLER POUR LES TESTS RÉELS

---

## STRUCTURE DES TESTS

```typescript
// backend/src/__tests__/inventory.test.ts

import { PrismaClient } from '@prisma/client'
import request from 'supertest'
import app from '../index'

const prisma = new PrismaClient()

describe('Inventory API', () => {
  
  let tenantA: any
  let tenantB: any
  let adminA: any
  let cashierA: any
  let adminB: any
  let tokenAdminA: string
  let tokenCashierA: string
  let tokenAdminB: string
  
  beforeAll(async () => {
    // Créer tenants de test
    tenantA = await prisma.tenant.create({
      data: { name: 'Tenant A', slug: 'tenant-a' }
    })
    tenantB = await prisma.tenant.create({
      data: { name: 'Tenant B', slug: 'tenant-b' }
    })
    
    // Créer users de test
    adminA = await prisma.user.create({
      data: {
        name: 'Admin A',
        username: 'admin_a',
        passwordHash: 'hash',
        role: 'ADMIN',
        tenantId: tenantA.id
      }
    })
    
    cashierA = await prisma.user.create({
      data: {
        name: 'Cashier A',
        username: 'cashier_a',
        passwordHash: 'hash',
        role: 'CAISSIER',
        tenantId: tenantA.id
      }
    })
    
    adminB = await prisma.user.create({
      data: {
        name: 'Admin B',
        username: 'admin_b',
        passwordHash: 'hash',
        role: 'ADMIN',
        tenantId: tenantB.id
      }
    })
    
    // Générer tokens (simplifiés pour tests)
    tokenAdminA = generateToken(adminA)
    tokenCashierA = generateToken(cashierA)
    tokenAdminB = generateToken(adminB)
  })
  
  afterAll(async () => {
    await prisma.$disconnect()
  })
  
  // ===== TESTS MULTI-TENANT ISOLATION =====
  
  describe('Multi-tenant Isolation', () => {
    
    it('Test 1: Admin A crée un produit', async () => {
      const res = await request(app)
        .post('/api/inventory/products')
        .set('Cookie', `auth_token=${tokenAdminA}`)
        .send({
          name: 'Coca-Cola A',
          category: 'Boissons',
          price: 500,
          costPrice: 350,
          stock: 50
        })
      
      expect(res.status).toBe(201)
      expect(res.body.tenantId).toBe(tenantA.id)
      expect(res.body.name).toBe('Coca-Cola A')
    })
    
    it('Test 2: Admin B crée produit avec même nom', async () => {
      const res = await request(app)
        .post('/api/inventory/products')
        .set('Cookie', `auth_token=${tokenAdminB}`)
        .send({
          name: 'Coca-Cola A',  // Même nom!
          category: 'Boissons',
          price: 600,
          costPrice: 400,
          stock: 30
        })
      
      expect(res.status).toBe(201)
      expect(res.body.tenantId).toBe(tenantB.id)
      // Les deux produits existent mais dans des tenants différents
    })
    
    it('Test 3: Les deux produits restent distincts', async () => {
      const productsA = await request(app)
        .get('/api/inventory/products')
        .set('Cookie', `auth_token=${tokenAdminA}`)
      
      const productsB = await request(app)
        .get('/api/inventory/products')
        .set('Cookie', `auth_token=${tokenAdminB}`)
      
      expect(productsA.body.length).toBe(1)
      expect(productsB.body.length).toBe(1)
      expect(productsA.body[0].price).toBe(500)
      expect(productsB.body[0].price).toBe(600)
    })
    
    it('Test 4: Admin A NE PEUT PAS voir produit de Admin B', async () => {
      const res = await request(app)
        .get('/api/inventory/products')
        .set('Cookie', `auth_token=${tokenAdminA}`)
      
      const adminBProducts = res.body.filter(p => p.tenantId === tenantB.id)
      expect(adminBProducts.length).toBe(0)
    })
    
    it('Test 5: Admin A NE PEUT PAS modifier produit de Admin B', async () => {
      // D'abord obtenir l'ID du produit de B
      const productsB = await prisma.product.findMany({
        where: { tenantId: tenantB.id }
      })
      
      const productBId = productsB[0].id
      
      const res = await request(app)
        .patch(`/api/inventory/products/${productBId}`)
        .set('Cookie', `auth_token=${tokenAdminA}`)
        .send({ price: 9999 })
      
      expect(res.status).toBe(403)  // Forbidden
      
      // Vérifier que le prix n'a pas changé
      const product = await prisma.product.findUnique({
        where: { id: productBId }
      })
      expect(product?.salePrice).toBe(600)  // Unchanged
    })
  })
  
  // ===== TESTS PERMISSIONS =====
  
  describe('Permissions', () => {
    
    it('Test 6: Admin peut créer un produit', async () => {
      const res = await request(app)
        .post('/api/inventory/products')
        .set('Cookie', `auth_token=${tokenAdminA}`)
        .send({
          name: 'Produit Admin',
          category: 'Test',
          price: 1000,
          costPrice: 600
        })
      
      expect(res.status).toBe(201)
    })
    
    it('Test 7: Caissier NE PEUT PAS créer produit', async () => {
      const res = await request(app)
        .post('/api/inventory/products')
        .set('Cookie', `auth_token=${tokenCashierA}`)
        .send({
          name: 'Produit Caissier',
          category: 'Test',
          price: 1000
        })
      
      expect(res.status).toBe(403)  // Forbidden
    })
    
    it('Test 8: Caissier NE PEUT PAS modifier seuils', async () => {
      const res = await request(app)
        .patch('/api/inventory/thresholds')
        .set('Cookie', `auth_token=${tokenCashierA}`)
        .send({
          thresholdOrange: 15,
          thresholdRed: 8
        })
      
      expect(res.status).toBe(403)  // Forbidden
    })
    
    it('Test 9: Admin peut modifier seuils', async () => {
      const res = await request(app)
        .patch('/api/inventory/thresholds')
        .set('Cookie', `auth_token=${tokenAdminA}`)
        .send({
          thresholdOrange: 15,
          thresholdRed: 8
        })
      
      expect(res.status).toBe(200)
      expect(res.body.defaultThresholdOrange).toBe(15)
      expect(res.body.defaultThresholdRed).toBe(8)
    })
    
    it('Test 10: Caissier peut LIRE produits', async () => {
      const res = await request(app)
        .get('/api/inventory/products')
        .set('Cookie', `auth_token=${tokenCashierA}`)
      
      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
    })
  })
  
  // ===== TESTS STOCK & CALCULS =====
  
  describe('Stock Management', () => {
    
    let productId: string
    
    beforeAll(async () => {
      const product = await prisma.product.create({
        data: {
          name: 'Stock Test Product',
          tenantId: tenantA.id,
          salePrice: 1000,
          costPrice: 600,
          currentStock: 100
        }
      })
      productId = product.id
    })
    
    it('Test 11: Enregistrer mouvement SALE', async () => {
      const res = await request(app)
        .post(`/api/inventory/products/${productId}/stock`)
        .set('Cookie', `auth_token=${tokenAdminA}`)
        .send({
          quantity: -5,
          type: 'SALE',
          reason: 'Vente normale'
        })
      
      expect(res.status).toBe(200)
      
      // Vérifier le mouvement
      const movements = await prisma.stockMovement.findMany({
        where: { productId }
      })
      
      expect(movements.length).toBe(1)
      expect(movements[0].type).toBe('SALE')
      expect(movements[0].quantity).toBe(5)
      expect(movements[0].stockBefore).toBe(100)
      expect(movements[0].stockAfter).toBe(95)
    })
    
    it('Test 12: Enregistrer mouvement REFUND', async () => {
      const res = await request(app)
        .post(`/api/inventory/products/${productId}/stock`)
        .set('Cookie', `auth_token=${tokenAdminA}`)
        .send({
          quantity: 3,
          type: 'REFUND',
          reason: 'Retour client'
        })
      
      expect(res.status).toBe(200)
      
      const product = await prisma.product.findUnique({
        where: { id: productId }
      })
      
      expect(product?.currentStock).toBe(98)  // 95 + 3
    })
    
    it('Test 13: Calculs seuils NORMAL', async () => {
      const res = await request(app)
        .get(`/api/inventory/products/${productId}`)
        .set('Cookie', `auth_token=${tokenAdminA}`)
      
      // Stock = 98, seuils: orange=10, red=5
      expect(res.body.status).toBe('NORMAL')
    })
    
    it('Test 14: Calculs seuils LOW', async () => {
      // Diminuer le stock
      await prisma.product.update({
        where: { id: productId },
        data: { currentStock: 8 }
      })
      
      const res = await request(app)
        .get(`/api/inventory/products/${productId}`)
        .set('Cookie', `auth_token=${tokenAdminA}`)
      
      // Stock = 8, seuils: orange=10, red=5
      // 8 <= 10 et 8 > 5 → LOW
      expect(res.body.status).toBe('LOW')
    })
    
    it('Test 15: Calculs seuils CRITICAL', async () => {
      await prisma.product.update({
        where: { id: productId },
        data: { currentStock: 3 }
      })
      
      const res = await request(app)
        .get(`/api/inventory/products/${productId}`)
        .set('Cookie', `auth_token=${tokenAdminA}`)
      
      // Stock = 3, seuils: orange=10, red=5
      // 3 <= 5 → CRITICAL
      expect(res.body.status).toBe('CRITICAL')
    })
  })
  
  // ===== TESTS PRIX =====
  
  describe('Price Management', () => {
    
    let productId: string
    
    beforeAll(async () => {
      const product = await prisma.product.create({
        data: {
          name: 'Price Test Product',
          tenantId: tenantA.id,
          salePrice: 2000,
          costPrice: 1200,
          currentStock: 50
        }
      })
      productId = product.id
    })
    
    it('Test 16: Prix d\'achat conservé', async () => {
      const product = await prisma.product.findUnique({
        where: { id: productId }
      })
      
      expect(product?.costPrice).toBe(1200)
    })
    
    it('Test 17: Prix de vente conservé', async () => {
      const product = await prisma.product.findUnique({
        where: { id: productId }
      })
      
      expect(product?.salePrice).toBe(2000)
    })
  })
  
  // ===== TESTS TENANT ISOLATION SÉCURITÉ =====
  
  describe('Security - TenantId Immutability', () => {
    
    it('Test 18: Client NE PEUT PAS modifier tenantId', async () => {
      const product = await prisma.product.findFirst({
        where: { tenantId: tenantA.id }
      })
      
      const res = await request(app)
        .patch(`/api/inventory/products/${product?.id}`)
        .set('Cookie', `auth_token=${tokenAdminA}`)
        .send({
          name: 'Hacked Name',
          tenantId: tenantB.id  // Tentative de changer le tenant!
        })
      
      expect(res.status).toBe(200)
      
      // Vérifier que tenantId n'a pas changé
      const updated = await prisma.product.findUnique({
        where: { id: product?.id }
      })
      
      expect(updated?.tenantId).toBe(tenantA.id)  // Unchanged
    })
  })
})

// ===== HELPERS =====

function generateToken(user: any): string {
  // Simplifié pour les tests
  return jwt.sign(
    {
      userId: user.id,
      username: user.username,
      role: user.role,
      tenantId: user.tenantId
    },
    process.env.JWT_SECRET!
  )
}
```

---

## COMMANDES D'EXÉCUTION

```bash
# Lancer les tests
npm test

# Lancer avec verbose
npm test -- --verbose

# Un seul fichier de test
npm test inventory.test.ts

# Avec couverture
npm test -- --coverage

# Watch mode (redémarrer à chaque modification)
npm test -- --watch
```

---

## CHECKLIST AVANT COMMIT

- [ ] Tous les tests passent
- [ ] Couverture > 80%
- [ ] Pas de console.log() restants
- [ ] Aucune modification du Payment Engine
- [ ] Tenant isolation vérifiée
- [ ] Permissions vérifiées
- [ ] Validation des données
- [ ] Pas de SQL injection
- [ ] Audit logs enregistrés

---

## RÉSULTATS ATTENDUS

```
PASS  src/__tests__/inventory.test.ts
  Multi-tenant Isolation
    ✓ Test 1: Admin A crée un produit (50 ms)
    ✓ Test 2: Admin B crée produit avec même nom (30 ms)
    ✓ Test 3: Les deux produits restent distincts (25 ms)
    ✓ Test 4: Admin A NE PEUT PAS voir produit de Admin B (20 ms)
    ✓ Test 5: Admin A NE PEUT PAS modifier produit de Admin B (35 ms)
  Permissions
    ✓ Test 6: Admin peut créer un produit (40 ms)
    ✓ Test 7: Caissier NE PEUT PAS créer produit (25 ms)
    ✓ Test 8: Caissier NE PEUT PAS modifier seuils (20 ms)
    ✓ Test 9: Admin peut modifier seuils (30 ms)
    ✓ Test 10: Caissier peut LIRE produits (25 ms)
  Stock Management
    ✓ Test 11: Enregistrer mouvement SALE (35 ms)
    ✓ Test 12: Enregistrer mouvement REFUND (30 ms)
    ✓ Test 13: Calculs seuils NORMAL (20 ms)
    ✓ Test 14: Calculs seuils LOW (22 ms)
    ✓ Test 15: Calculs seuils CRITICAL (18 ms)
  Price Management
    ✓ Test 16: Prix d'achat conservé (15 ms)
    ✓ Test 17: Prix de vente conservé (15 ms)
  Security - TenantId Immutability
    ✓ Test 18: Client NE PEUT PAS modifier tenantId (40 ms)

Test Suites: 1 passed, 1 total
Tests: 18 passed, 18 total
```

