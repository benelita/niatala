import type { Refund } from '../types'

const REFUNDS_KEY = 'niatala_refunds'

export function createRefund(
  saleId: string,
  amount: number,
  adminId: string,
  motif: string,
  itemsReturned?: Array<{ itemId: string; quantity: number }>
): Refund {
  const refunds = getRefunds()

  // Check if refund already exists for this sale
  const existingRefund = refunds.find(r => r.saleId === saleId)
  if (existingRefund) {
    throw new Error('Refund already exists for this sale')
  }

  const newRefund: Refund = {
    id: `refund_${Date.now()}`,
    saleId,
    amount,
    date: Date.now(),
    adminId,
    motif,
    itemsReturned,
    status: amount > 0 ? 'PARTIAL' : 'FULL',
  }

  refunds.push(newRefund)
  localStorage.setItem(REFUNDS_KEY, JSON.stringify(refunds))
  return newRefund
}

export function getRefunds(): Refund[] {
  const stored = localStorage.getItem(REFUNDS_KEY)
  return stored ? JSON.parse(stored) : []
}

export function getRefundBySaleId(saleId: string): Refund | undefined {
  return getRefunds().find(r => r.saleId === saleId)
}

export function getRefundsByAdminId(adminId: string): Refund[] {
  return getRefunds().filter(r => r.adminId === adminId)
}

export function getRefundsByDateRange(startDate: Date, endDate: Date): Refund[] {
  const startTime = startDate.getTime()
  const endTime = endDate.getTime()
  return getRefunds().filter(r => r.date >= startTime && r.date <= endTime)
}

export function calculateTotalRefunds(saleId: string): number {
  const refund = getRefundBySaleId(saleId)
  return refund ? refund.amount : 0
}
