import { Router, Response, NextFunction } from 'express'
import { createUser, listTenantUsers } from '../services/authService'
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const router = Router()

/**
 * Middleware: Verify user is ADMIN or SUPER_ADMIN
 */
function requireAdminOrSuper(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user || (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN')) {
    res.status(403).json({ error: 'Admin access required' })
    return
  }
  next()
}

/**
 * Middleware: Verify user is SUPER_ADMIN
 */
function requireSuper(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'SUPER_ADMIN') {
    res.status(403).json({ error: 'Super admin access required' })
    return
  }
  next()
}

/**
 * ADMIN: GET /admin/users
 * List users in ADMIN's tenant
 */
router.get('/users', authMiddleware, requireAdminOrSuper, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' })
      return
    }

    // ADMIN can only see their own tenant
    if (req.user.role === 'ADMIN') {
      if (!req.user.tenantId) {
        res.status(400).json({ error: 'Tenant not found' })
        return
      }
      const users = await listTenantUsers(req.user.tenantId)
      res.json({ users })
      return
    }

    // SUPER_ADMIN can see all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        status: true,
        tenantId: true,
        lastLogin: true,
      },
    })

    res.json({ users })
  } catch (error) {
    res.status(500).json({ error: 'Failed to list users' })
  }
})

/**
 * ADMIN: POST /admin/users
 * Create a new CASHIER (ADMIN) or new ADMIN (SUPER_ADMIN)
 */
router.post('/users', authMiddleware, requireAdminOrSuper, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    const { name, username, password, email, role } = req.body

    if (!name || !username || !password || !role) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // ADMIN can only create CASHIER in their tenant
    if (req.user.role === 'ADMIN') {
      if (role !== 'CASHIER') {
        return res.status(403).json({ error: 'Admin can only create cashiers' })
      }
      if (!req.user.tenantId) {
        return res.status(400).json({ error: 'Tenant not found' })
      }
    }

    // SUPER_ADMIN can create any role
    if (req.user.role === 'SUPER_ADMIN') {
      // SUPER_ADMIN users have tenantId = null
      if (role === 'SUPER_ADMIN' && !req.user.tenantId) {
        // This is OK for creating another SUPER_ADMIN
      } else if (role !== 'SUPER_ADMIN' && !req.body.tenantId) {
        return res.status(400).json({ error: 'tenantId required for non-super-admin users' })
      }
    }

    const result = await createUser({
      tenantId: req.user.role === 'ADMIN' ? req.user.tenantId : req.body.tenantId,
      name,
      username,
      password,
      email,
      role: role as 'ADMIN' | 'CASHIER',
      createdBy: req.user.id,
    })

    if (!result) {
      return res.status(400).json({ error: 'Failed to create user' })
    }

    res.status(201).json({
      message: 'User created successfully',
      user: result,
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user' })
  }
})

/**
 * ADMIN: PATCH /admin/users/:id
 * Update user status or basic info
 */
router.patch('/users/:id', authMiddleware, requireAdminOrSuper, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    const { id } = req.params
    const { status, name } = req.body

    // Fetch the target user
    const targetUser = await prisma.user.findUnique({ where: { id } })
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' })
    }

    // ADMIN can only modify users in their tenant
    if (req.user.role === 'ADMIN') {
      if (targetUser.tenantId !== req.user.tenantId) {
        return res.status(403).json({ error: 'Cannot modify users from other tenants' })
      }
    }

    // Update user
    const updates: any = {}
    if (status) updates.status = status
    if (name) updates.name = name
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update' })
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...updates,
        updatedBy: req.user.id,
      },
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        tenantId: req.user.tenantId,
        action: 'USER_UPDATE',
        resourceType: 'USER',
        resourceId: id,
        details: updates,
        status: 'SUCCESS',
      },
    })

    res.json({
      message: 'User updated successfully',
      user: {
        id: updated.id,
        username: updated.username,
        name: updated.name,
        status: updated.status,
      },
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' })
  }
})

/**
 * SUPER_ADMIN: GET /admin/tenants
 * List all tenants
 */
router.get('/tenants', authMiddleware, requireSuper, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tenants = await prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        subscriptionStatus: true,
        createdAt: true,
      },
    })

    res.json({ tenants })
  } catch (error) {
    res.status(500).json({ error: 'Failed to list tenants' })
  }
})

/**
 * SUPER_ADMIN: PATCH /admin/tenants/:id
 * Update tenant status
 */
router.patch('/tenants/:id', authMiddleware, requireSuper, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    const { id } = req.params
    const { status, subscriptionStatus } = req.body

    const tenant = await prisma.tenant.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(subscriptionStatus && { subscriptionStatus }),
      },
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        tenantId: id,
        action: 'TENANT_UPDATE',
        resourceType: 'TENANT',
        resourceId: id,
        details: { status, subscriptionStatus },
        status: 'SUCCESS',
      },
    })

    res.json({
      message: 'Tenant updated successfully',
      tenant: {
        id: tenant.id,
        name: tenant.name,
        status: tenant.status,
      },
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to update tenant' })
  }
})

/**
 * SUPER_ADMIN: GET /admin/audit
 * View audit logs
 */
router.get('/audit', authMiddleware, requireSuper, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { limit = 100, offset = 0, action, userId } = req.query

    const where: any = {}
    if (action) where.action = action
    if (userId) where.userId = userId

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Math.min(Number(limit), 1000),
      skip: Number(offset),
      select: {
        id: true,
        userId: true,
        tenantId: true,
        action: true,
        resourceType: true,
        status: true,
        createdAt: true,
      },
    })

    res.json({ logs })
  } catch (error) {
    res.status(500).json({ error: 'Failed to list audit logs' })
  }
})

export default router
