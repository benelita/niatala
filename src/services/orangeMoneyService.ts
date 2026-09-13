import type { Payment } from '../types'
import { createPayment, updatePaymentStatus } from './paymentService'

const ORANGE_CONFIG_KEY = 'niatala_orange_config'

interface OrangeConfig {
  status: 'CONNECTED' | 'DISCONNECTED'
  merchantNumber?: string
  merchantName?: string
  connectedAt?: number
  lastSyncAt?: number
}

function getOrangeConfig(): OrangeConfig {
  try {
    const data = localStorage.getItem(ORANGE_CONFIG_KEY)
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

function saveOrangeConfig(config: OrangeConfig) {
  localStorage.setItem(ORANGE_CONFIG_KEY, JSON.stringify(config))
}

export function getOrangeMoneyStatus() {
  return getOrangeConfig()
}

export function connectOrangeMoneyAccount(merchantNumber: string, merchantName: string): boolean {
  // ARCHITECTURE ONLY: En production, cela appellerait une API backend sécurisée
  // qui vérifierait les credentials avec Orange Money et stockerait les clés API
  if (!merchantNumber || !merchantName) {
    return false
  }

  const config: OrangeConfig = {
    status: 'CONNECTED',
    merchantNumber,
    merchantName,
    connectedAt: Date.now(),
  }

  saveOrangeConfig(config)
  return true
}

export function disconnectOrangeMoneyAccount(): boolean {
  const config: OrangeConfig = {
    status: 'DISCONNECTED',
  }
  saveOrangeConfig(config)
  return true
}

export function requestPayment(
  saleId: string,
  amount: number,
  phoneNumber: string,
  cashierId?: string
): Payment | null {
  const config = getOrangeConfig()

  if (config.status !== 'CONNECTED') {
    console.error('Orange Money account not connected')
    return null
  }

  // ARCHITECTURE ONLY: En production, cela appellerait l'API Orange Money
  // pour créer une demande de paiement réelle
  const payment = createPayment({
    saleId,
    amount,
    method: 'orange_money',
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
  // SIMULATION: En production, le webhook Orange Money confirmerait le paiement
  return updatePaymentStatus(paymentId, 'SUCCESS', `ORANGE-${Date.now()}`)
}

export function simulatePaymentFailed(paymentId: string): Payment | null {
  // SIMULATION: En production, le webhook Orange Money signalerait l'échec
  return updatePaymentStatus(paymentId, 'FAILED')
}

export function simulateRefund(paymentId: string): Payment | null {
  // SIMULATION: Refund Orange Money
  // ARCHITECTURE ONLY: Endpoint réel requiert authentification backend
  return updatePaymentStatus(paymentId, 'REFUNDED', `ORANGE-REFUND-${Date.now()}`)
}

export function simulatePayout(recipientPhone: string): string | null {
  // SIMULATION: Payout Orange Money
  // ARCHITECTURE ONLY: Requiert clés API backend
  if (!recipientPhone) return null
  return `ORANGE-PAYOUT-${Date.now()}`
}

export function getTransactionHistory(): Payment[] {
  // ARCHITECTURE ONLY: En production, cela récupérerait l'historique d'Orange Money via API
  return []
}

export function getBalance(): number | null {
  const config = getOrangeConfig()
  if (config.status !== 'CONNECTED') return null

  // ARCHITECTURE ONLY: En production, cela appellerait getBalance() d'Orange Money
  return null
}
