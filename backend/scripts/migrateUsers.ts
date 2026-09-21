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
    console.log('📂 Loading users from backup file...')
    const data = fs.readFileSync(backupPath, 'utf-8')
    return JSON.parse(data)
  }

  // Return default admin user for testing
  console.log('⚠️ No backup file found, using default admin user')
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
  console.log('NIATALA USER MIGRATION: localStorage → PostgreSQL')
  console.log('='.repeat(60))

  try {
    // Step 1: Get legacy users
    console.log('\n1️⃣  Reading legacy users...')
    const legacyUsers = await getLocalStorageBackup()
    console.log(`   Found ${legacyUsers.length} users to migrate`)

    if (legacyUsers.length === 0) {
      console.log('   ⚠️ No users to migrate, exiting')
      return
    }

    // Step 2: Create or get INITIAL_TENANT
    console.log('\n2️⃣  Creating/retrieving initial tenant...')
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
      console.log(`   ✅ Created tenant: ${tenant.name}`)
    } else {
      console.log(`   ✅ Using existing tenant: ${tenant.name}`)
    }

    // Step 3: Migrate users
    console.log('\n3️⃣  Migrating users...')
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
          console.log(`   ⏭️  User ${legacyUser.username} already exists, skipping`)
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
        console.log(`   ❌ Failed: ${legacyUser.username} - ${errorMsg}`)
      }
    }

    // Step 4: Set initial admin as tenant owner
    if (migratedUsers.length > 0) {
      const firstAdmin = migratedUsers.find((u) => u.role === 'ADMIN') || migratedUsers[0]
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { ownerId: firstAdmin.id },
      })
      console.log(`\n4️⃣  Set tenant owner: ${firstAdmin.username}`)
    }

    // Step 5: Verify migration
    console.log('\n5️⃣  Verifying migration...')
    const allUsers = await prisma.user.findMany({
      where: { tenantId: tenant.id },
    })

    console.log(`   Total users in database: ${allUsers.length}`)
    console.log(`   Successfully migrated: ${migratedUsers.length}`)
    console.log(`   Failed: ${errors.length}`)

    // Verify bcrypt hashes
    const bcryptCount = allUsers.filter((u) => isBcryptHash(u.passwordHash)).length
    console.log(`   Bcrypt hashes: ${bcryptCount}/${allUsers.length}`)

    if (errors.length > 0) {
      console.log('\n⚠️  Errors encountered:')
      errors.forEach(({ user, error }) => {
        console.log(`   - ${user}: ${error}`)
      })
    }

    console.log('\n' + '='.repeat(60))
    console.log('✅ MIGRATION COMPLETE')
    console.log('='.repeat(60))
  } catch (error) {
    console.error('\n❌ MIGRATION FAILED:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run migration
migrateUsers()
