import type { Payment } from '../types'
import { createPayment, updatePaymentStatus } from './paymentService'

const FREE_CONFIG_KEY = 'niatala_free_config'

interface FreeConfig {
  status: 'CONNECTED' | 'DISCONNECTED'
  merchantNumber?: string
  merchantName?: string
  connectedAt?: number
  lastSyncAt?: number
}

function getFreeConfig(): FreeConfig {
  try {
    const data = localStorage.getItem(FREE_CONFIG_KEY)
    return data
      ? JSON.parse(data)
      : {
          status: 'DISCONNECTED',
          merchantNumber: undefined,
          merchantName: undefined,
        }
  } catch {
    return {
      status: 'DISCONNECTED',
    }
  }
}

function saveFreeConfig(config: FreeConfig) {
  localStorage.setItem(FREE_CONFIG_KEY, JSON.stringify(config))
}

export function getFreeStatus() {
  return getFreeConfig()
}

export function connectFreeAccount(merchantNumber: string, merchantName: string): boolean {
  if (!merchantNumber || !merchantName) {
    return false
  }

  const config: FreeConfig = {
    status: 'CONNECTED',
    merchantNumber,
    merchantName,
    connectedAt: Date.now(),
  }

  saveFreeConfig(config)
  return true
}

export function disconnectFreeAccount(): boolean {
  const config: FreeConfig = {
    status: 'DISCONNECTED',
  }
  saveFreeConfig(config)
  return true
}

export function requestPayment(
  saleId: string,
  amount: number,
  phoneNumber: string,
  cashierId?: string
): Payment | null {
  const config = getFreeConfig()

  if (config.status !== 'CONNECTED') {
    return null
  }

  const payment = createPayment({
    saleId,
    amount,
    method: 'free',
    status: 'PENDING',
    phoneNumber,
    cashierId,
    metadata: {
      merchantNumber: config.merchantNumber,
      requestedAt: new Date().toISOString(),
    },
  })

  return payment
}

export function simulatePaymentConfirmation(paymentId: string): Payment | null {
  return updatePaymentStatus(paymentId, 'SUCCESS', `FREE-${Date.now()}`)
}

export function simulatePaymentFailed(paymentId: string): Payment | null {
  return updatePaymentStatus(paymentId, 'FAILED')
}

export function simulateRefund(paymentId: string): Payment | null {
  return updatePaymentStatus(paymentId, 'REFUNDED', `FREE-REFUND-${Date.now()}`)
}

export function simulatePayout(recipientPhone: string): string | null {
  if (!recipientPhone) return null
  return `FREE-PAYOUT-${Date.now()}`
}

export function getTransactionHistory(): Payment[] {
  return []
}

export function getBalance(): number | null {
  const config = getFreeConfig()
  if (config.status !== 'CONNECTED') return null
  return null
}
