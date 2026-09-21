import type {
  PaymentRequest,
  PaymentResponse,
  RefundRequest,
  RefundResponse,
  PaymentStatus,
  ProviderConfig,
} from '../types'

export interface IPaymentProvider {
  // Provider identity
  getProviderName(): string
  isConfigured(): boolean

  // Payment operations
  createPayment(request: PaymentRequest): Promise<PaymentResponse>
  getPaymentStatus(paymentId: string): Promise<PaymentStatus>
  confirmManualPayment(paymentId: string): Promise<PaymentResponse>
  cancelPayment(paymentId: string): Promise<PaymentResponse>

  // Refunds
  refundPayment(request: RefundRequest): Promise<RefundResponse>

  // Configuration
  setConfig(config: ProviderConfig): void
  getConfig(): ProviderConfig
}
