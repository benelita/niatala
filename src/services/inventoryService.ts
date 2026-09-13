import type { Product, StockMovement, StockStatus, StockThreshold } from '../types'

const STOCK_MOVEMENTS_KEY = 'niatala_stock_movements'
const DEFAULT_THRESHOLDS_KEY = 'niatala_default_thresholds'

// Default thresholds
const DEFAULT_THRESHOLDS: StockThreshold = {
  thresholdOrange: 10,
  thresholdRed: 5,
}

// ===== THRESHOLDS =====

export function getDefaultThresholds(): StockThreshold {
  try {
    const data = localStorage.getItem(DEFAULT_THRESHOLDS_KEY)
    return data ? JSON.parse(data) : DEFAULT_THRESHOLDS
  } catch {
    return DEFAULT_THRESHOLDS
  }
}

export function setDefaultThresholds(thresholds: StockThreshold): void {
  if (thresholds.thresholdRed > thresholds.thresholdOrange) {
    throw new Error('Seuil rouge doit être inférieur au seuil orange')
  }
  localStorage.setItem(DEFAULT_THRESHOLDS_KEY, JSON.stringify(thresholds))
}

export function getThresholdsForProduct(product: Product): StockThreshold {
  if (product.useDefaultThresholds === false && product.customThresholdOrange !== undefined && product.customThresholdRed !== undefined) {
    return {
      thresholdOrange: product.customThresholdOrange,
      thresholdRed: product.customThresholdRed,
    }
  }
  return getDefaultThresholds()
}

// ===== STOCK STATUS =====

export function getStockStatus(stock: number, thresholds: StockThreshold): StockStatus {
  if (stock === 0) return 'OUTOFSTOCK'
  if (stock <= thresholds.thresholdRed) return 'CRITICAL'
  if (stock <= thresholds.thresholdOrange) return 'LOW'
  return 'NORMAL'
}

export function getStockStatusForProduct(product: Product): StockStatus {
  const thresholds = getThresholdsForProduct(product)
  return getStockStatus(product.stock, thresholds)
}

export function getStockStatusLabel(status: StockStatus): string {
  switch (status) {
    case 'NORMAL':
      return '🟢 NORMAL'
    case 'LOW':
      return '🟠 FAIBLE'
    case 'CRITICAL':
      return '🔴 CRITIQUE'
    case 'OUTOFSTOCK':
      return '⛔ RUPTURE'
  }
}

// ===== STOCK MOVEMENTS =====

function getStockMovements(): StockMovement[] {
  try {
    const data = localStorage.getItem(STOCK_MOVEMENTS_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

function saveStockMovements(movements: StockMovement[]): void {
  localStorage.setItem(STOCK_MOVEMENTS_KEY, JSON.stringify(movements))
}

export function recordStockMovement(
  productId: string,
  type: StockMovement['type'],
  quantity: number,
  before: number,
  after: number,
  userId?: string,
  username?: string,
  reference?: string,
  motif?: string
): StockMovement {
  const movement: StockMovement = {
    id: `MOV-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    productId,
    type,
    quantity,
    before,
    after,
    date: Date.now(),
    userId,
    username,
    reference,
    motif,
  }

  const movements = getStockMovements()
  movements.push(movement)
  saveStockMovements(movements)

  return movement
}

export function getStockMovementsByProduct(productId: string): StockMovement[] {
  return getStockMovements().filter(m => m.productId === productId)
}

export function getStockMovementsByType(type: StockMovement['type']): StockMovement[] {
  return getStockMovements().filter(m => m.type === type)
}

export function getStockMovementsByDateRange(startDate: number, endDate: number): StockMovement[] {
  return getStockMovements().filter(m => m.date >= startDate && m.date <= endDate)
}

export function getAllStockMovements(): StockMovement[] {
  return getStockMovements()
}

// ===== INVENTORY CALCULATIONS =====

export function calculateStockValue(products: Product[]): {
  costValue: number
  saleValue: number
  totalUnits: number
  uncostPricedCount: number
} {
  let costValue = 0
  let saleValue = 0
  let totalUnits = 0
  let uncostPricedCount = 0

  products.forEach(product => {
    const units = product.stock || 0
    totalUnits += units

    // Cost value
    if (product.costPrice && product.costPrice > 0) {
      costValue += units * product.costPrice
    } else {
      uncostPricedCount++
    }

    // Sale value
    saleValue += units * (product.price || 0)
  })

  return {
    costValue,
    saleValue,
    totalUnits,
    uncostPricedCount,
  }
}

export function getStockSummary(products: Product[]): {
  normal: number
  low: number
  critical: number
  outOfStock: number
} {
  let normal = 0
  let low = 0
  let critical = 0
  let outOfStock = 0

  products.forEach(product => {
    const status = getStockStatusForProduct(product)
    switch (status) {
      case 'NORMAL':
        normal++
        break
      case 'LOW':
        low++
        break
      case 'CRITICAL':
        critical++
        break
      case 'OUTOFSTOCK':
        outOfStock++
        break
    }
  })

  return { normal, low, critical, outOfStock }
}

export function getProductsInStatus(products: Product[], status: StockStatus): Product[] {
  return products.filter(p => getStockStatusForProduct(p) === status)
}

// ===== VALIDATION =====

export function validateThresholds(orange: number, red: number): { valid: boolean; error?: string } {
  if (red > orange) {
    return { valid: false, error: 'Le seuil rouge doit être inférieur au seuil orange' }
  }
  if (orange < 0 || red < 0) {
    return { valid: false, error: 'Les seuils ne peuvent pas être négatifs' }
  }
  return { valid: true }
}

export function canSellProduct(product: Product, quantity: number): boolean {
  return product.stock >= quantity && product.stock > 0
}
