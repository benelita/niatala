import type { PaymentProvider } from '../types'

interface PaymentLogEntry {
  provider: PaymentProvider
  action: string
  data: Record<string, unknown>
  timestamp: number
}

const PAYMENT_LOG_KEY = 'niatala_payment_engine_logs'

export function logPaymentAction(
  provider: PaymentProvider,
  action: string,
  data: Record<string, unknown>
): void {
  const log: PaymentLogEntry = {
    provider,
    action,
    data,
    timestamp: Date.now(),
  }

  const logs = JSON.parse(localStorage.getItem(PAYMENT_LOG_KEY) || '[]')
  logs.push(log)

  // Keep only last 1000 logs
  if (logs.length > 1000) {
    logs.shift()
  }

  localStorage.setItem(PAYMENT_LOG_KEY, JSON.stringify(logs))
}

export function getPaymentLogs(provider?: PaymentProvider, limit = 100): PaymentLogEntry[] {
  const logs = JSON.parse(localStorage.getItem(PAYMENT_LOG_KEY) || '[]')

  let filtered = logs

  if (provider) {
    filtered = filtered.filter((log: PaymentLogEntry) => log.provider === provider)
  }

  return filtered.slice(-limit)
}

export function clearPaymentLogs(): void {
  localStorage.removeItem(PAYMENT_LOG_KEY)
}
