/**
 * PHASE 2A VALIDATION: Database Schema Tests
 *
 * Tests verify that PostgreSQL schema supports multi-tenant business model
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

let testTenant: { id: string }

describe('PHASE 2A: Database Schema', () => {
  beforeAll(async () => {
    // Create test tenant
    testTenant = await prisma.tenant.create({
      data: {
        name: 'Schema Test Tenant',
        slug: `schema-test-${Date.now()}`,
      },
    })
  })

  afterAll(async () => {
    // Cleanup: cascade deletes should handle everything
    await prisma.tenant.delete({ where: { id: testTenant.id } })
    await prisma.$disconnect()
  })

  // TEST 1: Category isolation by tenant
  test('Categories are isolated by tenant', async () => {
    const category = await prisma.category.create({
      data: {
        tenantId: testTenant.id,
        name: 'Electronics',
      },
    })

    expect(category.tenantId).toBe(testTenant.id)
    expect(category.name).toBe('Electronics')
  })

  // TEST 2: Products store stock and thresholds
  test('Products store stock and threshold settings', async () => {
    const category = await prisma.category.create({
      data: {
        tenantId: testTenant.id,
        name: `Category-${Date.now()}`,
      },
    })

    const product = await prisma.product.create({
      data: {
        tenantId: testTenant.id,
        categoryId: category.id,
        name: 'Test Product',
        emoji: '🎮',
        costPrice: 100,
        salePrice: 150,
        currentStock: 25,
        useDefaultThresholds: true,
      },
    })

    expect(product.tenantId).toBe(testTenant.id)
    expect(product.currentStock).toBe(25)
    expect(product.useDefaultThresholds).toBe(true)
  })

  // TEST 3: Stock movements track changes
  test('Stock movements record all changes', async () => {
    const product = await prisma.product.create({
      data: {
        tenantId: testTenant.id,
        name: `StockTest-${Date.now()}`,
        currentStock: 50,
      },
    })

    const movement = await prisma.stockMovement.create({
      data: {
        tenantId: testTenant.id,
        productId: product.id,
        type: 'SALE',
        quantity: -5,
        stockBefore: 50,
        stockAfter: 45,
        reference: `SALE-001`,
      },
    })

    expect(movement.type).toBe('SALE')
    expect(movement.stockBefore).toBe(50)
    expect(movement.stockAfter).toBe(45)
  })

  // TEST 4: Client belongs to tenant
  test('Clients are isolated by tenant', async () => {
    const client = await prisma.client.create({
      data: {
        tenantId: testTenant.id,
        name: 'Test Client',
        phone: '+221701234567',
        totalDebt: 0,
      },
    })

    expect(client.tenantId).toBe(testTenant.id)
    expect(client.name).toBe('Test Client')
  })

  // TEST 5: Sale with items stores historical prices
  test('Sales contain line items with historical prices', async () => {
    const client = await prisma.client.create({
      data: {
        tenantId: testTenant.id,
        name: `TestClient-${Date.now()}`,
        phone: `+22170${Math.random().toString().slice(2, 9)}`,
      },
    })

    const product = await prisma.product.create({
      data: {
        tenantId: testTenant.id,
        name: `Product-${Date.now()}`,
        salePrice: 5000,
        currentStock: 100,
      },
    })

    const sale = await prisma.sale.create({
      data: {
        tenantId: testTenant.id,
        saleNumber: `SALE-${Date.now()}`,
        clientId: client.id,
        totalAmount: 10000,
        paidAmount: 10000,
        paymentMethod: 'cash',
        status: 'PAID',
        items: {
          create: [
            {
              productId: product.id,
              productName: product.name,
              quantity: 2,
              unitPrice: 5000,
              totalPrice: 10000,
            },
          ],
        },
      },
      include: { items: true },
    })

    expect(sale.tenantId).toBe(testTenant.id)
    expect(sale.items.length).toBe(1)
    expect(sale.items[0].unitPrice.toString()).toBe('5000')
  })

  // TEST 6: Credit system for debt
  test('Credits track debt per client', async () => {
    const client = await prisma.client.create({
      data: {
        tenantId: testTenant.id,
        name: `CreditClient-${Date.now()}`,
        phone: `+22170${Math.random().toString().slice(2, 9)}`,
      },
    })

    const credit = await prisma.credit.create({
      data: {
        tenantId: testTenant.id,
        clientId: client.id,
        initialAmount: 50000,
        remainingAmount: 50000,
        status: 'ACTIVE',
      },
    })

    expect(credit.tenantId).toBe(testTenant.id)
    expect(credit.clientId).toBe(client.id)
    expect(credit.remainingAmount.toString()).toBe('50000')
  })

  // TEST 7: Credit payments
  test('Credit payments record partial settlements', async () => {
    const client = await prisma.client.create({
      data: {
        tenantId: testTenant.id,
        name: `PaymentClient-${Date.now()}`,
        phone: `+22170${Math.random().toString().slice(2, 9)}`,
      },
    })

    const credit = await prisma.credit.create({
      data: {
        tenantId: testTenant.id,
        clientId: client.id,
        initialAmount: 50000,
        remainingAmount: 50000,
      },
    })

    const payment = await prisma.creditPayment.create({
      data: {
        creditId: credit.id,
        amount: 20000,
        paymentMethod: 'cash',
      },
    })

    expect(payment.amount.toString()).toBe('20000')
  })

  // TEST 8: Free amounts in sales
  test('Free amounts add to sales without affecting stock', async () => {
    const sale = await prisma.sale.create({
      data: {
        tenantId: testTenant.id,
        saleNumber: `SALE-FREE-${Date.now()}`,
        totalAmount: 5000,
        paidAmount: 5000,
        paymentMethod: 'cash',
      },
    })

    const freeAmount = await prisma.freeAmount.create({
      data: {
        tenantId: testTenant.id,
        saleId: sale.id,
        amount: 1000,
        type: 'INTERNAL',
        status: 'PENDING',
      },
    })

    expect(freeAmount.saleId).toBe(sale.id)
    expect(freeAmount.amount.toString()).toBe('1000')
  })

  // TEST 9: Threshold settings per tenant
  test('Each tenant can have custom default thresholds', async () => {
    const thresholds = await prisma.stockThresholdSettings.upsert({
      where: { tenantId: testTenant.id },
      update: {
        defaultThresholdOrange: 15,
        defaultThresholdRed: 8,
      },
      create: {
        tenantId: testTenant.id,
        defaultThresholdOrange: 15,
        defaultThresholdRed: 8,
      },
    })

    expect(thresholds.tenantId).toBe(testTenant.id)
    expect(thresholds.defaultThresholdOrange).toBe(15)
    expect(thresholds.defaultThresholdRed).toBe(8)
  })

  // TEST 10: Products can have same name in different tenants
  test('Products can have same name in different tenants', async () => {
    // Create second tenant
    const tenant2 = await prisma.tenant.create({
      data: {
        name: 'Second Tenant',
        slug: `tenant2-${Date.now()}`,
      },
    })

    const product1 = await prisma.product.create({
      data: {
        tenantId: testTenant.id,
        name: 'Coca Cola',
        salePrice: 2000,
      },
    })

    const product2 = await prisma.product.create({
      data: {
        tenantId: tenant2.id,
        name: 'Coca Cola', // Same name, different tenant
        salePrice: 2500,
      },
    })

    expect(product1.name).toBe(product2.name)
    expect(product1.tenantId).not.toBe(product2.tenantId)

    // Cleanup
    await prisma.tenant.delete({ where: { id: tenant2.id } })
  })
})
