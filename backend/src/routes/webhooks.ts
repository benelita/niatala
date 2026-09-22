import { Router, Request, Response } from 'express'
import { PaymentTransactionService } from '../services/paymentTransactionService'
import { PaymentStatus } from '../types/payment'

const router = Router()

/**
 * POST /api/webhooks/wave
 *
 * Webhook endpoint for Wave payment confirmations
 *
 * Wave sends:
 * {
 *   event: "payment.completed" | "payment.failed",
 *   transactionId: "WAVE_TXN_123",
 *   paymentId: "NIATALA_PAYMENT_ID",
 *   status: "completed" | "failed",
 *   amount: 5000,
 *   reference: "VTE-001",
 *   timestamp: 1694595123456
 * }
 */
router.post('/wave', async (req: Request, res: Response) => {
  try {
    const payload = req.body
    const signature = req.headers['x-wave-signature'] as string


    // Verify webhook signature
    if (!verifyWaveWebhookSignature(JSON.stringify(payload), signature)) {
      return res.status(401).json({
        error: 'Invalid signature',
      })
    }

    // Prevent duplicate webhook processing (idempotency)
    const transaction = PaymentTransactionService.getTransaction(payload.paymentId)
    if (!transaction) {
      return res.status(404).json({
        error: 'Payment not found',
      })
    }

    // If already processed, return success (idempotent)
    if (transaction.status !== PaymentStatus.PENDING) {
      return res.json({ success: true, status: transaction.status })
    }

    // Process webhook based on event
    let newStatus: PaymentStatus
    if (payload.event === 'payment.completed' || payload.status === 'completed') {
      newStatus = PaymentStatus.SUCCESS
    } else if (payload.event === 'payment.failed' || payload.status === 'failed') {
      newStatus = PaymentStatus.FAILED
    } else {
      return res.status(400).json({
        error: 'Unknown payment event',
      })
    }

    // Update transaction status
    PaymentTransactionService.updateStatus(
      payload.paymentId,
      newStatus,
      payload.transactionId
    )

    // Log successful webhook processing

    return res.json({
      success: true,
      paymentId: payload.paymentId,
      status: newStatus,
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    return res.status(500).json({ error: errorMsg })
  }
})

/**
 * POST /api/webhooks/orange
 *
 * Webhook endpoint for Orange Money payments
 *
 * Orange Money sends:
 * {
 *   event: "transaction.success" | "transaction.failed",
 *   transactionId: "ORANGE_TXN_123",
 *   paymentId: "NIATALA_PAYMENT_ID",
 *   status: "success" | "failed",
 *   amount: 5000,
 *   reference: "VTE-001",
 *   timestamp: 1694595123456
 * }
 */
router.post('/orange', async (req: Request, res: Response) => {
  try {
    const payload = req.body
    const signature = req.headers['x-orange-signature'] as string


    // Verify webhook signature
    if (!verifyOrangeWebhookSignature(JSON.stringify(payload), signature)) {
      return res.status(401).json({
        error: 'Invalid signature',
      })
    }

    // Lookup transaction by payment ID
    const transaction = PaymentTransactionService.getTransaction(payload.paymentId)
    if (!transaction) {
      return res.status(404).json({
        error: 'Payment not found',
      })
    }

    // If already processed, return success (idempotent)
    if (transaction.status !== PaymentStatus.PENDING) {
      return res.json({ success: true, status: transaction.status })
    }

    // Process webhook based on event
    let newStatus: PaymentStatus
    if (payload.event === 'transaction.success' || payload.status === 'success') {
      newStatus = PaymentStatus.SUCCESS
    } else if (payload.event === 'transaction.failed' || payload.status === 'failed') {
      newStatus = PaymentStatus.FAILED
    } else {
      return res.status(400).json({
        error: 'Unknown payment event',
      })
    }

    // Update transaction status
    PaymentTransactionService.updateStatus(
      payload.paymentId,
      newStatus,
      payload.transactionId
    )


    return res.json({
      success: true,
      paymentId: payload.paymentId,
      status: newStatus,
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    return res.status(500).json({ error: errorMsg })
  }
})

/**
 * POST /api/webhooks/free
 *
 * Webhook endpoint for Free Money payments (future)
 */
router.post('/free', async (_req: Request, res: Response) => {
  try {
    console.log('[WebhookAPI] Free Money webhook received (not yet implemented)')
    return res.status(501).json({
      error: 'Free Money webhooks not yet implemented',
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    return res.status(500).json({ error: errorMsg })
  }
})

/**
 * Test endpoint to simulate Wave webhook
 * (For development and testing)
 *
 * POST /api/webhooks/test/wave
 * Body: { paymentId, status: "completed" | "failed" }
 */
router.post('/test/wave', async (req: Request, res: Response) => {
  try {
    const { paymentId, status } = req.body

    if (!paymentId || !status) {
      return res.status(400).json({
        error: 'Missing paymentId or status',
      })
    }

    const transaction = PaymentTransactionService.getTransaction(paymentId)
    if (!transaction) {
      return res.status(404).json({
        error: 'Payment not found',
      })
    }

    const newStatus = status === 'completed' ? PaymentStatus.SUCCESS : PaymentStatus.FAILED

    PaymentTransactionService.updateStatus(
      paymentId,
      newStatus,
      `WAVE_TEST_${Date.now()}`
    )


    return res.json({
      success: true,
      paymentId,
      status: newStatus,
      note: 'This is a test webhook. Use only in development.',
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    return res.status(500).json({ error: errorMsg })
  }
})

/**
 * Test endpoint to simulate Orange Money webhook
 * (For development and testing)
 *
 * POST /api/webhooks/test/orange
 * Body: { paymentId, status: "success" | "failed" }
 */
router.post('/test/orange', async (req: Request, res: Response) => {
  try {
    const { paymentId, status } = req.body

    if (!paymentId || !status) {
      return res.status(400).json({
        error: 'Missing paymentId or status',
      })
    }

    const transaction = PaymentTransactionService.getTransaction(paymentId)
    if (!transaction) {
      return res.status(404).json({
        error: 'Payment not found',
      })
    }

    const newStatus = status === 'success' ? PaymentStatus.SUCCESS : PaymentStatus.FAILED

    PaymentTransactionService.updateStatus(
      paymentId,
      newStatus,
      `ORANGE_TEST_${Date.now()}`
    )


    return res.json({
      success: true,
      paymentId,
      status: newStatus,
      note: 'This is a test webhook. Use only in development.',
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    return res.status(500).json({ error: errorMsg })
  }
})

// ============ HELPER FUNCTIONS ============

/**
 * Verify Wave webhook signature
 *
 * In production, this should validate the actual HMAC-SHA256 signature
 * For now, it's a placeholder
 */
function verifyWaveWebhookSignature(_payload: string, _signature: string): boolean {
  // In production:
  // return waveService.verifyWebhookSignature(payload, signature)

  // For development (allow all), uncomment to enable:
  // return true

  // For now, log but don't verify (development mode)
  console.log('[WebhookAPI] Wave webhook signature verification (development mode)')
  return true // TODO: Implement real signature verification when Wave credentials available
}

/**
 * Verify Orange Money webhook signature
 *
 * In production, this should validate the actual HMAC-SHA256 signature
 * For now, it's a placeholder
 */
function verifyOrangeWebhookSignature(_payload: string, _signature: string): boolean {
  // In production:
  // return orangeMoneyService.verifyWebhookSignature(payload, signature)

  // For development (allow all), uncomment to enable:
  // return true

  // For now, log but don't verify (development mode)
  console.log('[WebhookAPI] Orange Money webhook signature verification (development mode)')
  return true // TODO: Implement real signature verification when Orange credentials available
}

export default router
