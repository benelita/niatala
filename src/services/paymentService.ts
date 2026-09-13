import type { Payment, PaymentStatus } from '../types'

const PAYMENTS_KEY = 'niatala_payments'

function getPayments(): Payment[] {
  try {
    const data = localStorage.getItem(PAYMENTS_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

function savePayments(payments: Payment[]) {
  localStorage.setItem(PAYMENTS_KEY, JSON.stringify(payments))
}

export function createPayment(payment: Omit<Payment, 'id' | 'date'>): Payment {
  const newPayment: Payment = {
    ...payment,
    id: `PAY-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    date: Date.now(),
  }

  const payments = getPayments()
  payments.push(newPayment)
  savePayments(payments)

  return newPayment
}

export function getPaymentById(id: string): Payment | null {
  return getPayments().find(p => p.id === id) || null
}

export function getPaymentsBySaleId(saleId: string): Payment[] {
  return getPayments().filter(p => p.saleId === saleId)
}

export function getPaymentsByStatus(status: PaymentStatus): Payment[] {
  return getPayments().filter(p => p.status === status)
}

export function updatePaymentStatus(id: string, status: PaymentStatus, reference?: string): Payment | null {
  const payments = getPayments()
  const payment = payments.find(p => p.id === id)

  if (!payment) return null

  payment.status = status
  if (reference) payment.reference = reference

  savePayments(payments)
  return payment
}

export function getTotalAmountByMethod(method: string): number {
  return getPayments()
    .filter(p => p.method === method && p.status === 'SUCCESS')
    .reduce((sum, p) => sum + p.amount, 0)
}

export function getPaymentsByDateRange(startDate: number, endDate: number): Payment[] {
  return getPayments().filter(p => p.date >= startDate && p.date <= endDate)
}

export function deletePayment(id: string): boolean {
  const payments = getPayments()
  const filtered = payments.filter(p => p.id !== id)
  if (filtered.length < payments.length) {
    savePayments(filtered)
    return true
  }
  return false
}
