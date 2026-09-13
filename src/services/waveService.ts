import type { Payment } from '../types'
import { createPayment, updatePaymentStatus } from './paymentService'

const WAVE_CONFIG_KEY = 'niatala_wave_config'

interface WaveConfig {
  status: 'CONNECTED' | 'DISCONNECTED'
  merchantNumber?: string
  merchantName?: string
  connectedAt?: number
  lastSyncAt?: number
}

function getWaveConfig(): WaveConfig {
  try {
    const data = localStorage.getItem(WAVE_CONFIG_KEY)
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

function saveWaveConfig(config: WaveConfig) {
  localStorage.setItem(WAVE_CONFIG_KEY, JSON.stringify(config))
}

export function getWaveStatus() {
  return getWaveConfig()
}

export function connectWaveAccount(merchantNumber: string, merchantName: string): boolean {
  // ARCHITECTURE ONLY: En production, cela appellerait une API backend sécurisée
  // qui vérifierait les credentials avec Wave et stockerait les clés API
  if (!merchantNumber || !merchantName) {
    return false
  }

  const config: WaveConfig = {
    status: 'CONNECTED',
    merchantNumber,
    merchantName,
    connectedAt: Date.now(),
  }

  saveWaveConfig(config)
  return true
}

export function disconnectWaveAccount(): boolean {
  const config: WaveConfig = {
    status: 'DISCONNECTED',
  }
  saveWaveConfig(config)
  return true
}

export function requestPayment(
  saleId: string,
  amount: number,
  phoneNumber: string,
  cashierId?: string
): Payment | null {
  const config = getWaveConfig()

  if (config.status !== 'CONNECTED') {
    console.error('Wave account not connected')
    return null
  }

  // ARCHITECTURE ONLY: En production, cela appellerait l'API Wave
  // pour créer une demande de paiement réelle
  const payment = createPayment({
    saleId,
    amount,
    method: 'wave',
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
  // SIMULATION: En production, le webhook Wave confirmerait le paiement
  // Ici, on simule une confirmation manuelle (en vrai, ce serait par webhook du backend)
  return updatePaymentStatus(paymentId, 'SUCCESS', `WAVE-${Date.now()}`)
}

export function simulatePaymentFailed(paymentId: string): Payment | null {
  // SIMULATION: En production, le webhook Wave signalerait l'échec
  return updatePaymentStatus(paymentId, 'FAILED')
}

export function simulateRefund(paymentId: string): Payment | null {
  // SIMULATION: Refund Wave
  // ARCHITECTURE ONLY: Endpoint réel de Wave requiert authentification backend
  return updatePaymentStatus(paymentId, 'REFUNDED', `WAVE-REFUND-${Date.now()}`)
}

export function simulatePayout(recipientPhone: string): string | null {
  // SIMULATION: Payout Wave
  // ARCHITECTURE ONLY: Requiert clés API backend
  if (!recipientPhone) return null
  return `WAVE-PAYOUT-${Date.now()}`
}

export function getTransactionHistory(): Payment[] {
  // ARCHITECTURE ONLY: En production, cela récupérerait l'historique de Wave via API
  return []
}

export function getBalance(): number | null {
  const config = getWaveConfig()
  if (config.status !== 'CONNECTED') return null

  // ARCHITECTURE ONLY: En production, cela appellerait getBalance() de Wave
  return null
}
