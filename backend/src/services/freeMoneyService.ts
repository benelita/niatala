import axios from 'axios'
import crypto from 'crypto'
import type { WavePaymentSession, WavePaymentResponse } from '../types/payment'
import { PaymentStatus } from '../types/payment'

/**
 * Free Money API Service
 *
 * IMPORTANT: API keys are never exposed to frontend
 * All credentials come from environment variables (backend only)
 *
 * STATUS: Free Money API integration is MOCKED/PLACEHOLDER
 *
 * NOTE: As of 2026-09-13, there is NO OFFICIAL Free Money Business API documented.
 * This service is prepared for future API availability with:
 * - Placeholder endpoints
 * - Mocked responses for development/testing
 * - Full structure ready for real API when available
 *
 * REQUIRED FOR PRODUCTION:
 * 1. Official Free Money Business API documentation
 * 2. API authentication method (OAuth2, Basic Auth, etc.)
 * 3. Merchant account setup with Free Money
 * 4. Webhook endpoint documentation
 * 5. API rate limits and retry policies
 *
 * This service will be updated when Free Money publishes their Business API.
 */

interface FreeMoneyConfig {
  apiKey: string
  apiSecret: string
  merchantId: string
  environment: 'staging' | 'production'
  webhookSecret: string
  apiVersion: string
}

export class FreeMoneyService {
  private config: FreeMoneyConfig
  private apiAvailable: boolean = false

  constructor() {
    this.config = {
      apiKey: process.env.FREE_API_KEY || '',
      apiSecret: process.env.FREE_API_SECRET || '',
      merchantId: process.env.FREE_MERCHANT_ID || '',
      environment: (process.env.FREE_ENVIRONMENT as 'staging' | 'production') || 'staging',
      webhookSecret: process.env.FREE_WEBHOOK_SECRET || '',
      apiVersion: 'v1',
    }

    // Check if real API is available (would be configured in production)
    this.apiAvailable = !!(this.config.apiKey && this.config.apiSecret && this.config.merchantId)

    if (!this.apiAvailable) {
    }
  }

  /**
   * Create a payment session with Free Money
   *
   * Currently uses SIMULATION mode as official API is not available.
   * When Free Money publishes their Business API, this will call the real endpoint.
   */
  async createPaymentSession(session: WavePaymentSession): Promise<WavePaymentResponse> {
    if (!this.apiAvailable) {
      return this.simulateCreatePaymentSession(session)
    }

    return this.makeFreeMoneyAPICall(session)
  }

  /**
   * Get payment status from Free Money
   */
  async getPaymentStatus(transactionId: string): Promise<{
    status: PaymentStatus
    error?: string
  }> {
    if (!this.apiAvailable) {
      return this.simulateGetPaymentStatus(transactionId)
    }

    return this.makeFreeMoneyStatusCall(transactionId)
  }

  /**
   * Verify webhook signature from Free Money
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', this.config.webhookSecret)
      .update(payload)
      .digest('hex')

    return signature === expectedSignature
  }

  /**
   * Create refund with Free Money
   */
  async createRefund(
    transactionId: string,
    amount: number,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.apiAvailable) {
      return this.simulateCreateRefund(transactionId, amount)
    }

