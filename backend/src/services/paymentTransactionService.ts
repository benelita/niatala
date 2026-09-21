import { v4 as uuidv4 } from 'uuid'
import type { PaymentTransaction, PaymentRequest, PaymentStatus } from '../types/payment'
import { PaymentStatus as PaymentStatusEnum } from '../types/payment'

/**
 * In-memory payment transaction store
 * In production, this should be a database
 */
const paymentTransactions = new Map<string, PaymentTransaction>()
const idempotencyIndex = new Map<string, string>() // Maps idempotencyKey -> paymentId

export class PaymentTransactionService {
  /**
   * Create a new payment transaction with idempotency support
   */
  static createTransaction(request: PaymentRequest): PaymentTransaction {
    // Check if idempotency key already exists
    const existingPaymentId = idempotencyIndex.get(request.idempotencyKey)
    if (existingPaymentId) {
      const existingTransaction = paymentTransactions.get(existingPaymentId)
      if (existingTransaction && !this.isExpired(existingTransaction)) {
        console.log(`[PaymentService] Idempotency key reused: ${request.idempotencyKey}`)
        return existingTransaction
      }
    }

    const id = uuidv4()
    const now = Date.now()
    const expiryHours = parseInt(process.env.IDEMPOTENCY_KEY_EXPIRY_HOURS || '24', 10)

    const transaction: PaymentTransaction = {
      id,
      idempotencyKey: request.idempotencyKey,
      provider: request.provider,
      saleId: request.saleId,
      clientId: request.clientId,
      amount: request.amount,
      status: PaymentStatusEnum.PENDING,
      retryCount: 0,
      createdAt: now,
      updatedAt: now,
      expiresAt: now + expiryHours * 60 * 60 * 1000,
    }

    paymentTransactions.set(id, transaction)
    idempotencyIndex.set(request.idempotencyKey, id)

    console.log(`[PaymentService] Transaction created: ${id}`)
    return transaction
  }

  /**
   * Get transaction by ID
   */
  static getTransaction(id: string): PaymentTransaction | null {
    const transaction = paymentTransactions.get(id)
    if (!transaction) return null
    if (this.isExpired(transaction)) {
      paymentTransactions.delete(id)
      return null
    }
    return transaction
  }

  /**
   * Get transaction by sale ID
   */
  static getTransactionBySaleId(saleId: string): PaymentTransaction | null {
    for (const transaction of paymentTransactions.values()) {
      if (transaction.saleId === saleId && !this.isExpired(transaction)) {
        return transaction
      }
    }
    return null
  }

  /**
   * Get transaction by idempotency key
   */
  static getTransactionByIdempotencyKey(key: string): PaymentTransaction | null {
    const paymentId = idempotencyIndex.get(key)
    if (!paymentId) return null
    return this.getTransaction(paymentId)
  }

  /**
   * Update transaction status
   */
  static updateStatus(id: string, status: PaymentStatus, transactionId?: string): PaymentTransaction | null {
    const transaction = paymentTransactions.get(id)
    if (!transaction) return null

    transaction.status = status
    transaction.updatedAt = Date.now()
    if (transactionId) {
      transaction.transactionId = transactionId
    }

    paymentTransactions.set(id, transaction)
    console.log(`[PaymentService] Transaction ${id} status updated to ${status}`)
    return transaction
  }

  /**
   * Record payment error
   */
  static recordError(id: string, error: string): PaymentTransaction | null {
    const transaction = paymentTransactions.get(id)
    if (!transaction) return null

    transaction.error = error
    transaction.status = PaymentStatusEnum.FAILED
    transaction.updatedAt = Date.now()
    transaction.retryCount += 1
    transaction.lastRetry = Date.now()

    paymentTransactions.set(id, transaction)
    console.error(`[PaymentService] Transaction ${id} error: ${error}`)
    return transaction
  }

  /**
   * Check if transaction has expired
   */
  private static isExpired(transaction: PaymentTransaction): boolean {
    return Date.now() > transaction.expiresAt
  }

  /**
   * Get all transactions (for debugging)
   */
  static getAllTransactions(): PaymentTransaction[] {
    return Array.from(paymentTransactions.values()).filter(
      t => !this.isExpired(t)
    )
  }

  /**
   * Clear expired transactions
   */
  static clearExpiredTransactions(): number {
    let cleared = 0
    for (const [id, transaction] of paymentTransactions.entries()) {
      if (this.isExpired(transaction)) {
        paymentTransactions.delete(id)
        cleared++
      }
    }
    console.log(`[PaymentService] Cleared ${cleared} expired transactions`)
    return cleared
  }
}
