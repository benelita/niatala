import type {
  PaymentRequest,
  PaymentResponse,
  RefundRequest,
  RefundResponse,
  ProviderConfig,
  PaymentProvider,
} from '../types'
import { PaymentStatus } from '../types'
import type { IPaymentProvider } from './IPaymentProvider'
import { validatePaymentRequest } from '../utils/paymentValidator'
import { logPaymentAction } from '../utils/paymentLogger'

export abstract class BasePaymentProvider implements IPaymentProvider {
  protected config: ProviderConfig = {}
  protected abstract providerName: string
  protected abstract provider: PaymentProvider

  abstract createPayment(request: PaymentRequest): Promise<PaymentResponse>
  abstract confirmManualPayment(paymentId: string): Promise<PaymentResponse>
  abstract refundPayment(request: RefundRequest): Promise<RefundResponse>

  getProviderName(): string {
    return this.providerName
  }

  isConfigured(): boolean {
    return !!(this.config.apiKey || this.config.merchantId)
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    // Default implementation: fetch from storage
    const payments = JSON.parse(localStorage.getItem('niatala_payments') || '[]')
    const payment = payments.find((p: any) => p.id === paymentId)

    if (!payment) {
      logPaymentAction(this.provider, 'GET_STATUS', { paymentId, status: 'NOT_FOUND' })
      return PaymentStatus.FAILED
    }

    logPaymentAction(this.provider, 'GET_STATUS', { paymentId, status: payment.status })
    return payment.status
  }

  async cancelPayment(paymentId: string): Promise<PaymentResponse> {
    const payments = JSON.parse(localStorage.getItem('niatala_payments') || '[]')
    const index = payments.findIndex((p: any) => p.id === paymentId)

    if (index === -1) {
      throw new Error(`Payment ${paymentId} not found`)
    }

    const payment = payments[index]
    payment.status = PaymentStatus.CANCELLED
    payment.updatedAt = Date.now()

    localStorage.setItem('niatala_payments', JSON.stringify(payments))
    logPaymentAction(this.provider, 'CANCEL', { paymentId, newStatus: PaymentStatus.CANCELLED })

    return payment
  }

  setConfig(config: ProviderConfig): void {
    this.config = { ...this.config, ...config }
  }

  getConfig(): ProviderConfig {
    return { ...this.config }
  }

  protected async validateRequest(request: PaymentRequest): Promise<void> {
    validatePaymentRequest(request)
  }

  protected generatePaymentId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}`
  }

  protected generateQRCode(data: string): string {
    // Placeholder: in production, use a QR code library
    return `qr_${btoa(data)}`
  }

  protected async storePayment(payment: PaymentResponse): Promise<void> {
    const payments = JSON.parse(localStorage.getItem('niatala_payments') || '[]')
    payments.push(payment)
    localStorage.setItem('niatala_payments', JSON.stringify(payments))
  }
}
