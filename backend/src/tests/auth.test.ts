/**
 * Phase 1 Auth Tests
 *
 * IMPORTANT: These are unit tests that can run WITHOUT database
 * Integration tests that need DB will be in separate files
 *
 * Run with: npm test
 */

import { hashPassword, comparePassword, isBcryptHash } from '../utils/crypto'
import { signToken, verifyToken, hashToken } from '../utils/jwt'

describe('Crypto Utilities', () => {
  test('bcrypt: Hash password', async () => {
    const password = 'secure_password_123'
    const hash = await hashPassword(password)

    // Should be bcrypt format
    expect(isBcryptHash(hash)).toBe(true)
    // Should not be plaintext
    expect(hash).not.toBe(password)
  })

  test('bcrypt: Compare password success', async () => {
    const password = 'secure_password_123'
    const hash = await hashPassword(password)
    const matches = await comparePassword(password, hash)

    expect(matches).toBe(true)
  })

  test('bcrypt: Compare password failure', async () => {
    const password = 'secure_password_123'
    const hash = await hashPassword(password)
    const matches = await comparePassword('wrong_password', hash)

    expect(matches).toBe(false)
  })

  test('bcrypt: Different hashes for same password (salt)', async () => {
    const password = 'secure_password_123'
    const hash1 = await hashPassword(password)
    const hash2 = await hashPassword(password)

    // Should be different due to salt
    expect(hash1).not.toBe(hash2)
    // But both should verify
    expect(await comparePassword(password, hash1)).toBe(true)
    expect(await comparePassword(password, hash2)).toBe(true)
  })

  test('bcrypt: Invalid hash format detection', () => {
    expect(isBcryptHash('not_a_hash')).toBe(false)
    expect(isBcryptHash('$2a$10$invalid')).toBe(false)
    expect(isBcryptHash('')).toBe(false)
  })
})

describe('JWT Utilities', () => {
  test('JWT: Sign and verify token', () => {
    const payload = {
      userId: 'user_123',
      username: 'testuser',
      role: 'ADMIN' as const,
      tenantId: 'tenant_123',
    }

    const token = signToken(payload)
    expect(token).toBeDefined()
    expect(typeof token).toBe('string')
    expect(token.split('.').length).toBe(3) // JWT has 3 parts
  })

  test('JWT: Verify valid token', () => {
    const payload = {
      userId: 'user_123',
      username: 'testuser',
      role: 'ADMIN' as const,
      tenantId: 'tenant_123',
    }

    const token = signToken(payload)
    const decoded = verifyToken(token)

    expect(decoded).toBeDefined()
    expect(decoded?.userId).toBe(payload.userId)
    expect(decoded?.username).toBe(payload.username)
    expect(decoded?.role).toBe(payload.role)
    expect(decoded?.tenantId).toBe(payload.tenantId)
  })

  test('JWT: Reject invalid token', () => {
    const decoded = verifyToken('invalid.token.here')
    expect(decoded).toBeNull()
  })

  test('JWT: Hash token for storage', () => {
    const token =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMifQ.signature'
    const hash = hashToken(token)

    // Should be SHA-256 hex (64 chars)
    expect(hash.length).toBe(64)
    expect(/^[a-f0-9]{64}$/.test(hash)).toBe(true)
    // Should be deterministic
    expect(hashToken(token)).toBe(hash)
  })

  test('JWT: Different tokens produce different hashes', () => {
    const token1 =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMifQ.signature1'
    const token2 =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMifQ.signature2'

    expect(hashToken(token1)).not.toBe(hashToken(token2))
  })
})

describe('Password Security', () => {
  test('Password should not be stored in JWT', () => {
    const payload = {
      userId: 'user_123',
      username: 'testuser',
      role: 'ADMIN' as const,
      tenantId: 'tenant_123',
    }

    const token = signToken(payload)
    const decoded = verifyToken(token)

    // Should NOT have password field
    expect((decoded as any).password).toBeUndefined()
    expect((decoded as any).passwordHash).toBeUndefined()
  })

  test('Old plaintext passwords should not be hashed', async () => {
    // Old hash format (not bcrypt)
    const oldHash = '12345678' // Simple example

    // Should not be a valid bcrypt hash
    expect(isBcryptHash(oldHash)).toBe(false)

    // When comparing with plaintext, should fail
    const matches = await comparePassword('password', oldHash)
    expect(matches).toBe(false)
  })
})

// Export for test runner
export {}
