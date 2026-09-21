import type {
  PaymentRequest,
  PaymentResponse,
  RefundRequest,
  RefundResponse,
  PaymentStatus,
  ProviderConfig,
} from './types'
import { PaymentProvider, PaymentMode } from './types'
import type { IPaymentProvider } from './providers/IPaymentProvider'
import { WaveProvider, OrangeMoneyProvider, FreeMoneyProvider } from './providers'
import { logPaymentAction } from './utils/paymentLogger'

export class PaymentEngine {
  private providers: Map<PaymentProvider, IPaymentProvider> = new Map()

  constructor() {
    this.initializeProviders()
  }

  private initializeProviders(): void {
    this.providers.set(PaymentProvider.WAVE, new WaveProvider())
    this.providers.set(PaymentProvider.ORANGE_MONEY, new OrangeMoneyProvider())
    this.providers.set(PaymentProvider.FREE_MONEY, new FreeMoneyProvider())
  }

  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    const provider = this.getProvider(request.provider)

    if (!provider.isConfigured() && request.mode === PaymentMode.API) {
      throw new Error(`Provider ${request.provider} is not configured for API mode`)
    }

    logPaymentAction(request.provider, 'ENGINE_CREATE_START', {
      provider: request.provider,
      mode: request.mode,
      amount: request.amount,
    })

    return await provider.createPayment(request)
  }

  async getPaymentStatus(provider: PaymentProvider, paymentId: string): Promise<PaymentStatus> {
    const paymentProvider = this.getProvider(provider)
    return await paymentProvider.getPaymentStatus(paymentId)
  }

  async confirmManualPayment(provider: PaymentProvider, paymentId: string): Promise<PaymentResponse> {
    const paymentProvider = this.getProvider(provider)

    logPaymentAction(provider, 'ENGINE_CONFIRM_MANUAL_START', { paymentId })

    return await paymentProvider.confirmManualPayment(paymentId)
  }

  async cancelPayment(provider: PaymentProvider, paymentId: string): Promise<PaymentResponse> {
    const paymentProvider = this.getProvider(provider)

    logPaymentAction(provider, 'ENGINE_CANCEL_START', { paymentId })

    return await paymentProvider.cancelPayment(paymentId)
  }

  async refundPayment(provider: PaymentProvider, request: RefundRequest): Promise<RefundResponse> {
    const paymentProvider = this.getProvider(provider)

    logPaymentAction(provider, 'ENGINE_REFUND_START', {
      paymentId: request.paymentId,
      amount: request.amount,
    })

    return await paymentProvider.refundPayment(request)
  }

  setProviderConfig(provider: PaymentProvider, config: ProviderConfig): void {
    const paymentProvider = this.getProvider(provider)
    paymentProvider.setConfig(config)

    logPaymentAction(provider, 'CONFIG_SET', {
      hasApiKey: !!config.apiKey,
      hasMerchantId: !!config.merchantId,
    })
  }

  getProviderConfig(provider: PaymentProvider): ProviderConfig {
    const paymentProvider = this.getProvider(provider)
    return paymentProvider.getConfig()
  }

  isProviderConfigured(provider: PaymentProvider): boolean {
    const paymentProvider = this.getProvider(provider)
    return paymentProvider.isConfigured()
  }

  getProvider(provider: PaymentProvider): IPaymentProvider {
    const paymentProvider = this.providers.get(provider)
    if (!paymentProvider) {
      throw new Error(`Provider ${provider} not found`)
    }
    return paymentProvider
  }

  getAllProviders(): Array<{ provider: PaymentProvider; name: string; configured: boolean }> {
    const result: Array<{ provider: PaymentProvider; name: string; configured: boolean }> = []

    this.providers.forEach((provider, providerType) => {
      result.push({
        provider: providerType,
        name: provider.getProviderName(),
        configured: provider.isConfigured(),
      })
    })

    return result
  }
}

// Singleton instance
let paymentEngineInstance: PaymentEngine | null = null

export function getPaymentEngine(): PaymentEngine {
  if (!paymentEngineInstance) {
    paymentEngineInstance = new PaymentEngine()
  }
  return paymentEngineInstance
}

// Export types for consumers
export * from './types'
