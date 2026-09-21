import type { PaymentRequest, PaymentResponse, RefundRequest, RefundResponse, PaymentProvider as PaymentProviderType } from '../types'
import { PaymentProvider, PaymentMode, PaymentStatus } from '../types'
import { BasePaymentProvider } from './BasePaymentProvider'
import { logPaymentAction } from '../utils/paymentLogger'

export class OrangeMoneyProvider extends BasePaymentProvider {
  protected providerName = 'Orange Money'
  protected provider: PaymentProviderType = PaymentProvider.ORANGE_MONEY
  private backendUrl: string

  constructor() {
    super()
    this.backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
  }

  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    await this.validateRequest(request)

    const paymentId = this.generatePaymentId('ORANGE')
    const now = Date.now()

    const response: PaymentResponse = {
      id: paymentId,
      provider: PaymentProvider.ORANGE_MONEY,
      mode: request.mode,
      status: PaymentStatus.PENDING,
      amount: request.amount,
      saleId: request.saleId,
      createdAt: now,
      updatedAt: now,
    }

    // Mode-specific configuration
    if (request.mode === PaymentMode.MANUAL) {
      // MANUAL: Display Orange Money account and instructions
      response.displayInfo = {
        qrCode: this.generateQRCode(`orange|${this.config.merchantId || 'merchant'}|${request.amount}`),
        accountNumber: this.config.merchantId || 'ORANGE_MERCHANT_NUMBER',
        accountName: 'Orange Money Merchant',
        instruction: 'Composez *144# ou scannez le code QR pour payer',
        timeout: 5 * 60 * 1000, // 5 minutes
      }
      response.status = PaymentStatus.MANUAL_CONFIRMATION
    } else if (request.mode === PaymentMode.API) {
      // API: Call Orange Money API via backend
      try {
        const backendResponse = await this.callBackendPaymentAPI(request)
        response.id = backendResponse.id
        response.status = backendResponse.status
        response.transactionId = backendResponse.transactionId
        response.displayInfo = {
          redirectUrl: backendResponse.redirectUrl,
          timeout: 10 * 60 * 1000, // 10 minutes
        }
        response.error = backendResponse.error
      } catch (error) {
        response.error = error instanceof Error ? error.message : 'Failed to create payment'
      }
    }

    await this.storePayment(response)
    logPaymentAction(this.provider, 'CREATE', {
      paymentId,
      mode: request.mode,
      amount: request.amount,
      status: response.status,
    })

    return response
  }

  async confirmManualPayment(paymentId: string): Promise<PaymentResponse> {
    const payments = JSON.parse(localStorage.getItem('niatala_payments') || '[]')
    const index = payments.findIndex((p: any) => p.id === paymentId)

    if (index === -1) {
      logPaymentAction(this.provider, 'CONFIRM_MANUAL_ERROR', { paymentId, error: 'NOT_FOUND' })
      throw new Error(`Payment ${paymentId} not found`)
    }

    const payment = payments[index]
    payment.status = PaymentStatus.SUCCESS
    payment.updatedAt = Date.now()

    localStorage.setItem('niatala_payments', JSON.stringify(payments))
    logPaymentAction(this.provider, 'CONFIRM_MANUAL', { paymentId, newStatus: PaymentStatus.SUCCESS })

    return payment
  }

  async refundPayment(request: RefundRequest): Promise<RefundResponse> {
    const payments = JSON.parse(localStorage.getItem('niatala_payments') || '[]')
    const payment = payments.find((p: any) => p.id === request.paymentId)

    if (!payment) {
      logPaymentAction(this.provider, 'REFUND_ERROR', { paymentId: request.paymentId, error: 'NOT_FOUND' })
      throw new Error(`Payment ${request.paymentId} not found`)
    }

    const refundId = this.generatePaymentId('ORANGEREFUND')

    // In API mode, would call Orange Money refund endpoint
    // In MANUAL mode, would log the refund for manual processing
    const refund: RefundResponse = {
      id: refundId,
      paymentId: request.paymentId,
      status: request.amount && request.amount < payment.amount ? PaymentStatus.CANCELLED : PaymentStatus.REFUNDED,
      amount: request.amount || payment.amount,
      createdAt: Date.now(),
    }

    logPaymentAction(this.provider, 'REFUND', {
      paymentId: request.paymentId,
      refundId,
      amount: refund.amount,
      status: refund.status,
    })

    return refund
  }

  private async callBackendPaymentAPI(request: PaymentRequest): Promise<any> {
    const response = await fetch(`${this.backendUrl}/api/payments/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        provider: request.provider,
        amount: request.amount,
        saleId: request.saleId,
        clientId: request.clientId,
        description: request.description,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Backend API error')
    }

    return response.json()
  }
}
