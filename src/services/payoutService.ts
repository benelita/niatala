import type { Payout, PaymentStatus } from '../types'

const PAYOUTS_KEY = 'niatala_payouts'

function getPayouts(): Payout[] {
  try {
    const data = localStorage.getItem(PAYOUTS_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

function savePayouts(payouts: Payout[]) {
  localStorage.setItem(PAYOUTS_KEY, JSON.stringify(payouts))
}

export function createPayout(payout: Omit<Payout, 'id' | 'date' | 'status' | 'reference'>): Payout {
  const newPayout: Payout = {
    ...payout,
    id: `PAYOUT-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    date: Date.now(),
    status: 'PENDING',
  }

  const payouts = getPayouts()
  payouts.push(newPayout)
  savePayouts(payouts)

  return newPayout
}

export function getPayoutById(id: string): Payout | null {
  return getPayouts().find(p => p.id === id) || null
}

export function getPayoutsByProvider(provider: 'wave' | 'orange_money'): Payout[] {
  return getPayouts().filter(p => p.provider === provider)
}

export function getPayoutsByStatus(status: PaymentStatus): Payout[] {
  return getPayouts().filter(p => p.status === status)
}

export function updatePayoutStatus(id: string, status: PaymentStatus, reference?: string): Payout | null {
  const payouts = getPayouts()
  const payout = payouts.find(p => p.id === id)

  if (!payout) return null

  payout.status = status
  if (reference) payout.reference = reference

  savePayouts(payouts)
  return payout
}

export function getPayoutsByAdminId(adminId: string): Payout[] {
  return getPayouts().filter(p => p.adminId === adminId)
}

export function getPayoutsByDateRange(startDate: number, endDate: number): Payout[] {
  return getPayouts().filter(p => p.date >= startDate && p.date <= endDate)
}

export function getTotalPayoutAmount(): number {
  return getPayouts()
    .filter(p => p.status === 'SUCCESS')
    .reduce((sum, p) => sum + p.amount, 0)
}
