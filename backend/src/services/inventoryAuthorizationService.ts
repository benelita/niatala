import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Grant inventory authorization to a cashier for 12 hours
 */
export async function grantInventoryAccess(
  tenantId: string,
  userId: string,
  grantedBy: string
) {
  const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000) // 12 hours from now

  // Remove existing authorization if any
  await prisma.inventoryAuthorization.deleteMany({
    where: {
      tenantId,
      userId,
    },
  })

  // Create new authorization
  const auth = await prisma.inventoryAuthorization.create({
    data: {
      tenantId,
      userId,
      grantedBy,
      expiresAt,
    },
  })

  return auth
}

/**
 * Check if user has valid inventory authorization
 */
export async function hasInventoryAccess(tenantId: string, userId: string): Promise<boolean> {
  const auth = await prisma.inventoryAuthorization.findFirst({
    where: {
      tenantId,
      userId,
      revokedAt: null,
      expiresAt: {
        gt: new Date(),
      },
    },
  })

  return !!auth
}

/**
 * Get active inventory authorization for a user
 */
export async function getInventoryAuthorization(tenantId: string, userId: string) {
  return prisma.inventoryAuthorization.findFirst({
    where: {
      tenantId,
      userId,
      revokedAt: null,
      expiresAt: {
        gt: new Date(),
      },
    },
    include: {
      grantedByUser: {
        select: {
          id: true,
          name: true,
          username: true,
        },
      },
    },
  })
}

/**
 * Get all active authorizations for a tenant
 */
export async function getActiveAuthorizations(tenantId: string) {
  return prisma.inventoryAuthorization.findMany({
    where: {
      tenantId,
      revokedAt: null,
      expiresAt: {
        gt: new Date(),
      },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          username: true,
        },
      },
      grantedByUser: {
        select: {
          id: true,
          name: true,
          username: true,
        },
      },
    },
    orderBy: {
      expiresAt: 'asc',
    },
  })
}

/**
 * Revoke inventory authorization
 */
export async function revokeInventoryAccess(
  tenantId: string,
  userId: string,
  revokedBy: string
) {
  const auth = await prisma.inventoryAuthorization.findFirst({
    where: {
      tenantId,
      userId,
    },
  })

  if (!auth) {
    return null
  }

  return prisma.inventoryAuthorization.update({
    where: {
      id: auth.id,
    },
    data: {
      revokedAt: new Date(),
      revokedBy,
    },
  })
}
