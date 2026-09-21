import type { Sale, SaleItem, PaymentMethod, SaleStatus } from '../types'
import { useStorage } from './useStorage'
import { useAuthContext } from '../context/AuthContext'

interface CreateSaleInput {
  items: SaleItem[]
  total: number
  paymentMethod: PaymentMethod
  clientId?: string
  paidAmount: number
  remainingAmount: number
  cashierId?: string
}

export function useSales() {
  const { session } = useAuthContext()
  const [sales, setSales] = useStorage<Sale[]>('niatala_sales', [])
  const [saleCounter, setSaleCounter] = useStorage('niatala_sale_counter', 1000)

  // Filter sales by current tenant
  const getTenantSales = (): Sale[] => {
    return sales.filter(s => s.tenantId === session?.tenantId)
  }

  const generateSaleNumber = (): string => {
    const newCounter = saleCounter + 1
    setSaleCounter(newCounter)
    return `VTE-${newCounter}`
  }

  const determineSaleStatus = (
    paymentMethod: PaymentMethod,
    paidAmount: number,
    total: number,
  ): SaleStatus => {
    // Vérifier si paiement partiel (applicable à toutes les méthodes)
    if (paidAmount < total) {
      if (paymentMethod === 'credit' && paidAmount === 0) return 'CREDIT'
      return 'PARTIAL_CREDIT'
    }

    // Paiement complet
    if (paymentMethod === 'credit') return 'SETTLED'
    return 'PAID'
  }

  const addSale = (input: CreateSaleInput): Sale => {
    const status = determineSaleStatus(input.paymentMethod, input.paidAmount, input.total)

    const newSale: Sale = {
      id: `sale_${Date.now()}`,
      saleNumber: generateSaleNumber(),
      date: Date.now(),
      items: input.items,
      total: input.total,
      paymentMethod: input.paymentMethod,
      clientId: input.clientId,
      paidAmount: input.paidAmount,
      remainingAmount: input.remainingAmount,
      status,
      cashierId: input.cashierId,
      tenantId: session?.tenantId,
    }

    setSales([...sales, newSale])
    return newSale
  }

  const cancelSale = (saleId: string, reason: string): Sale | null => {
    const sale = getTenantSales().find(s => s.id === saleId)
    if (!sale) return null

    const updatedSale: Sale = {
      ...sale,
      status: 'CANCELLED',
      cancelledAt: Date.now(),
      cancellationReason: reason,
    }

    setSales(sales.map(s => (s.id === saleId && s.tenantId === session?.tenantId ? updatedSale : s)))
    return updatedSale
  }

  const getSalesForClient = (clientId: string): Sale[] => {
    return getTenantSales().filter(s => s.clientId === clientId)
  }

  const getSalesForCashier = (cashierId: string): Sale[] => {
    return getTenantSales().filter(s => s.cashierId === cashierId)
  }

  const getSaleById = (saleId: string): Sale | undefined => {
    return getTenantSales().find(s => s.id === saleId)
  }

  const getSaleBySaleNumber = (saleNumber: string): Sale | undefined => {
    return getTenantSales().find(s => s.saleNumber === saleNumber)
  }

  const getActiveSales = (): Sale[] => {
    return getTenantSales().filter(s => s.status !== 'CANCELLED')
  }

  const getTotalSales = (): number => {
    return getActiveSales().reduce((sum, sale) => sum + sale.total, 0)
  }

  const getTotalCashReceived = (): number => {
    return getActiveSales().reduce((sum, sale) => sum + sale.paidAmount, 0)
  }

  return {
    sales: getTenantSales(),
    addSale,
    cancelSale,
    getSalesForClient,
    getSalesForCashier,
    getSaleById,
    getSaleBySaleNumber,
    getActiveSales,
    getTotalSales,
    getTotalCashReceived,
  }
}
