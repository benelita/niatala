import type { FreeAmount } from '../types'

const FREE_AMOUNTS_KEY = 'niatala_free_amounts'

function getFreeAmounts(): FreeAmount[] {
  try {
    const data = localStorage.getItem(FREE_AMOUNTS_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

function saveFreeAmounts(amounts: FreeAmount[]) {
  localStorage.setItem(FREE_AMOUNTS_KEY, JSON.stringify(amounts))
}

export function addFreeAmount(saleId: string, amount: number): FreeAmount {
  const freeAmounts = getFreeAmounts()
  const newAmount: FreeAmount = {
    id: `free_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    saleId,
    amount,
    date: Date.now(),
    status: 'PENDING',
  }
  freeAmounts.push(newAmount)
  saveFreeAmounts(freeAmounts)
  return newAmount
}

export function getPendingFreeAmounts(): FreeAmount[] {
  const amounts = getFreeAmounts()
  return amounts.filter(a => a.status === 'PENDING')
}

export function getFreeAmountsBySaleId(saleId: string): FreeAmount[] {
  const amounts = getFreeAmounts()
  return amounts.filter(a => a.saleId === saleId)
}

export function identifyFreeAmount(
  id: string,
  type: 'INTERNAL' | 'EXTERNAL',
  objectName?: string,
  vendorName?: string,
  userId?: string,
): FreeAmount | null {
  const amounts = getFreeAmounts()
  const index = amounts.findIndex(a => a.id === id)

  if (index === -1) return null

  amounts[index] = {
    ...amounts[index],
    type,
    objectName,
    vendorName,
    status: 'IDENTIFIED',
    identifiedAt: Date.now(),
    identifiedBy: userId,
  }

  saveFreeAmounts(amounts)
  return amounts[index]
}

export function getAllFreeAmounts(): FreeAmount[] {
  return getFreeAmounts()
}

export function getFreeAmountById(id: string): FreeAmount | undefined {
  const amounts = getFreeAmounts()
  return amounts.find(a => a.id === id)
}
