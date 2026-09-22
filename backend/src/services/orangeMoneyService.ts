import axios from 'axios'
import crypto from 'crypto'
import type { WavePaymentSession, WavePaymentResponse } from '../types/payment'
import { PaymentStatus } from '../types/payment'

/**
 * Orange Money API Service
 *
 * IMPORTANT: API keys are never exposed to frontend
 * All credentials come from environment variables (backend only)
 *
 * API Documentation: https://developer.orange.com/apis/orange-money
 *
 * Orange Money supports:
 * - Phone number based payments
 * - Merchant account identification
 * - Direct debit from Orange Money wallet
 */

interface OrangeMoneyConfig {
  apiKey: string
  apiSecret: string
  merchantId: string
  partnerId?: string
  environment: 'staging' | 'production'
  webhookSecret: string
  apiVersion: string
}

export class OrangeMoneyService {
  private config: OrangeMoneyConfig

  constructor() {
    this.config = {
      apiKey: process.env.ORANGE_API_KEY || '',
      apiSecret: process.env.ORANGE_API_SECRET || '',
      merchantId: process.env.ORANGE_MERCHANT_ID || '',
      partnerId: process.env.ORANGE_PARTNER_ID,
      environment: (process.env.ORANGE_ENVIRONMENT as 'staging' | 'production') || 'staging',
      webhookSecret: process.env.ORANGE_WEBHOOK_SECRET || '',
      apiVersion: 'v1',
    }

    if (!this.config.apiKey || !this.config.merchantId) {
    }
  }

  /**
   * Create a payment session with Orange Money
   *
   * In production, this makes a real API call to Orange Money
   * In development (without credentials), this simulates the response
   */
  async createPaymentSession(session: WavePaymentSession): Promise<WavePaymentResponse> {
    if (this.isSimulationMode()) {
      return this.simulateCreatePaymentSession(session)
    }

    return this.makeOrangeAPICall(session)
  }

  /**
   * Get payment status from Orange Money
   */
  async getPaymentStatus(transactionId: string): Promise<{
    status: PaymentStatus
    error?: string
  }> {
    if (this.isSimulationMode()) {
      return this.simulateGetPaymentStatus(transactionId)
    }

    return this.makeOrangeStatusCall(transactionId)
  }

  /**
   * Verify webhook signature from Orange Money
   *
   * Orange sends webhooks with signature
   * We verify it to ensure it's really from Orange Money
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', this.config.webhookSecret)
      .update(payload)
      .digest('hex')

    return signature === expectedSignature
  }

  /**
   * Create refund with Orange Money
   *
   * Orange Money API supports refunds if:
   * - Transaction is within refund window (typically 90 days)
   * - Transaction was successful
   * - Merchant has sufficient balance
   */
  async createRefund(
    transactionId: string,
    amount: number,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    if (this.isSimulationMode()) {
      return this.simulateCreateRefund(transactionId, amount)
    }

    return this.makeOrangeRefundCall(transactionId, amount, reason)
  }

  /**
   * Get merchant balance (optional feature)
   * Useful for checking available balance before processing large payments
   */
  async getMerchantBalance(): Promise<{ balance: number; error?: string }> {
    if (this.isSimulationMode()) {
      return { balance: 1000000 } // Simulated balance
    }

    try {
      const endpoint = this.getOrangeEndpoint('/account/balance')
      const response = await axios.get(endpoint, {
        headers: this.getOrangeHeaders(),
      })

      return { balance: response.data.balance }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      return { balance: 0, error: errorMsg }
    }
  }

  // ============ PRIVATE METHODS ============

  /**
   * Check if we're in simulation mode (credentials not configured)
   */
  private isSimulationMode(): boolean {
    return !this.config.apiKey || this.config.apiKey === ''
  }

