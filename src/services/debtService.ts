import type { DebtPayment } from '../types'

const DEBT_PAYMENTS_KEY = 'niatala_debt_payments'

function getDebtPayments(): DebtPayment[] {
  try {
    const data = localStorage.getItem(DEBT_PAYMENTS_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

function saveDebtPayments(payments: DebtPayment[]) {
  localStorage.setItem(DEBT_PAYMENTS_KEY, JSON.stringify(payments))
}

export function recordDebtPayment(
  clientId: string,
  amount: number,
  method: 'wave' | 'orange_money' | 'cash',
  cashierId?: string
): DebtPayment {
  const debtPayment: DebtPayment = {
    id: `DEBT-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    clientId,
    amount,
    method,
    status: 'SUCCESS',
    date: Date.now(),
    cashierId,
    reference: `DEBT-PAY-${Date.now()}`,
  }

  const payments = getDebtPayments()
  payments.push(debtPayment)
  saveDebtPayments(payments)

  return debtPayment
}

export function getDebtPaymentsByClient(clientId: string): DebtPayment[] {
  return getDebtPayments().filter(p => p.clientId === clientId)
}

export function getTotalDebtPaymentsByClient(clientId: string): number {
  return getDebtPaymentsByClient(clientId).reduce((sum, p) => sum + p.amount, 0)
}

export function getDebtPaymentsByDateRange(startDate: number, endDate: number): DebtPayment[] {
  return getDebtPayments().filter(p => p.date >= startDate && p.date <= endDate)
}

export function getDebtPaymentsByMethod(method: string): DebtPayment[] {
  return getDebtPayments().filter(p => p.method === method)
}

export function getTotalDebtPayments(): number {
  return getDebtPayments().reduce((sum, p) => sum + p.amount, 0)
}
