import type { CartItem } from '../types'
import { useStorage } from './useStorage'

interface CartItemWithFreeAmount extends CartItem {
  isFreeAmount?: true
}

export function useCart() {
  const [cart, setCart] = useStorage<CartItemWithFreeAmount[]>('niatala_cart', [])

  const addToCart = (product: CartItem['id'] extends string ? Omit<CartItem, 'id' | 'quantity'> & { id: string } : never) => {
    setCart(prevCart => {
      const existing = prevCart.find(item => item.id === product.id)
      if (existing) {
        return prevCart.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
        )
      }
      return [...prevCart, { ...product, quantity: 1 }]
    })
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
    } else {
      setCart(prevCart =>
        prevCart.map(item =>
          item.id === productId ? { ...item, quantity } : item,
        ),
      )
    }
  }

  const removeFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId))
  }

  const clearCart = () => {
    setCart([])
  }

  const addFreeAmountToCart = (amount: number) => {
    const id = `free_amount_${Date.now()}_${Math.random().toString(36).substring(7)}`
    const freeAmountItem: CartItemWithFreeAmount = {
      id,
      name: 'Somme libre',
      price: amount,
      stock: 1,
      category: 'free_amount',
      quantity: 1,
      useDefaultThresholds: true,
      isFreeAmount: true,
    }
    setCart(prevCart => [...prevCart, freeAmountItem])
  }

  return {
    cart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    addFreeAmountToCart,
  }
}