  /**
   * Make actual API call to Orange Money
   *
   * STUB: This would make a real HTTP request to Orange Money API
   * Currently returns error indicating credentials needed
   *
   * Orange Money API typically requires:
   * - Basic Auth or Bearer token
   * - X-Merchant-ID header
   * - X-Partner-ID header (if applicable)
   * - Request signature (HMAC-SHA256)
   */
  private async makeOrangeAPICall(session: WavePaymentSession): Promise<WavePaymentResponse> {
    try {
      const endpoint = this.getOrangeEndpoint('/payments')
      const payload = this.buildOrangePaymentPayload(session)
      const signature = this.generateRequestSignature(JSON.stringify(payload))

      const response = await axios.post(endpoint, payload, {
        headers: {
          ...this.getOrangeHeaders(),
          'X-Signature': signature,
        },
      })

      return {
        transactionId: response.data.transactionId,
        sessionId: response.data.sessionId,
        status: 'pending',
        redirectUrl: response.data.redirectUrl,
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      return {
        transactionId: '',
        sessionId: '',
        status: 'error',
        error: {
          code: 'API_ERROR',
          message: errorMsg,
        },
      }
    }
  }

  /**
   * Get payment status from Orange Money
   */
  private async makeOrangeStatusCall(transactionId: string): Promise<{
    status: PaymentStatus
    error?: string
  }> {
    try {
      const endpoint = this.getOrangeEndpoint(`/payments/${transactionId}`)

      const response = await axios.get(endpoint, {
        headers: this.getOrangeHeaders(),
      })

      const status = this.mapOrangeStatusToInternal(response.data.status)
      return { status }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      return {
        status: PaymentStatus.FAILED,
        error: errorMsg,
      }
    }
  }

  /**
   * Create refund with Orange Money
   */
  private async makeOrangeRefundCall(
    transactionId: string,
    amount: number,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const endpoint = this.getOrangeEndpoint(`/payments/${transactionId}/refund`)

      await axios.post(
        endpoint,
        { amount, reason },
        {
          headers: this.getOrangeHeaders(),
        }
      )

      return { success: true }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      return {
        success: false,
        error: errorMsg,
      }
    }
  }

  // ============ SIMULATION MODE (For testing without credentials) ============

  /**
   * Simulate Orange Money payment session creation
   */
  private simulateCreatePaymentSession(session: WavePaymentSession): WavePaymentResponse {
    const transactionId = `ORANGE_SIM_${Date.now()}_${Math.random().toString(36).substring(7)}`
    const sessionId = `SESSION_${Math.random().toString(36).substring(7)}`


    return {
      transactionId,
      sessionId,
      status: 'pending',
      redirectUrl: `https://pay.orange.staging/checkout/${sessionId}`,
    }
  }

  /**
   * Simulate Orange Money payment status check
   */
  private simulateGetPaymentStatus(transactionId: string): {
    status: PaymentStatus
    error?: string
  } {
    return {
      status: PaymentStatus.PENDING,
    }
  }

  /**
   * Simulate Orange Money refund
   */
  private simulateCreateRefund(transactionId: string, amount: number): {
    success: boolean
    error?: string
  } {
    return { success: true }
  }

  // ============ HELPERS ============

  /**
   * Get Orange Money API endpoint URL based on environment
   */
  private getOrangeEndpoint(path: string): string {
    const baseUrl =
      this.config.environment === 'production'
        ? 'https://api.orangemoney.com/' + this.config.apiVersion
        : 'https://api.orangemoney.staging/' + this.config.apiVersion
    return `${baseUrl}${path}`
  }

  /**
   * Get standard headers for Orange Money API calls
   */
  private getOrangeHeaders(): Record<string, string> {
    const auth = Buffer.from(`${this.config.apiKey}:${this.config.apiSecret}`).toString('base64')

    return {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
      'X-Merchant-ID': this.config.merchantId,
      'X-Partner-ID': this.config.partnerId || '',
      'X-API-Version': this.config.apiVersion,
    }
  }

  /**
   * Generate request signature (HMAC-SHA256)
   */
  private generateRequestSignature(payload: string): string {
    return crypto
      .createHmac('sha256', this.config.apiSecret)
      .update(payload)
      .digest('hex')
  }

  /**
   * Build Orange Money payment payload
   */
  private buildOrangePaymentPayload(session: WavePaymentSession): Record<string, unknown> {
    return {
      amount: session.amount,
      currency: session.currency,
      transactionRef: session.reference,
      description: session.description,
      merchantId: this.config.merchantId,
      partnerId: this.config.partnerId,
      returnUrl: session.returnUrl,
      webhookUrl: session.webhookUrl,
      metadata: {
        niatalaPaymentId: session.id,
      },
    }
  }

  /**
   * Map Orange Money API status to NIATALA PaymentStatus
   */
  private mapOrangeStatusToInternal(orangeStatus: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      'PENDING': PaymentStatus.PENDING,
      'SUCCESSFUL': PaymentStatus.SUCCESS,
      'COMPLETED': PaymentStatus.SUCCESS,
      'FAILED': PaymentStatus.FAILED,
      'CANCELLED': PaymentStatus.CANCELLED,
      'REFUNDED': PaymentStatus.REFUNDED,
      'PARTIAL_REFUND': PaymentStatus.REFUNDED,
    }
    return statusMap[orangeStatus.toUpperCase()] || PaymentStatus.PENDING
  }

  /**
   * Get current configuration status
   */
  getConfigStatus(): { configured: boolean; mode: string } {
    return {
      configured: !!this.config.apiKey,
      mode: this.isSimulationMode() ? 'SIMULATION' : 'PRODUCTION',
    }
  }
}

// Export singleton instance
export const orangeMoneyService = new OrangeMoneyService()
