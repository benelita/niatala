import { Router, Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { PaymentTransactionService } from '../services/paymentTransactionService'
import { waveService } from '../services/waveBusinessService'
import { orangeMoneyService } from '../services/orangeMoneyService'
import { PaymentStatus, PaymentProvider } from '../types/payment'

const router = Router()

/**
 * POST /api/payments/create
 *
 * Create a new payment with Wave Business or Orange Money
 *
 * Body:
 * {
 *   provider: "WAVE" | "ORANGE_MONEY",
 *   amount: 5000,
 *   saleId: "VTE-001",
 *   description: "Payment for sale"
 * }
 *
 * Returns: PaymentResponse with redirect URL or error
 */
router.post('/create', async (req: Request, res: Response) => {
  try {
    const { provider, amount, saleId, clientId, description } = req.body

    // Validate request
    if (!provider || !amount || !saleId) {
      return res.status(400).json({
        error: 'Missing required fields: provider, amount, saleId',
      })
    }

    if (amount <= 0) {
      return res.status(400).json({
        error: 'Amount must be positive',
      })
    }

    // Generate idempotency key for this transaction
    const idempotencyKey = `${saleId}-${Date.now()}-${uuidv4()}`

    // Create payment transaction (idempotent)
    const transaction = PaymentTransactionService.createTransaction({
      provider: provider as PaymentProvider,
      amount,
      saleId,
      clientId,
      description,
      idempotencyKey,
    })

    // Route to appropriate provider
    if (provider === PaymentProvider.WAVE) {
      return handleWavePayment(res, transaction, amount, saleId, description)
    }

    if (provider === PaymentProvider.ORANGE_MONEY) {
      return handleOrangeMoneyPayment(res, transaction, amount, saleId, description)
    }

    return res.status(400).json({
      error: `Provider ${provider} not yet implemented`,
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error('[PaymentsAPI] Create error:', errorMsg)
    return res.status(500).json({ error: errorMsg })
  }
})

/**
 * GET /api/payments/:paymentId/status
 *
 * Get the status of a payment
 *
 * Returns: { status: "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED" }
 */
router.get('/:paymentId/status', async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.params

    const transaction = PaymentTransactionService.getTransaction(paymentId)
    if (!transaction) {
      return res.status(404).json({
        error: 'Payment not found',
      })
    }

    return res.json({
      id: transaction.id,
      status: transaction.status,
      amount: transaction.amount,
      saleId: transaction.saleId,
      transactionId: transaction.transactionId,
      error: transaction.error,
      updatedAt: transaction.updatedAt,
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error('[PaymentsAPI] Status error:', errorMsg)
    return res.status(500).json({ error: errorMsg })
  }
})

/**
 * GET /api/payments/sale/:saleId
 *
 * Get payment for a specific sale
 *
 * Returns: Payment details or null
 */
router.get('/sale/:saleId', async (req: Request, res: Response) => {
  try {
    const { saleId } = req.params

    const transaction = PaymentTransactionService.getTransactionBySaleId(saleId)
    if (!transaction) {
      return res.status(404).json({
        error: 'No payment found for this sale',
      })
    }

    return res.json({
      id: transaction.id,
      status: transaction.status,
      amount: transaction.amount,
      saleId: transaction.saleId,
      transactionId: transaction.transactionId,
      updatedAt: transaction.updatedAt,
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error('[PaymentsAPI] Get sale error:', errorMsg)
    return res.status(500).json({ error: errorMsg })
  }
})

/**
 * POST /api/payments/:paymentId/confirm
 *
 * Manually confirm a payment (admin action)
 * This is for MANUAL mode payments
 */
router.post('/:paymentId/confirm', async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.params

    const transaction = PaymentTransactionService.updateStatus(
      paymentId,
      PaymentStatus.SUCCESS
    )

    if (!transaction) {
      return res.status(404).json({
        error: 'Payment not found',
      })
    }

    console.log(`[PaymentsAPI] Payment ${paymentId} manually confirmed`)

    return res.json({
      id: transaction.id,
      status: transaction.status,
      amount: transaction.amount,
      saleId: transaction.saleId,
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error('[PaymentsAPI] Confirm error:', errorMsg)
    return res.status(500).json({ error: errorMsg })
  }
})

/**
 * POST /api/payments/:paymentId/cancel
 *
 * Cancel a payment
 */
router.post('/:paymentId/cancel', async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.params

    const transaction = PaymentTransactionService.updateStatus(
      paymentId,
      PaymentStatus.CANCELLED
    )

    if (!transaction) {
      return res.status(404).json({
        error: 'Payment not found',
      })
    }

    console.log(`[PaymentsAPI] Payment ${paymentId} cancelled`)

    return res.json({
      id: transaction.id,
      status: transaction.status,
      saleId: transaction.saleId,
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error('[PaymentsAPI] Cancel error:', errorMsg)
    return res.status(500).json({ error: errorMsg })
  }
})

/**
 * POST /api/payments/:paymentId/refund
 *
 * Refund a payment (full or partial)
 */
router.post('/:paymentId/refund', async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.params
    const { amount, reason } = req.body

    const transaction = PaymentTransactionService.getTransaction(paymentId)
    if (!transaction) {
      return res.status(404).json({
        error: 'Payment not found',
      })
    }

    if (transaction.status !== PaymentStatus.SUCCESS) {
      return res.status(400).json({
        error: 'Can only refund successful payments',
      })
    }

    // Call provider API to refund
    if (transaction.provider === PaymentProvider.WAVE && transaction.transactionId) {
      const result = await waveService.createRefund(
        transaction.transactionId,
        amount || transaction.amount,
        reason
      )

      if (!result.success) {
        return res.status(500).json({
          error: result.error || 'Refund failed',
        })
      }
    }

    if (transaction.provider === PaymentProvider.ORANGE_MONEY && transaction.transactionId) {
      const result = await orangeMoneyService.createRefund(
        transaction.transactionId,
        amount || transaction.amount,
        reason
      )

      if (!result.success) {
        return res.status(500).json({
          error: result.error || 'Refund failed',
        })
      }
    }

    // Update transaction status
    const updatedTransaction = PaymentTransactionService.updateStatus(
      paymentId,
      PaymentStatus.REFUNDED
    )

    console.log(`[PaymentsAPI] Payment ${paymentId} refunded`)

    return res.json({
      id: updatedTransaction?.id,
      status: updatedTransaction?.status,
      amount: amount || transaction.amount,
      saleId: transaction.saleId,
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error('[PaymentsAPI] Refund error:', errorMsg)
    return res.status(500).json({ error: errorMsg })
  }
})

/**
 * GET /api/payments/debug/all
 *
 * Get all transactions (debugging only)
 * In production, this should be restricted or removed
 */
router.get('/debug/all', (_req: Request, res: Response)=> {
  const transactions = PaymentTransactionService.getAllTransactions()
  return res.json({
    count: transactions.length,
    transactions,
  })
})

// ============ HELPER FUNCTIONS ============

/**
 * Handle Wave payment creation
 */
async function handleWavePayment(
  res: Response,
  transaction: any,
  amount: number,
  saleId: string,
  description?: string
): Promise<void> {
  try {
    const backendUrl = process.env.API_URL || 'http://localhost:3001'
    const webhookUrl = `${backendUrl}/api/webhooks/wave`
    const returnUrl = `${process.env.FRONTEND_URL || 'http://localhost:5174'}/payment-result`

    // Create Wave payment session
    const waveResponse = await waveService.createPaymentSession({
      id: transaction.id,
      amount,
      currency: 'XOF',
      reference: saleId,
      description: description || `NIATALA Payment for ${saleId}`,
      merchantId: process.env.WAVE_MERCHANT_ID || '',
      webhookUrl,
      returnUrl,
    })

    if (waveResponse.error) {
      PaymentTransactionService.recordError(
        transaction.id,
        waveResponse.error.message
      )

      return res.status(400).json({
        error: waveResponse.error.message,
      })
    }

    if (waveResponse.transactionId) {
      PaymentTransactionService.updateStatus(
        transaction.id,
        PaymentStatus.PENDING,
        waveResponse.transactionId
      )
    }

    return res.json({
      id: transaction.id,
      provider: PaymentProvider.WAVE,
      status: PaymentStatus.PENDING,
      amount,
      saleId,
      transactionId: waveResponse.transactionId,
      redirectUrl: waveResponse.redirectUrl,
      createdAt: transaction.createdAt,
      updatedAt: Date.now(),
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    PaymentTransactionService.recordError(transaction.id, errorMsg)

    return res.status(500).json({
      error: errorMsg,
    })
  }
}

/**
 * Handle Orange Money payment creation
 */
async function handleOrangeMoneyPayment(
  res: Response,
  transaction: any,
  amount: number,
  saleId: string,
  description?: string
): Promise<void> {
  try {
    const backendUrl = process.env.API_URL || 'http://localhost:3001'
    const webhookUrl = `${backendUrl}/api/webhooks/orange`
    const returnUrl = `${process.env.FRONTEND_URL || 'http://localhost:5174'}/payment-result`

    // Create Orange Money payment session
    const orangeResponse = await orangeMoneyService.createPaymentSession({
      id: transaction.id,
      amount,
      currency: 'XOF',
      reference: saleId,
      description: description || `NIATALA Payment for ${saleId}`,
      merchantId: process.env.ORANGE_MERCHANT_ID || '',
      webhookUrl,
      returnUrl,
    })

    if (orangeResponse.error) {
      PaymentTransactionService.recordError(
        transaction.id,
        orangeResponse.error.message
      )

      return res.status(400).json({
        error: orangeResponse.error.message,
      })
    }

    if (orangeResponse.transactionId) {
      PaymentTransactionService.updateStatus(
        transaction.id,
        PaymentStatus.PENDING,
        orangeResponse.transactionId
      )
    }

    return res.json({
      id: transaction.id,
      provider: PaymentProvider.ORANGE_MONEY,
      status: PaymentStatus.PENDING,
      amount,
      saleId,
      transactionId: orangeResponse.transactionId,
      redirectUrl: orangeResponse.redirectUrl,
      createdAt: transaction.createdAt,
      updatedAt: Date.now(),
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    PaymentTransactionService.recordError(transaction.id, errorMsg)

    return res.status(500).json({
      error: errorMsg,
    })
  }
}

export default router
