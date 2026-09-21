import { useCallback } from 'react'
import { getPaymentEngine } from '../services/paymentEngine'
import type {
  PaymentRequest,
  PaymentResponse,
  RefundRequest,
  RefundResponse,
  PaymentStatus,
  ProviderConfig,
} from '../services/paymentEngine/types'
import { PaymentProvider } from '../services/paymentEngine/types'

export function usePaymentEngine() {
  const engine = getPaymentEngine()

  const createPayment = useCallback(
    async (request: PaymentRequest): Promise<PaymentResponse> => {
      return await engine.createPayment(request)
    },
    [engine]
  )

  const getPaymentStatus = useCallback(
    async (provider: PaymentProvider, paymentId: string): Promise<PaymentStatus> => {
      return await engine.getPaymentStatus(provider, paymentId)
    },
    [engine]
  )

  const confirmManualPayment = useCallback(
    async (provider: PaymentProvider, paymentId: string): Promise<PaymentResponse> => {
      return await engine.confirmManualPayment(provider, paymentId)
    },
    [engine]
  )

  const cancelPayment = useCallback(
    async (provider: PaymentProvider, paymentId: string): Promise<PaymentResponse> => {
      return await engine.cancelPayment(provider, paymentId)
    },
    [engine]
  )

  const refundPayment = useCallback(
    async (provider: PaymentProvider, request: RefundRequest): Promise<RefundResponse> => {
      return await engine.refundPayment(provider, request)
    },
    [engine]
  )

  const setProviderConfig = useCallback(
    (provider: PaymentProvider, config: ProviderConfig) => {
      engine.setProviderConfig(provider, config)
    },
    [engine]
  )

  const getProviderConfig = useCallback(
    (provider: PaymentProvider): ProviderConfig => {
      return engine.getProviderConfig(provider)
    },
    [engine]
  )

  const isProviderConfigured = useCallback(
    (provider: PaymentProvider): boolean => {
      return engine.isProviderConfigured(provider)
    },
    [engine]
  )

  const getAllProviders = useCallback(() => {
    return engine.getAllProviders()
  }, [engine])

  return {
    createPayment,
    getPaymentStatus,
    confirmManualPayment,
    cancelPayment,
    refundPayment,
    setProviderConfig,
    getProviderConfig,
    isProviderConfigured,
    getAllProviders,
  }
}
