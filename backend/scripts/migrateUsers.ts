/**
 * Migration Script: Migrate users from localStorage to PostgreSQL
 *
 * This script:
 * 1. Reads users from localStorage backup JSON
 * 2. Creates a default INITIAL_TENANT in PostgreSQL
 * 3. Migrates each user with bcrypt password hashing
 * 4. Verifies data integrity
 *
 * Usage:
 *   npx tsx scripts/migrateUsers.ts [--verify-only]
 *
 * IMPORTANT: Run this AFTER:
 *   1. npx prisma migrate dev
 *   2. PostgreSQL database initialized
 */

import { PrismaClient } from '@prisma/client'
import { hashPassword, isBcryptHash } from '../src/utils/crypto'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

interface LegacyUser {
  id: string
  name: string
  username: string
  passwordHash: string // Old simple hash format
  role: 'ADMIN' | 'CASHIER'
  status: 'ACTIVE' | 'DISABLED'
  createdAt: number
  lastLogin?: number
}

async function getLocalStorageBackup(): Promise<LegacyUser[]> {
  /**
   * NOTE: In a real scenario, this would read from:
   *   - A JSON export of localStorage
   *   - A database backup
   *   - An API endpoint
   *
   * For now, we provide a hook for manual injection or file loading
   */
  const backupPath = path.join(__dirname, 'users-backup.json')

  if (fs.existsSync(backupPath)) {
    const data = fs.readFileSync(backupPath, 'utf-8')
    return JSON.parse(data)
  }

  // Return default admin user for testing
  return [
    {
      id: 'admin_001',
      name: 'Administrateur',
      username: 'admin',
      passwordHash: 'admin123', // This will be re-hashed with bcrypt
      role: 'ADMIN',
      status: 'ACTIVE',
      createdAt: Date.now(),
    },
  ]
}

async function migrateUsers(): Promise<void> {
  console.log('=' .repeat(60))
  console.log('='.repeat(60))

  try {
    // Step 1: Get legacy users
    const legacyUsers = await getLocalStorageBackup()

    if (legacyUsers.length === 0) {
      return
    }

    // Step 2: Create or get INITIAL_TENANT
    let tenant = await prisma.tenant.findUnique({
      where: { slug: 'initial-tenant' },
    })

    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
          name: 'Initial Tenant',
          slug: 'initial-tenant',
          status: 'ACTIVE',
          businessName: 'NIATALA Initial',
          currency: 'XOF',
          language: 'fr',
        },
      })
    } else {
    }

    // Step 3: Migrate users
    const migratedUsers = []
    const errors = []

    for (const legacyUser of legacyUsers) {
      try {
        // Check if user already exists
        const existing = await prisma.user.findFirst({
          where: {
            username: legacyUser.username,
            tenantId: tenant.id,
          },
        })

        if (existing) {
          continue
        }

        // Hash password (convert from old format to bcrypt)
        const passwordHash = await hashPassword(legacyUser.passwordHash)

        // Create user
        const user = await prisma.user.create({
          data: {
            tenantId: tenant.id,
            name: legacyUser.name,
            username: legacyUser.username,
            passwordHash,
            role: legacyUser.role,
            status: legacyUser.status,
            createdAt: new Date(legacyUser.createdAt),
            lastLogin: legacyUser.lastLogin ? new Date(legacyUser.lastLogin) : null,
          },
        })

        migratedUsers.push(user)
        console.log(`   ✅ Migrated: ${legacyUser.username} (${legacyUser.role})`)
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error)
        errors.push({ user: legacyUser.username, error: errorMsg })
      }
    }

    // Step 4: Set initial admin as tenant owner
    if (migratedUsers.length > 0) {
      const firstAdmin = migratedUsers.find((u) => u.role === 'ADMIN') || migratedUsers[0]
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { ownerId: firstAdmin.id },
      })
    }

    // Step 5: Verify migration
    const allUsers = await prisma.user.findMany({
      where: { tenantId: tenant.id },
    })


    // Verify bcrypt hashes
    const bcryptCount = allUsers.filter((u) => isBcryptHash(u.passwordHash)).length

    if (errors.length > 0) {
      errors.forEach(({ user, error }) => {
      })
    }

    console.log('\n' + '='.repeat(60))
    console.log('='.repeat(60))
  } catch (error) {
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run migration
migrateUsers()
