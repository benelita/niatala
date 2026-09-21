import type { Product } from '../types'
import { useStorage } from './useStorage'
import { useAuthContext } from '../context/AuthContext'

export interface StoredProduct extends Product {
  stock: number
  alertThreshold: number
  barcode?: string
  description?: string
}

export function useProducts() {
  const { session } = useAuthContext()
  const [products, setProducts] = useStorage<StoredProduct[]>('niatala_products', [])

  const getTenantProducts = (): StoredProduct[] => {
    const tenantId = session?.tenantId || session?.userId
    return products.filter(p => (p.tenantId === tenantId) || (!p.tenantId && !session?.tenantId))
  }

  const addProduct = (product: Omit<StoredProduct, 'id'>): StoredProduct => {
    const tenantId = session?.tenantId || session?.userId
    const newProduct: StoredProduct = {
      ...product,
      id: `product_${Date.now()}`,
      tenantId: tenantId,
    }
    setProducts([...products, newProduct])
    return newProduct
  }

  const updateProduct = (productId: string, updates: Partial<StoredProduct>) => {
    // Only update if product belongs to current tenant
    const product = getTenantProducts().find(p => p.id === productId)
    if (!product) return

    setProducts(
      products.map(p =>
        p.id === productId && p.tenantId === session?.tenantId ? { ...p, ...updates } : p,
      ),
    )
  }

  const deleteProduct = (productId: string) => {
    // Only delete if product belongs to current tenant
    const product = getTenantProducts().find(p => p.id === productId)
    if (!product) return

    setProducts(products.filter(p => !(p.id === productId && p.tenantId === session?.tenantId)))
  }

  const decreaseStock = (productId: string, quantity: number): boolean => {
    const product = getTenantProducts().find(p => p.id === productId)
    if (!product || product.stock < quantity) {
      return false
    }
    updateProduct(productId, { stock: product.stock - quantity })
    return true
  }

  const getProductById = (productId: string) => {
    return getTenantProducts().find(p => p.id === productId)
  }

  const getProductsByCategory = (category: string) => {
    return getTenantProducts().filter(p => p.category === category)
  }

  const getStockStatus = (product: StoredProduct): 'ok' | 'low' | 'out' => {
    if (product.stock <= 0) return 'out'
    if (product.stock <= product.alertThreshold) return 'low'
    return 'ok'
  }

  return {
    products: getTenantProducts(),
    addProduct,
    updateProduct,
    deleteProduct,
    decreaseStock,
    getProductById,
    getProductsByCategory,
    getStockStatus,
  }
}
