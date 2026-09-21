import { Router, Response } from 'express'
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth'
import {
  grantInventoryAccess,
  revokeInventoryAccess,
  getActiveAuthorizations,
  getInventoryAuthorization,
} from '../services/inventoryAuthorizationService'

const router = Router()

/**
 * POST /inventory-authorization/grant
 * Admin grants inventory access to a cashier (12 hours)
 */
router.post('/grant', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId } = req.body

    if (!req.user || !req.user.tenantId) {
      res.status(400).json({ error: 'Missing user or tenant information' })
      return
    }

    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      res.status(403).json({ error: 'Only admins can grant inventory access' })
      return
    }

    if (!userId) {
      res.status(400).json({ error: 'userId is required' })
      return
    }

    const auth = await grantInventoryAccess(req.user.tenantId, userId, req.user.id)

    res.status(201).json({
      authorization: auth,
      message: 'Inventory access granted for 12 hours',
    })
  } catch (error) {
    console.error('[INVENTORY AUTH ROUTE] Grant error:', error)
    res.status(500).json({ error: 'Failed to grant inventory access' })
  }
})

/**
 * POST /inventory-authorization/revoke
 * Admin revokes inventory access from a cashier
 */
router.post('/revoke', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId } = req.body

    if (!req.user || !req.user.tenantId) {
      res.status(400).json({ error: 'Missing user or tenant information' })
      return
    }

    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      res.status(403).json({ error: 'Only admins can revoke inventory access' })
      return
    }

    if (!userId) {
      res.status(400).json({ error: 'userId is required' })
      return
    }

    await revokeInventoryAccess(req.user.tenantId, userId, req.user.id)

    res.status(200).json({
      message: 'Inventory access revoked',
    })
  } catch (error) {
    console.error('[INVENTORY AUTH ROUTE] Revoke error:', error)
    res.status(500).json({ error: 'Failed to revoke inventory access' })
  }
})

/**
 * GET /inventory-authorization/active
 * Get all active inventory authorizations for this tenant
 */
router.get('/active', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || !req.user.tenantId) {
      res.status(400).json({ error: 'Missing user or tenant information' })
      return
    }

    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      res.status(403).json({ error: 'Only admins can view inventory authorizations' })
      return
    }

    const authorizations = await getActiveAuthorizations(req.user.tenantId)

    res.status(200).json({
      authorizations,
    })
  } catch (error) {
    console.error('[INVENTORY AUTH ROUTE] Get active error:', error)
    res.status(500).json({ error: 'Failed to get inventory authorizations' })
  }
})

/**
 * GET /inventory-authorization/me
 * Check if current user has inventory access
 */
router.get('/me', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || !req.user.tenantId) {
      res.status(400).json({ error: 'Missing user or tenant information' })
      return
    }

    const authorization = await getInventoryAuthorization(req.user.tenantId, req.user.id)

    res.status(200).json({
      hasAccess: !!authorization,
      authorization: authorization || null,
    })
  } catch (error) {
    console.error('[INVENTORY AUTH ROUTE] Get me error:', error)
    res.status(500).json({ error: 'Failed to check inventory access' })
  }
})

export default router
