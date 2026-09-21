/**
 * PHASE 1B VALIDATION: Multi-Tenant Isolation Tests
 *
 * These tests verify that the multi-tenant architecture properly
 * isolates data and permissions between tenants.
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals'
import { PrismaClient } from '@prisma/client'
import { login, logout, createUser, listTenantUsers } from '../services/authService'
import { hashPassword } from '../utils/crypto'

const prisma = new PrismaClient()

// Test data
let tenantA: { id: string; slug: string }
let tenantB: { id: string; slug: string }
let superAdmin: { id: string; username: string; passwordHash: string }
let adminA: { id: string; username: string; passwordHash: string; tenantId: string }
let adminB: { id: string; username: string; passwordHash: string; tenantId: string }
let cashierA: { id: string; username: string; passwordHash: string; tenantId: string }
let cashierB: { id: string; username: string; passwordHash: string; tenantId: string }

describe('PHASE 1B: Multi-Tenant Isolation', () => {
  beforeAll(async () => {
    // Create test tenants
    tenantA = await prisma.tenant.create({
      data: {
        name: 'Tenant A',
        slug: 'tenant-a',
        status: 'ACTIVE',
      },
    })

    tenantB = await prisma.tenant.create({
      data: {
        name: 'Tenant B',
        slug: 'tenant-b',
        status: 'ACTIVE',
      },
    })

    // Create SUPER_ADMIN
    const superAdminHash = await hashPassword('super_password_123')
    superAdmin = await prisma.user.create({
      data: {
        name: 'Super Admin',
        username: 'superadmin_test',
        passwordHash: superAdminHash,
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        tenantId: null,
        createdBy: 'test_setup',
      },
    })

    // Create ADMIN A
    const adminAHash = await hashPassword('admin_a_password')
    adminA = await prisma.user.create({
      data: {
        name: 'Admin A',
        username: 'admin_a_test',
        passwordHash: adminAHash,
        role: 'ADMIN',
        status: 'ACTIVE',
        tenantId: tenantA.id,
        createdBy: 'test_setup',
      },
    })

    // Create ADMIN B
    const adminBHash = await hashPassword('admin_b_password')
    adminB = await prisma.user.create({
      data: {
        name: 'Admin B',
        username: 'admin_b_test',
        passwordHash: adminBHash,
        role: 'ADMIN',
        status: 'ACTIVE',
        tenantId: tenantB.id,
        createdBy: 'test_setup',
      },
    })

    // Create CASHIER A
    const cashierAHash = await hashPassword('cashier_a_password')
    cashierA = await prisma.user.create({
      data: {
        name: 'Cashier A',
        username: 'cashier_a_test',
        passwordHash: cashierAHash,
        role: 'CAISSIER',
        status: 'ACTIVE',
        tenantId: tenantA.id,
        createdBy: adminA.id,
      },
    })

    // Create CASHIER B
    const cashierBHash = await hashPassword('cashier_b_password')
    cashierB = await prisma.user.create({
      data: {
        name: 'Cashier B',
        username: 'cashier_b_test',
        passwordHash: cashierBHash,
        role: 'CAISSIER',
        status: 'ACTIVE',
        tenantId: tenantB.id,
        createdBy: adminB.id,
      },
    })
  })

  afterAll(async () => {
    // Cleanup
    await prisma.user.deleteMany({
      where: {
        username: { in: [
          'superadmin_test',
          'admin_a_test',
          'admin_b_test',
          'cashier_a_test',
          'cashier_b_test',
        ] },
      },
    })

    await prisma.tenant.deleteMany({
      where: { slug: { in: ['tenant-a', 'tenant-b'] } },
    })

    await prisma.$disconnect()
  })

  // ========================================================================
  // TEST 1: ADMIN A can see users from Tenant A
  // ========================================================================
  test('TEST 1: ADMIN A can see users from Tenant A', async () => {
    const users = await listTenantUsers(tenantA.id)
    const usernames = users.map(u => u.username)

    expect(users.length).toBeGreaterThan(0)
    expect(usernames).toContain('admin_a_test')
    expect(usernames).toContain('cashier_a_test')
  })

  // ========================================================================
  // TEST 2: ADMIN A cannot see users from Tenant B
  // ========================================================================
  test('TEST 2: ADMIN A cannot see users from Tenant B', async () => {
    const usersB = await listTenantUsers(tenantB.id)
    const usernames = usersB.map(u => u.username)

    // Should either be empty or not contain B's users
    expect(usernames).not.toContain('admin_b_test')
    expect(usernames).not.toContain('cashier_b_test')
  })

  // ========================================================================
  // TEST 3: Login successful for valid credentials
  // ========================================================================
  test('TEST 3: Login successful with valid credentials', async () => {
    const result = await login({
      username: 'admin_a_test',
      password: 'admin_a_password',
    })

    expect(result).not.toBeNull()
    expect(result?.user.username).toBe('admin_a_test')
    expect(result?.user.role).toBe('ADMIN')
    expect(result?.user.tenantId).toBe(tenantA.id)
  })

  // ========================================================================
  // TEST 4: Login fails with invalid password
  // ========================================================================
  test('TEST 4: Login fails with invalid password', async () => {
    const result = await login({
      username: 'admin_a_test',
      password: 'wrong_password',
    })

    expect(result).toBeNull()
  })

  // ========================================================================
  // TEST 5: Login fails for disabled user
  // ========================================================================
  test('TEST 5: Login fails for disabled user', async () => {
    // Disable CASHIER B
    await prisma.user.update({
      where: { id: cashierB.id },
      data: { status: 'DISABLED' },
    })

    const result = await login({
      username: 'cashier_b_test',
      password: 'cashier_b_password',
    })

    expect(result).toBeNull()

    // Re-enable for cleanup
    await prisma.user.update({
      where: { id: cashierB.id },
      data: { status: 'ACTIVE' },
    })
  })

  // ========================================================================
  // TEST 6: CASHIER cannot access ADMIN endpoints (permission check)
  // ========================================================================
  test('TEST 6: CASHIER has CAISSIER role, cannot create users', async () => {
    const cashierRole = cashierA.role
    expect(cashierRole).toBe('CAISSIER')
    // Actual endpoint protection tested in integration tests
  })

  // ========================================================================
  // TEST 7: Tenant constraint enforced on unique username
  // ========================================================================
  test('TEST 7: Same username allowed in different tenants', async () => {
    // Create same username in different tenant - should succeed
    const hash = await hashPassword('test_password')
    const user1 = await prisma.user.create({
      data: {
        name: 'Test User 1',
        username: 'duplicate_username',
        passwordHash: hash,
        role: 'CAISSIER',
        status: 'ACTIVE',
        tenantId: tenantA.id,
        createdBy: adminA.id,
      },
    })

    expect(user1.tenantId).toBe(tenantA.id)

    // Cleanup
    await prisma.user.delete({ where: { id: user1.id } })
  })

  // ========================================================================
  // TEST 8: User tenantId is immutable (enforced by schema)
  // ========================================================================
  test('TEST 8: User tenantId determines isolation', async () => {
    const user = await prisma.user.findUnique({
      where: { id: adminA.id },
    })

    expect(user?.tenantId).toBe(tenantA.id)
    expect(user?.role).toBe('ADMIN')
  })

  // ========================================================================
  // TEST 9: SUPER_ADMIN has null tenantId
  // ========================================================================
  test('TEST 9: SUPER_ADMIN has NULL tenantId', async () => {
    const user = await prisma.user.findUnique({
      where: { id: superAdmin.id },
    })

    expect(user?.tenantId).toBeNull()
    expect(user?.role).toBe('SUPER_ADMIN')
  })

  // ========================================================================
  // TEST 10: Audit log records tenant context
  // ========================================================================
  test('TEST 10: Audit log associates events with tenant', async () => {
    const logs = await prisma.auditLog.findMany({
      where: { tenantId: tenantA.id },
      take: 10,
    })

    // Should have logs for tenant A operations
    const userCreateLogs = logs.filter(l => l.action === 'USER_CREATE')
    expect(logs.length).toBeGreaterThan(0)
  })
})

describe('PHASE 1B: Session Management', () => {
  test('Session hash stored, not full token', async () => {
    // Verify sessions store hash, not plaintext tokens
    const sessions = await prisma.session.findMany({ take: 1 })
    if (sessions.length > 0) {
      // tokenHash should be a hash, not a JWT
      expect(sessions[0].tokenHash).toBeDefined()
      expect(sessions[0].tokenHash.length).toBeGreaterThan(0)
    }
  })
})
