// Payment Engine Types
export const PaymentProvider = {
  WAVE: 'WAVE',
  ORANGE_MONEY: 'ORANGE_MONEY',
  FREE_MONEY: 'FREE_MONEY',
} as const

export type PaymentProvider = (typeof PaymentProvider)[keyof typeof PaymentProvider]

export const PaymentMode = {
  MANUAL: 'MANUAL',
  API: 'API',
} as const

export type PaymentMode = (typeof PaymentMode)[keyof typeof PaymentMode]

export const PaymentStatus = {
  PENDING: 'PENDING',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED',
  MANUAL_CONFIRMATION: 'MANUAL_CONFIRMATION',
} as const

export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus]

export interface PaymentConfig {
  provider: PaymentProvider
  mode: PaymentMode
  amount: number
  currency?: string
  clientId?: string
  saleId: string
  description?: string
  metadata?: Record<string, unknown>
}

export interface PaymentRequest {
  provider: PaymentProvider
  mode: PaymentMode
  amount: number
  saleId: string
  clientId?: string
  description?: string
}

export interface PaymentResponse {
  id: string
  provider: PaymentProvider
  mode: PaymentMode
  status: PaymentStatus
  amount: number
  saleId: string
  createdAt: number
  updatedAt: number
  transactionId?: string
  qrCode?: string
  displayInfo?: PaymentDisplayInfo
  error?: string
}

export interface PaymentDisplayInfo {
  // For MANUAL mode
  qrCode?: string
  accountNumber?: string
  accountName?: string
  instruction?: string

  // For API mode
  redirectUrl?: string
  paymentLink?: string

  // Common
  timeout?: number
}

export interface RefundRequest {
  paymentId: string
  amount?: number
  reason?: string
}

export interface RefundResponse {
  id: string
  paymentId: string
  status: PaymentStatus
  amount: number
  createdAt: number
  error?: string
}

export interface ProviderConfig {
  apiKey?: string
  apiSecret?: string
  merchantId?: string
  endpoint?: string
  webhookSecret?: string
}
