export enum PaymentProvider {
  WAVE = 'WAVE',
  ORANGE_MONEY = 'ORANGE_MONEY',
  FREE_MONEY = 'FREE_MONEY',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export interface PaymentRequest {
  provider: PaymentProvider
  amount: number
  saleId: string
  clientId?: string
  description?: string
  idempotencyKey: string // Prevents duplicate payments
}

export interface PaymentResponse {
  id: string
  provider: PaymentProvider
  status: PaymentStatus
  amount: number
  saleId: string
  transactionId?: string
  redirectUrl?: string
  error?: string
  createdAt: number
  updatedAt: number
}

export interface WebhookPayload {
  provider: PaymentProvider
  paymentId: string
  transactionId: string
  status: PaymentStatus
  amount: number
  timestamp: number
  signature: string
}

export interface WavePaymentSession {
  id: string
  amount: number
  currency: string
  reference: string
  description?: string
  merchantId: string
  returnUrl?: string
  webhookUrl?: string
}

export interface WavePaymentResponse {
  transactionId: string
  sessionId: string
  status: string
  redirectUrl?: string
  error?: {
    code: string
    message: string
  }
}

export interface PaymentTransaction {
  id: string
  idempotencyKey: string
  provider: PaymentProvider
  saleId: string
  clientId?: string
  amount: number
  status: PaymentStatus
  transactionId?: string
  error?: string
  retryCount: number
  lastRetry?: number
  createdAt: number
  updatedAt: number
  expiresAt: number
}
