import axios from 'axios'
import crypto from 'crypto'
import type { WavePaymentSession, WavePaymentResponse } from '../types/payment'
import { PaymentStatus } from '../types/payment'

/**
 * Wave Business API Service
 *
 * IMPORTANT: API keys are never exposed to frontend
 * All credentials come from environment variables (backend only)
 *
 * API Documentation: https://docs.wave.com/business-api
 */

interface WaveConfig {
  apiKey: string
  apiSecret: string
  merchantId: string
  environment: 'staging' | 'production'
  webhookSecret: string
}

export class WaveBusinessService {
  private config: WaveConfig

  constructor() {
    this.config = {
      apiKey: process.env.WAVE_API_KEY || '',
      apiSecret: process.env.WAVE_API_SECRET || '',
      merchantId: process.env.WAVE_MERCHANT_ID || '',
      environment: (process.env.WAVE_ENVIRONMENT as 'staging' | 'production') || 'staging',
      webhookSecret: process.env.WAVE_WEBHOOK_SECRET || '',
    }

    if (!this.config.apiKey || !this.config.merchantId) {
      console.warn('[WaveService] Wave credentials not configured. Using simulation mode.')
    }
  }

  /**
   * Create a payment session with Wave
   *
   * In production, this makes a real API call to Wave
   * In development (without credentials), this simulates the response
   */
  async createPaymentSession(session: WavePaymentSession): Promise<WavePaymentResponse> {
    if (this.isSimulationMode()) {
      return this.simulateCreatePaymentSession(session)
    }

    return this.makeWaveAPICall(session)
  }

  /**
   * Get payment status from Wave
   */
  async getPaymentStatus(transactionId: string): Promise<{
    status: PaymentStatus
    error?: string
  }> {
    if (this.isSimulationMode()) {
      return this.simulateGetPaymentStatus(transactionId)
    }

    return this.makeWaveStatusCall(transactionId)
  }

  /**
   * Verify webhook signature from Wave
   *
   * Wave sends webhooks with HMAC-SHA256 signature
   * We verify it to ensure it's really from Wave
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', this.config.webhookSecret)
      .update(payload)
      .digest('hex')

    return signature === expectedSignature
  }

  /**
   * Create refund with Wave
   */
  async createRefund(
    transactionId: string,
    amount: number,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    if (this.isSimulationMode()) {
      return this.simulateCreateRefund(transactionId, amount)
    }

    return this.makeWaveRefundCall(transactionId, amount, reason)
  }

  // ============ PRIVATE METHODS ============

  /**
   * Check if we're in simulation mode (credentials not configured)
   */
  private isSimulationMode(): boolean {
    return !this.config.apiKey || this.config.apiKey === ''
  }

  /**
   * Make actual API call to Wave
   *
   * STUB: This would make a real HTTP request to Wave API
   * Currently returns error indicating credentials needed
   */
  private async makeWaveAPICall(session: WavePaymentSession): Promise<WavePaymentResponse> {
    try {
      const endpoint = this.getWaveEndpoint('/payments')

      const response = await axios.post(endpoint, session, {
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          'X-Merchant-ID': this.config.merchantId,
          'X-API-Version': '2.0',
        },
      })

      console.log('[WaveService] Payment session created:', response.data)
      return response.data
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      console.error('[WaveService] API call failed:', errorMsg)
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
   * Get payment status from Wave
   *
   * STUB: Would call Wave API to get real status
   */
  private async makeWaveStatusCall(transactionId: string): Promise<{
    status: PaymentStatus
    error?: string
  }> {
    try {
      const endpoint = this.getWaveEndpoint(`/payments/${transactionId}/status`)

      const response = await axios.get(endpoint, {
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          'X-Merchant-ID': this.config.merchantId,
        },
      })

      const status = this.mapWaveStatusToInternal(response.data.status)
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
   * Create refund with Wave
   *
   * STUB: Would call Wave API to create real refund
   */
  private async makeWaveRefundCall(
    transactionId: string,
    amount: number,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const endpoint = this.getWaveEndpoint(`/payments/${transactionId}/refund`)

      await axios.post(
        endpoint,
        { amount, reason },
        {
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
            'X-Merchant-ID': this.config.merchantId,
          },
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
   * Simulate Wave payment session creation
   *
   * Returns realistic response structure for testing
   */
  private simulateCreatePaymentSession(session: WavePaymentSession): WavePaymentResponse {
    const transactionId = `WAVE_SIM_${Date.now()}_${Math.random().toString(36).substring(7)}`
    const sessionId = `SESSION_${Math.random().toString(36).substring(7)}`

    console.log('[WaveService] SIMULATION: Payment session created')
    console.log(`  - Transaction ID: ${transactionId}`)
    console.log(`  - Amount: ${session.amount} ${session.currency}`)
    console.log(`  - Reference: ${session.reference}`)

    return {
      transactionId,
      sessionId,
      status: 'pending',
      redirectUrl: `https://pay.wave.staging/checkout/${sessionId}`,
    }
  }

  /**
   * Simulate Wave payment status check
   */
  private simulateGetPaymentStatus(transactionId: string): {
    status: PaymentStatus
    error?: string
  } {
    // In simulation, we can't know the real status
    // Return PENDING to indicate waiting for confirmation
    console.log('[WaveService] SIMULATION: Getting payment status for', transactionId)
    return {
      status: PaymentStatus.PENDING,
    }
  }

  /**
   * Simulate Wave refund
   */
  private simulateCreateRefund(transactionId: string, amount: number): {
    success: boolean
    error?: string
  } {
    console.log('[WaveService] SIMULATION: Refund created')
    console.log(`  - Transaction ID: ${transactionId}`)
    console.log(`  - Amount: ${amount}`)
    return { success: true }
  }

  // ============ HELPERS ============

  /**
   * Get Wave API endpoint URL based on environment
   */
  private getWaveEndpoint(path: string): string {
    const baseUrl =
      this.config.environment === 'production'
        ? 'https://api.wave.com/v2'
        : 'https://api.wave.staging/v2'
    return `${baseUrl}${path}`
  }

  /**
   * Map Wave API status to NIATALA PaymentStatus
   */
  private mapWaveStatusToInternal(waveStatus: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      'pending': PaymentStatus.PENDING,
      'completed': PaymentStatus.SUCCESS,
      'failed': PaymentStatus.FAILED,
      'cancelled': PaymentStatus.CANCELLED,
      'refunded': PaymentStatus.REFUNDED,
    }
    return statusMap[waveStatus.toLowerCase()] || PaymentStatus.PENDING
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
export const waveService = new WaveBusinessService()