    return this.makeFreeMoneyRefundCall(transactionId, amount, reason)
  }

  // ============ PRIVATE METHODS ============

  /**
   * Make actual API call to Free Money (placeholder)
   *
   * PLACEHOLDER: Will be implemented when Free Money publishes official API
   *
   * Expected endpoints (to be confirmed with Free Money):
   * - POST /payments/create
   * - GET /payments/{id}/status
   * - POST /payments/{id}/refund
   * - POST /webhooks/confirm
   */
  private async makeFreeMoneyAPICall(session: WavePaymentSession): Promise<WavePaymentResponse> {
    try {

      const endpoint = this.getFreeMoneyEndpoint('/payments')
      const payload = this.buildFreeMoneyPaymentPayload(session)

      // This would be implemented when API is available
      const response = await axios.post(endpoint, payload, {
        headers: this.getFreeMoneyHeaders(),
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
          code: 'API_UNAVAILABLE',
          message: 'Free Money Business API not yet available',
        },
      }
    }
  }

  /**
   * Get payment status from Free Money (placeholder)
   */
  private async makeFreeMoneyStatusCall(transactionId: string): Promise<{
    status: PaymentStatus
    error?: string
  }> {
    try {
      const endpoint = this.getFreeMoneyEndpoint(`/payments/${transactionId}`)

      const response = await axios.get(endpoint, {
        headers: this.getFreeMoneyHeaders(),
      })

      const status = this.mapFreeMoneyStatusToInternal(response.data.status)
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
   * Create refund with Free Money (placeholder)
   */
  private async makeFreeMoneyRefundCall(
    transactionId: string,
    amount: number,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const endpoint = this.getFreeMoneyEndpoint(`/payments/${transactionId}/refund`)

      await axios.post(
        endpoint,
        { amount, reason },
        {
          headers: this.getFreeMoneyHeaders(),
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

  // ============ SIMULATION MODE (For testing without API) ============

  /**
   * Simulate Free Money payment session creation
   */
  private simulateCreatePaymentSession(session: WavePaymentSession): WavePaymentResponse {
    const transactionId = `FREE_SIM_${Date.now()}_${Math.random().toString(36).substring(7)}`
    const sessionId = `SESSION_${Math.random().toString(36).substring(7)}`


    return {
      transactionId,
      sessionId,
      status: 'pending',
      redirectUrl: `https://pay.freemoney.staging/checkout/${sessionId}`,
    }
  }

  /**
   * Simulate Free Money payment status check
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
   * Simulate Free Money refund
   */
  private simulateCreateRefund(transactionId: string, amount: number): {
    success: boolean
    error?: string
  } {
    return { success: true }
  }

  // ============ HELPERS ============

  /**
   * Get Free Money API endpoint URL
   *
   * NOTE: Endpoint URLs are PLACEHOLDERS pending official API documentation
   */
  private getFreeMoneyEndpoint(path: string): string {
    // These URLs are placeholders - will be updated when API is published
    const baseUrl =
      this.config.environment === 'production'
        ? 'https://api.freemoney.com/' + this.config.apiVersion
        : 'https://api.freemoney.staging/' + this.config.apiVersion
    return `${baseUrl}${path}`
  }

  /**
   * Get standard headers for Free Money API calls
   *
   * NOTE: Authentication method is PLACEHOLDER pending official documentation
   */
  private getFreeMoneyHeaders(): Record<string, string> {
    // Authentication method is placeholder - will be updated with official spec
    const auth = Buffer.from(`${this.config.apiKey}:${this.config.apiSecret}`).toString('base64')

    return {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
      'X-Merchant-ID': this.config.merchantId,
      'X-API-Version': this.config.apiVersion,
    }
  }

  /**
   * Build Free Money payment payload
   *
   * NOTE: Payload structure is PLACEHOLDER pending official documentation
   */
  private buildFreeMoneyPaymentPayload(session: WavePaymentSession): Record<string, unknown> {
    return {
      amount: session.amount,
      currency: session.currency,
      transactionRef: session.reference,
      description: session.description,
      merchantId: this.config.merchantId,
      returnUrl: session.returnUrl,
      webhookUrl: session.webhookUrl,
      metadata: {
        niatalaPaymentId: session.id,
      },
    }
  }

  /**
   * Map Free Money API status to NIATALA PaymentStatus
   */
  private mapFreeMoneyStatusToInternal(freeStatus: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      'PENDING': PaymentStatus.PENDING,
      'SUCCESS': PaymentStatus.SUCCESS,
      'COMPLETED': PaymentStatus.SUCCESS,
      'FAILED': PaymentStatus.FAILED,
      'CANCELLED': PaymentStatus.CANCELLED,
      'REFUNDED': PaymentStatus.REFUNDED,
    }
    return statusMap[freeStatus.toUpperCase()] || PaymentStatus.PENDING
  }

  /**
   * Get current configuration status
   */
  getConfigStatus(): { configured: boolean; mode: string; apiAvailable: boolean } {
    return {
      configured: this.apiAvailable,
      mode: this.apiAvailable ? 'PRODUCTION' : 'SIMULATION',
      apiAvailable: this.apiAvailable,
    }
  }
}

// Export singleton instance
export const freeMoneyService = new FreeMoneyService()
