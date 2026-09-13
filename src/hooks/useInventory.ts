import { useProducts } from './useProducts'
import { useAuthContext } from '../context/AuthContext'
import {
  getDefaultThresholds,
  setDefaultThresholds,
  getThresholdsForProduct,
  getStockStatusForProduct,
  getStockStatusLabel,
  recordStockMovement,
  getStockMovementsByProduct,
  getAllStockMovements,
  calculateStockValue,
  getStockSummary,
  getProductsInStatus,
  validateThresholds,
  canSellProduct,
} from '../services/inventoryService'
import { logAction } from '../services/auditService'

export function useInventory() {
  const { products, updateProduct, decreaseStock } = useProducts()
  const { session } = useAuthContext()

  const adjustStock = (
    productId: string,
    newQuantity: number,
    motif: string
  ): boolean => {
    const product = products.find(p => p.id === productId)
    if (!product) return false

    const difference = newQuantity - product.stock

    if (difference !== 0) {
      const before = product.stock
      updateProduct(productId, { stock: newQuantity })

      // Record movement
      const type = difference > 0 ? 'ENTRY' : 'ADJUSTMENT'
      recordStockMovement(
        productId,
        type,
        Math.abs(difference),
        before,
        newQuantity,
        session?.userId,
        session?.username,
        undefined,
        motif
      )

      // Log action
      logAction(
        session?.userId || '',
        session?.username || '',
        session?.role || 'ADMIN',
        'RESTORE_STOCK',
        {
          reference: product.name,
          amount: Math.abs(difference),
          details: {
            productId,
            before,
            after: newQuantity,
            motif,
          },
        }
      )

      return true
    }

    return false
  }

  const recordSale = (productId: string, quantity: number): boolean => {
    const product = products.find(p => p.id === productId)
    if (!product || product.stock < quantity) return false

    const before = product.stock
    const success = decreaseStock(productId, quantity)

    if (success) {
      recordStockMovement(
        productId,
        'SALE',
        quantity,
        before,
        before - quantity,
        session?.userId,
        session?.username
      )
    }

    return success
  }

  const recordRefund = (
    productId: string,
    quantity: number,
    reference: string,
    motif: string
  ): boolean => {
    const product = products.find(p => p.id === productId)
    if (!product) return false

    const before = product.stock
    const after = before + quantity

    updateProduct(productId, { stock: after })

    recordStockMovement(
      productId,
      'REFUND',
      quantity,
      before,
      after,
      session?.userId,
      session?.username,
      reference,
      motif
    )

    return true
  }

  const recordCancellation = (
    productId: string,
    quantity: number,
    reference: string
  ): boolean => {
    const product = products.find(p => p.id === productId)
    if (!product) return false

    const before = product.stock
    const after = before + quantity

    updateProduct(productId, { stock: after })

    recordStockMovement(
      productId,
      'CANCELLATION',
      quantity,
      before,
      after,
      session?.userId,
      session?.username,
      reference
    )

    return true
  }

  return {
    products,
    getDefaultThresholds,
    setDefaultThresholds,
    getThresholdsForProduct,
    getStockStatusForProduct,
    getStockStatusLabel,
    adjustStock,
    recordSale,
    recordRefund,
    recordCancellation,
    getStockMovementsByProduct,
    getAllStockMovements,
    calculateStockValue,
    getStockSummary,
    getProductsInStatus,
    validateThresholds,
    canSellProduct,
  }
}
