/**
 * Bootstrap script: Create first SUPER_ADMIN
 *
 * Usage: npx ts-node scripts/bootstrap.ts
 *
 * Requires environment variables:
 * - BOOTSTRAP_USERNAME: username for super admin
 * - BOOTSTRAP_PASSWORD: password for super admin (NEVER store in .env, use --password flag)
 * - BOOTSTRAP_NAME: name for super admin
 * - BOOTSTRAP_FORCE: set to "true" to overwrite existing super admins (dangerous!)
 */

import dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/utils/crypto'

dotenv.config()

const prisma = new PrismaClient()

async function bootstrap() {
  try {
    const username = process.env.BOOTSTRAP_USERNAME || 'admin'
    const password = process.env.BOOTSTRAP_PASSWORD
    const name = process.env.BOOTSTRAP_NAME || 'NIATALA Admin'
    const force = process.env.BOOTSTRAP_FORCE === 'true'

    if (!password) {
      process.exit(1)
    }

    if (password.length < 8) {
      process.exit(1)
    }

    // Check if super admin already exists
    const existing = await prisma.user.findFirst({
      where: {
        role: 'SUPER_ADMIN',
        tenantId: null,
      },
    })

    if (existing && !force) {
      process.exit(0)
    }

    if (existing && force) {
      await prisma.user.delete({ where: { id: existing.id } })
    }

    // Check if username already exists
    const userExists = await prisma.user.findFirst({
      where: { username },
    })

    if (userExists) {
      process.exit(1)
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Create SUPER_ADMIN
    const superAdmin = await prisma.user.create({
      data: {
        name,
        username,
        passwordHash,
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        tenantId: null, // NULL for SUPER_ADMIN
        createdBy: 'bootstrap',
      },
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: superAdmin.id,
        tenantId: null,
        action: 'SYSTEM_BOOTSTRAP',
        resourceType: 'USER',
        resourceId: superAdmin.id,
        details: {
          username: superAdmin.username,
          role: superAdmin.role,
          bootstrapped: true,
        },
        status: 'SUCCESS',
      },
    })


    process.exit(0)
  } catch (error) {
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

bootstrap()
