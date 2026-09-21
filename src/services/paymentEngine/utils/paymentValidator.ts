import type { PaymentRequest } from '../types'

const VALID_PROVIDERS = ['WAVE', 'ORANGE_MONEY', 'FREE_MONEY'] as const

function isValidProvider(provider: unknown): provider is (typeof VALID_PROVIDERS)[number] {
  return typeof provider === 'string' && VALID_PROVIDERS.includes(provider as any)
}

export function validatePaymentRequest(request: PaymentRequest): void {
  if (!request.provider || !isValidProvider(request.provider)) {
    throw new Error('Invalid payment provider')
  }

  if (request.amount <= 0) {
    throw new Error('Payment amount must be positive')
  }

  if (!request.saleId || request.saleId.trim().length === 0) {
    throw new Error('Sale ID is required')
  }
}

export function validatePaymentId(id: string): boolean {
  return !!(id && id.trim().length > 0)
}

export function validateAmount(amount: number): boolean {
  return typeof amount === 'number' && amount > 0
}
