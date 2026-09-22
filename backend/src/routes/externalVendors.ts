import { Router, Response } from 'express'
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth'
import {
  createOrGetVendor,
  getVendorsForTenant,
  getVendor,
  recordVendorSale,
  recordVendorPayment,
  getVendorSales,
  getVendorPayments,
  getAllExternalVendorSales,
  getExternalVendorStats,
} from '../services/externalVendorService'

const router = Router()

/**
 * GET /external-vendors
 * Get all vendors for tenant
 */
router.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || !req.user.tenantId) {
      res.status(400).json({ error: 'Missing user or tenant information' })
      return
    }

    const vendors = await getVendorsForTenant(req.user.tenantId)

    res.status(200).json({
      vendors,
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to get vendors' })
  }
})

/**
 * GET /external-vendors/stats
 * Get statistics
 */
router.get('/stats', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || !req.user.tenantId) {
      res.status(400).json({ error: 'Missing user or tenant information' })
      return
    }

    const stats = await getExternalVendorStats(req.user.tenantId)

    res.status(200).json(stats)
  } catch (error) {
    res.status(500).json({ error: 'Failed to get statistics' })
  }
})

/**
 * POST /external-vendors/sales
 * Record a sale from external vendor
 */
router.post('/sales', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { vendorName, vendorPhone, amount, description } = req.body

    if (!req.user || !req.user.tenantId) {
      res.status(400).json({ error: 'Missing user or tenant information' })
      return
    }

    if (!vendorName || !vendorPhone || !amount || amount <= 0) {
      res.status(400).json({ error: 'vendorName, vendorPhone, and amount are required' })
      return
    }

    // Get or create vendor
    const vendor = await createOrGetVendor(req.user.tenantId, vendorName, vendorPhone)

    // Record sale
    const sale = await recordVendorSale(req.user.tenantId, vendor.id, amount, description, req.user.id)

    res.status(201).json({
      sale,
      message: 'Sale recorded successfully',
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to record sale' })
  }
})

/**
 * POST /external-vendors/:vendorId/payments
 * Record payment to vendor
 */
router.post('/:vendorId/payments', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { amount, paymentMethod, paymentReference, notes } = req.body

    if (!req.user || !req.user.tenantId) {
      res.status(400).json({ error: 'Missing user or tenant information' })
      return
    }

    if (!amount || amount <= 0 || !paymentMethod) {
      res.status(400).json({ error: 'amount and paymentMethod are required' })
      return
    }

    const payment = await recordVendorPayment(
      req.user.tenantId,
      req.params.vendorId,
      amount,
      paymentMethod,
      paymentReference,
      req.user.id,
      notes
    )

    res.status(201).json({
      payment,
      message: 'Payment recorded successfully',
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to record payment' })
  }
})

/**
 * GET /external-vendors/:vendorId/sales
 * Get vendor sales
 */
router.get('/:vendorId/sales', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || !req.user.tenantId) {
      res.status(400).json({ error: 'Missing user or tenant information' })
      return
    }

    const sales = await getVendorSales(req.user.tenantId, req.params.vendorId)

    res.status(200).json({
      sales,
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to get sales' })
  }
})

/**
 * GET /external-vendors/:vendorId/payments
 * Get vendor payments
 */
router.get('/:vendorId/payments', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || !req.user.tenantId) {
      res.status(400).json({ error: 'Missing user or tenant information' })
      return
    }

    const payments = await getVendorPayments(req.user.tenantId, req.params.vendorId)

    res.status(200).json({
      payments,
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to get payments' })
  }
})

export default router
