import type { Product } from '../types'
import { useStorage } from './useStorage'

export interface StoredProduct extends Product {
  stock: number
  alertThreshold: number
  barcode?: string
  description?: string
}

export function useProducts() {
  const [products, setProducts] = useStorage<StoredProduct[]>('niatala_products', [
    { id: '1', name: 'Coca-Cola 33cl', price: 500, costPrice: 350, category: 'Boissons', emoji: '🥤', stock: 50, alertThreshold: 10, useDefaultThresholds: true, barcode: 'CCL33' },
    { id: '2', name: 'Eau 1,5L', price: 500, costPrice: 300, category: 'Boissons', emoji: '💧', stock: 30, alertThreshold: 8, useDefaultThresholds: true },
    { id: '3', name: 'Pain', price: 250, costPrice: 150, category: 'Alimentation', emoji: '🍞', stock: 20, alertThreshold: 5, useDefaultThresholds: true },
    { id: '4', name: 'Lait', price: 800, costPrice: 500, category: 'Alimentation', emoji: '🥛', stock: 15, alertThreshold: 3, useDefaultThresholds: true },
    { id: '5', name: 'Riz 1kg', price: 1000, costPrice: 600, category: 'Alimentation', emoji: '🍚', stock: 25, alertThreshold: 5, useDefaultThresholds: true },
    { id: '6', name: 'Savon', price: 500, costPrice: 300, category: 'Hygiène', emoji: '🧼', stock: 40, alertThreshold: 10, useDefaultThresholds: true },
    { id: '7', name: 'Sucre 1kg', price: 800, costPrice: 500, category: 'Alimentation', emoji: '🍯', stock: 18, alertThreshold: 4, useDefaultThresholds: true },
    { id: '8', name: 'Huile 1L', price: 1500, costPrice: 900, category: 'Maison', emoji: '🫗', stock: 12, alertThreshold: 3, useDefaultThresholds: true },
  ])

  const addProduct = (product: Omit<StoredProduct, 'id'>): StoredProduct => {
    const newProduct: StoredProduct = {
      ...product,
      id: `product_${Date.now()}`,
    }
    setProducts([...products, newProduct])
    return newProduct
  }

  const updateProduct = (productId: string, updates: Partial<StoredProduct>) => {
    setProducts(
      products.map(p =>
        p.id === productId ? { ...p, ...updates } : p,
      ),
    )
  }

  const deleteProduct = (productId: string) => {
    setProducts(products.filter(p => p.id !== productId))
  }

  const decreaseStock = (productId: string, quantity: number): boolean => {
    const product = products.find(p => p.id === productId)
    if (!product || product.stock < quantity) {
      return false
    }
    updateProduct(productId, { stock: product.stock - quantity })
    return true
  }

  const getProductById = (productId: string) => {
    return products.find(p => p.id === productId)
  }

  const getProductsByCategory = (category: string) => {
    return products.filter(p => p.category === category)
  }

  const getStockStatus = (product: StoredProduct): 'ok' | 'low' | 'out' => {
    if (product.stock <= 0) return 'out'
    if (product.stock <= product.alertThreshold) return 'low'
    return 'ok'
  }

  return {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    decreaseStock,
    getProductById,
    getProductsByCategory,
    getStockStatus,
  }
}
