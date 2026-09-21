import { useState, useRef } from 'react'
import type { PaymentMethod } from '../types'
import { useSales } from '../hooks/useSales'
import { useClients } from '../hooks/useClients'
import { useProducts } from '../hooks/useProducts'
import { useCategories } from '../hooks/useCategories'
import { useCart } from '../hooks/useCart'
import { useSettings } from '../hooks/useSettings'
import { useAuthContext } from '../context/AuthContext'
import { logAction } from '../services/auditService'
import { getPaymentSettingsForUser } from '../services/paymentSettingsService'
import { addFreeAmount } from '../services/freeAmountService'
import '../styles/CashierScreen.css'

interface CreditModalData {
  selectedClientId: string | null
  paidAmount: number
  searchTerm: string
  newClientForm: {
    name: string
    phone: string
  }
}

interface PartialPaymentData {
  amount: number
  method: PaymentMethod
  hasRemainder: boolean
  remainder: number
  selectedClientId: string | null
  searchTerm: string
  newClientForm: {
    name: string
    phone: string
  }
  tab: 'search' | 'new'
}

export function CashierScreen() {
  const { session } = useAuthContext()
  const { addSale } = useSales()
  const { clients, addClient, addDebtOperation } = useClients()
  const { products, decreaseStock } = useProducts()
  const { categories } = useCategories()
  const { cart, addToCart: cartAddToCart, updateQuantity: cartUpdateQuantity, removeFromCart: cartRemoveFromCart, clearCart, addFreeAmountToCart: cartAddFreeAmountToCart } = useCart()
  const { enableInventory } = useSettings()

  const categoriesRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Tous')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null)
  const [showCreditModal, setShowCreditModal] = useState(false)
  const [showPartialPaymentModal, setShowPartialPaymentModal] = useState(false)
  const [creditData, setCreditData] = useState<CreditModalData>({
    selectedClientId: null,
    paidAmount: 0,
    searchTerm: '',
    newClientForm: { name: '', phone: '' },
  })
  const [partialPaymentData, setPartialPaymentData] = useState<PartialPaymentData>({
    amount: 0,
    method: 'cash',
    hasRemainder: false,
    remainder: 0,
    selectedClientId: null,
    searchTerm: '',
    newClientForm: { name: '', phone: '' },
    tab: 'search',
  })
  const [creditTab, setCreditTab] = useState<'search' | 'new'>('search')
  const [freeAmountInput, setFreeAmountInput] = useState('')
  const [cartFullscreen, setCartFullscreen] = useState(false)
  const [cashReceived, setCashReceived] = useState(0)

  const now = new Date()
  const timeString = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  const dateString = now.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  const checkScroll = () => {
    if (categoriesRef.current) {
      setCanScrollLeft(categoriesRef.current.scrollLeft > 0)
      setCanScrollRight(
        categoriesRef.current.scrollLeft <
          categoriesRef.current.scrollWidth - categoriesRef.current.clientWidth - 10
      )
    }
  }

  const scroll = (direction: 'left' | 'right') => {
    if (categoriesRef.current) {
      const scrollAmount = 150
      if (direction === 'left') {
        categoriesRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' })
      } else {
        categoriesRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
      }
      setTimeout(checkScroll, 300)
    }
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = selectedCategory === 'Tous' || product.category === selectedCategory
    return matchesSearch && matchesCategory
  })


  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const discount = 0
  const total = subtotal - discount

  const handleAddFreeAmount = () => {
    const amount = parseFloat(freeAmountInput)
    if (isNaN(amount) || amount <= 0) {
      return
    }
    cartAddFreeAmountToCart(amount)
    setFreeAmountInput('')
  }


  const handleCreditPayment = () => {
    if (!creditData.selectedClientId && creditTab === 'search') {
      alert('Veuillez sélectionner un client')
      return
    }

    if (creditData.paidAmount < 0 || creditData.paidAmount > total) {
      alert('Montant invalide')
      return
    }

    let clientId: string
    if (creditTab === 'search') {
      clientId = creditData.selectedClientId!
    } else {
      if (!creditData.newClientForm.name.trim() || !creditData.newClientForm.phone.trim()) {
        alert('Veuillez remplir le nom et le téléphone du client')
        return
      }

      const newClient = addClient({
        name: creditData.newClientForm.name,
        phone: creditData.newClientForm.phone,
      })
      clientId = newClient.id
    }

    completeCheckout('credit', { id: clientId }, creditData.paidAmount)
  }

  const handlePartialPayment = () => {
    const paidAmount = partialPaymentData.method === 'cash' ? cashReceived : partialPaymentData.amount

    if (partialPaymentData.method === 'cash') {
      if (cashReceived === 0) {
        alert('Veuillez entrer la somme reçue')
        return
      }
    } else {
      if (paidAmount < 0 || paidAmount > total) {
        alert('Montant invalide')
        return
      }
    }

    const remainder = total - paidAmount

    if (remainder > 0) {
      // Il y a un solde à payer, créer un crédit - client OBLIGATOIRE
      let clientInfo: { id: string; name?: string; phone?: string } | undefined

      if (partialPaymentData.tab === 'search') {
        if (!partialPaymentData.selectedClientId) {
          alert('Veuillez sélectionner un client pour le crédit')
          return
        }
        clientInfo = { id: partialPaymentData.selectedClientId }
      } else {
        if (!partialPaymentData.newClientForm.name.trim() || !partialPaymentData.newClientForm.phone.trim()) {
          alert('Veuillez remplir le nom et le téléphone du client')
          return
        }

        clientInfo = {
          id: `client_${Date.now()}`,
          name: partialPaymentData.newClientForm.name,
          phone: partialPaymentData.newClientForm.phone,
        }
      }

      completeCheckout(partialPaymentData.method, clientInfo, paidAmount)
    } else {
      // Paiement complet, pas de crédit
      completeCheckout(partialPaymentData.method, undefined, paidAmount)
    }
  }

  const completeCheckout = (
    method: PaymentMethod,
    clientInfo?: { id: string; name?: string; phone?: string },
    paidAmount?: number,
  ) => {
    if (cart.length === 0) {
      alert('Le panier est vide')
      return
    }

    // Utiliser l'ID du client (sera créé si nécessaire dans addDebtOperation)
    let clientId: string | undefined = undefined
    let newClientInfo: { name: string; phone: string } | undefined = undefined

    if (clientInfo) {
      clientId = clientInfo.id
      if (clientInfo.name && clientInfo.phone) {
        // Nouveau client - passer les infos à addDebtOperation pour créer ensemble
        newClientInfo = { name: clientInfo.name, phone: clientInfo.phone }
      }
    }

    // Séparer les sommes libres des produits réguliers
    const regularItems = cart.filter(item => !(item as any).isFreeAmount)

    const saleItems = cart.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
    }))

    const actualPaidAmount = paidAmount ?? total
    const remainingAmount = total - actualPaidAmount

    const sale = addSale({
      items: saleItems,
      total,
      paymentMethod: method,
      clientId,
      paidAmount: actualPaidAmount,
      remainingAmount,
      cashierId: session?.userId,
    })

    try {
      // Enregistrer l'action dans l'audit
      if (session) {
        logAction(session.userId, session.username, session.role, 'CREATE_SALE', {
          reference: sale.saleNumber,
          amount: sale.total,
          details: {
            paymentMethod: method,
            itemCount: saleItems.length,
          },
        })
      }

      // Décrémenter le stock pour chaque article vendu (sauf sommes libres) - seulement si l'inventaire est activé
      if (enableInventory) {
        let insufficientStock = false
        for (const item of regularItems) {
          if (!decreaseStock(item.id, item.quantity)) {
            insufficientStock = true
          }
        }

        if (insufficientStock) {
          alert('⚠️ Attention : Stock insuffisant pour certains articles!')
        }
      }

      // Enregistrer les sommes libres depuis le panier
      for (const item of cart) {
        if ((item as any).isFreeAmount) {
          addFreeAmount(sale.id, item.price)
        }
      }

      // Ajouter une opération de crédit si montant payé < total
      if (clientId && remainingAmount > 0) {
        addDebtOperation(clientId, {
          date: Date.now(),
          type: 'PURCHASE',
          amount: remainingAmount,
          balance: remainingAmount,
          saleId: sale.id,
        }, newClientInfo)
      }
    } catch (e) {
      alert(`Erreur : ${e}`)
      return
    }

    const methodLabels: Record<PaymentMethod, string> = {
      cash: 'ESPÈCES',
      wave: 'WAVE',
      orange_money: 'ORANGE MONEY',
      free: 'FREE',
      card: 'CARTE',
      credit: 'CRÉDIT',
    }

    alert(
      `✅ Vente enregistrée : ${sale.saleNumber}\n` +
      `Montant : ${total.toLocaleString('fr-FR')} FCFA\n` +
      `Payé : ${actualPaidAmount.toLocaleString('fr-FR')} FCFA (${methodLabels[method]})` +
      (remainingAmount > 0 ? `\nCrédit : ${remainingAmount.toLocaleString('fr-FR')} FCFA` : ''),
    )

    clearCart()
    setPaymentMethod(null)
    setFreeAmountInput('')
    setCreditData({
      selectedClientId: null,
      paidAmount: 0,
      searchTerm: '',
      newClientForm: { name: '', phone: '' },
    })
    setPartialPaymentData({
      amount: 0,
      method: 'cash',
      hasRemainder: false,
      remainder: 0,
      selectedClientId: null,
      searchTerm: '',
      newClientForm: { name: '', phone: '' },
      tab: 'search',
    })
    setShowCreditModal(false)
    setShowPartialPaymentModal(false)
    setCashReceived(0)
  }

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert('Le panier est vide')
      return
    }
    if (!paymentMethod) {
      alert('Veuillez sélectionner un mode de paiement')
      return
    }

    if (paymentMethod === 'credit') {
      setShowCreditModal(true)
      return
    }

    // Paiements partiels (cash, wave, card)
    setPartialPaymentData({
      amount: total,
      method: paymentMethod,
      hasRemainder: false,
      remainder: 0,
      selectedClientId: null,
      searchTerm: '',
      newClientForm: { name: '', phone: '' },
      tab: 'search',
    })
    setShowPartialPaymentModal(true)
  }

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(creditData.searchTerm.toLowerCase()) ||
    c.phone.includes(creditData.searchTerm),
  )

  return (
    <div className="cashier-screen">
      <header className="header">
        <div className="header-left">
          <h1 className="logo">NIATALA</h1>
          <p className="subtitle">Caisse</p>
        </div>
        <div className="header-right">
          <div className="time-info">
            <div className="time">{timeString}</div>
            <div className="date">{dateString}</div>
          </div>
          <div className="cashier-info">Caissier</div>
        </div>
      </header>

      <div className="main-container">
        <main className="content">
          <div className="products-section">
            <div className="search-bar">
              <input
                type="text"
                placeholder="Rechercher un produit..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-input"
              />
              <button className="scanner-btn">
                <span className="icon">🔍</span>
                <span className="label">Scanner</span>
              </button>
            </div>

            <div className="categories-wrapper">
              {canScrollLeft && (
                <button className="scroll-arrow scroll-left" onClick={() => scroll('left')}>
                  ◀
                </button>
              )}
              <div
                className="categories"
                ref={categoriesRef}
                onScroll={checkScroll}
                onLoad={checkScroll}
              >
                {['Tous', ...categories].map(cat => (
                  <button
                    key={cat}
                    className={`category-btn ${selectedCategory === cat ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              {canScrollRight && (
                <button className="scroll-arrow scroll-right" onClick={() => scroll('right')}>
                  ▶
                </button>
              )}
            </div>

            <div className="products-grid">
              {filteredProducts.map(product => (
                <button
                  key={product.id}
                  className="product-card"
                  onClick={() => cartAddToCart(product)}
                >
                  <div className="product-emoji">{product.emoji || '📦'}</div>
                  <div className="product-name">{product.name}</div>
                  <div className="product-price">{product.price.toLocaleString('fr-FR')} FCFA</div>
                </button>
              ))}
            </div>
          </div>
        </main>

        <aside className="cart-sidebar">
          <h2 className="cart-title" onClick={() => setCartFullscreen(!cartFullscreen)} style={{ cursor: 'pointer' }}>
            📦 Panier {cartFullscreen ? '✕' : '⤢'}
          </h2>

          <div className="cart-items">
            {cart.length === 0 ? (
              <p className="empty-cart">Panier vide</p>
            ) : (
              cart.map(item => {
                const isFreeAmount = (item as any).isFreeAmount
                return (
                  <div key={item.id} className={`cart-item ${isFreeAmount ? 'free-amount-item' : ''}`}>
                    <div className="cart-item-header">
                      {!isFreeAmount && <span className="item-emoji">{item.emoji || '📦'}</span>}
                      <div className="cart-item-name">{isFreeAmount ? '💵 Somme libre' : item.name}</div>
                      <button
                        className="delete-btn"
                        onClick={() => cartRemoveFromCart(item.id)}
                        title="Supprimer"
                      >
                        ✕
                      </button>
                    </div>
                    {!isFreeAmount && <div className="cart-item-price">{item.price.toLocaleString('fr-FR')} FCFA</div>}
                    <div className={isFreeAmount ? 'cart-item-price' : 'cart-item-controls'}>
                      {isFreeAmount ? (
                        <span>{item.price.toLocaleString('fr-FR')} FCFA</span>
                      ) : (
                        <>
                          <button
                            className="qty-btn"
                            onClick={() => cartUpdateQuantity(item.id, item.quantity - 1)}
                          >
                            −
                          </button>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => cartUpdateQuantity(item.id, parseInt(e.target.value) || 0)}
                            className="qty-input"
                            min="1"
                          />
                          <button
                            className="qty-btn"
                            onClick={() => cartUpdateQuantity(item.id, item.quantity + 1)}
                          >
                            +
                          </button>
                        </>
                      )}
                    </div>
                    {!isFreeAmount && (
                      <div className="cart-item-total">
                        {(item.price * item.quantity).toLocaleString('fr-FR')} FCFA
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>

          {cart.length > 0 && (
            <>
              <div className="cart-summary">
                <div className="summary-line">
                  <span>Sous-total</span>
                  <span className="amount">{subtotal.toLocaleString('fr-FR')} FCFA</span>
                </div>
                <div className="summary-line">
                  <span>Réduction</span>
                  <span className="amount">{discount.toLocaleString('fr-FR')} FCFA</span>
                </div>


                <div className="summary-line total">
                  <span>TOTAL</span>
                  <span className="amount">{total.toLocaleString('fr-FR')} FCFA</span>
                </div>
              </div>

              <div className="payment-methods">
                {(() => {
                  const isAdmin = session?.role === 'ADMIN'
                  const enabledMethods = session?.userId ? getPaymentSettingsForUser(session.userId).enabledMethods : ['cash']

                  return (
                    <>
                      <button
                        className={`payment-btn ${paymentMethod === 'cash' ? 'selected' : ''}`}
                        onClick={() => setPaymentMethod('cash')}
                      >
                        💵 ESPÈCES
                      </button>

                      {(isAdmin || enabledMethods.includes('wave')) && (
                        <button
                          className={`payment-btn ${paymentMethod === 'wave' ? 'selected' : ''}`}
                          onClick={() => setPaymentMethod('wave')}
                        >
                          📱 WAVE
                        </button>
                      )}

                      {(isAdmin || enabledMethods.includes('orange_money')) && (
                        <button
                          className={`payment-btn ${paymentMethod === 'orange_money' ? 'selected' : ''}`}
                          onClick={() => setPaymentMethod('orange_money' as PaymentMethod)}
                        >
                          🟠 ORANGE
                        </button>
                      )}

                      {(isAdmin || enabledMethods.includes('free')) && (
                        <button
                          className={`payment-btn ${paymentMethod === 'free' ? 'selected' : ''}`}
                          onClick={() => setPaymentMethod('free' as PaymentMethod)}
                        >
                          🟪 FREE
                        </button>
                      )}

                      {(isAdmin || enabledMethods.includes('card')) && (
                        <button
                          className={`payment-btn ${paymentMethod === 'card' ? 'selected' : ''}`}
                          onClick={() => setPaymentMethod('card')}
                        >
                          💳 CARTE
                        </button>
                      )}

                      <button
                        className={`payment-btn ${paymentMethod === 'credit' ? 'selected' : ''}`}
                        onClick={() => setPaymentMethod('credit')}
                      >
                        📒 CRÉDIT
                      </button>
                    </>
                  )
                })()}
                <button
                  className="checkout-btn"
                  onClick={handleCheckout}
                  onTouchEnd={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleCheckout()
                  }}
                  type="button"
                >
                  ENCAISSER
                </button>
              </div>
            </>
          )}
        </aside>
      </div>

      {cartFullscreen && (
        <div className="cart-fullscreen-modal" onClick={() => setCartFullscreen(false)}>
          <div className="cart-fullscreen-content" onClick={(e) => e.stopPropagation()}>
            <div className="cart-fullscreen-header">
              <h2>📦 Panier Complet</h2>
              <button className="close-btn" onClick={() => setCartFullscreen(false)}>✕</button>
            </div>
            <div className="cart-fullscreen-items">
              {cart.length === 0 ? (
                <p>Panier vide</p>
              ) : (
                cart.map((item) => {
                  const isFreeAmount = (item as any).isFreeAmount
                  return (
                    <div key={item.id} className={`fullscreen-cart-item ${isFreeAmount ? 'free-amount-item' : ''}`}>
                      <div className="item-header">
                        {!isFreeAmount && <span className="item-emoji">{item.emoji || '📦'}</span>}
                        <div>{isFreeAmount ? '💵 Somme libre' : item.name}</div>
                        <button className="remove-btn" onClick={() => cartRemoveFromCart(item.id)}>
                          ✕
                        </button>
                      </div>
                      <div className="item-price">
                        {item.price.toLocaleString('fr-FR')} FCFA
                      </div>
                      {!isFreeAmount && (
                        <div className="item-controls">
                          <button className="qty-btn" onClick={() => cartUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}>
                            −
                          </button>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 1
                              if (val > 0) cartUpdateQuantity(item.id, val)
                            }}
                            className="qty-input"
                            min="1"
                          />
                          <button className="qty-btn" onClick={() => cartUpdateQuantity(item.id, item.quantity + 1)}>
                            +
                          </button>
                          <div className="item-total">
                            = {(item.price * item.quantity).toLocaleString('fr-FR')} FCFA
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
            <div className="cart-fullscreen-summary">
              <div className="free-amount-form">
                <label className="free-amount-label">💵 Somme libre</label>
                <input
                  type="number"
                  placeholder="Montant FCFA"
                  value={freeAmountInput}
                  onChange={(e) => setFreeAmountInput(e.target.value)}
                  onBlur={handleAddFreeAmount}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddFreeAmount()
                    }
                  }}
                  min="0"
                  step="100"
                  autoComplete="off"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    borderRadius: '0.375rem',
                    border: '1px solid var(--border)',
                    fontSize: '0.875rem',
                  }}
                />
              </div>
              <div className="summary-line">
                <span>Sous-total</span>
                <span>{subtotal.toLocaleString('fr-FR')} FCFA</span>
              </div>
              <div className="summary-line total">
                <span>TOTAL</span>
                <span>{total.toLocaleString('fr-FR')} FCFA</span>
              </div>

              <div className="fullscreen-payment-methods">
                {(() => {
                  const isAdmin = session?.role === 'ADMIN'
                  const enabledMethods = session?.userId ? getPaymentSettingsForUser(session.userId).enabledMethods : ['cash']

                  return (
                    <>
                      <button
                        className={`fullscreen-payment-btn ${paymentMethod === 'cash' ? 'selected' : ''}`}
                        onClick={() => setPaymentMethod('cash')}
                      >
                        💵 ESPÈCES
                      </button>
                      {(isAdmin || enabledMethods.includes('wave')) && (
                        <button
                          className={`fullscreen-payment-btn ${paymentMethod === 'wave' ? 'selected' : ''}`}
                          onClick={() => setPaymentMethod('wave')}
                        >
                          📱 WAVE
                        </button>
                      )}
                      {(isAdmin || enabledMethods.includes('orange_money')) && (
                        <button
                          className={`fullscreen-payment-btn ${paymentMethod === 'orange_money' ? 'selected' : ''}`}
                          onClick={() => setPaymentMethod('orange_money' as PaymentMethod)}
                        >
                          🟠 ORANGE
                        </button>
                      )}
                      {(isAdmin || enabledMethods.includes('free')) && (
                        <button
                          className={`fullscreen-payment-btn ${paymentMethod === 'free' ? 'selected' : ''}`}
                          onClick={() => setPaymentMethod('free' as PaymentMethod)}
                        >
                          🟪 FREE
                        </button>
                      )}
                      {(isAdmin || enabledMethods.includes('card')) && (
                        <button
                          className={`fullscreen-payment-btn ${paymentMethod === 'card' ? 'selected' : ''}`}
                          onClick={() => setPaymentMethod('card')}
                        >
                          💳 CARTE
                        </button>
                      )}
                      <button
                        className={`fullscreen-payment-btn ${paymentMethod === 'credit' ? 'selected' : ''}`}
                        onClick={() => setPaymentMethod('credit')}
                      >
                        📒 CRÉDIT
                      </button>
                    </>
                  )
                })()}
              </div>

              <button
                className="fullscreen-checkout-btn"
                onClick={handleCheckout}
                onTouchEnd={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleCheckout()
                }}
                type="button"
              >
                ENCAISSER
              </button>
            </div>
          </div>
        </div>
      )}

      {showPartialPaymentModal && (
        <div className="modal-overlay" onClick={() => {
          setShowPartialPaymentModal(false)
          setCashReceived(0)
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>💳 Paiement {partialPaymentData.method === 'cash' ? 'ESPÈCES' : partialPaymentData.method === 'wave' ? 'WAVE' : 'CARTE'}</h3>
              <button className="modal-close" onClick={() => {
                setShowPartialPaymentModal(false)
                setCashReceived(0)
              }}>
                ✕
              </button>
            </div>

            <div className="credit-info">
              <div className="info-section">
                <label>Montant total :</label>
                <div className="amount">{total.toLocaleString('fr-FR')} FCFA</div>
              </div>

              {partialPaymentData.method === 'cash' ? (
                <>
                  <div className="info-section">
                    <label>Somme reçue du client :</label>
                    <input
                      type="number"
                      value={cashReceived || ''}
                      onChange={(e) => {
                        const amount = Math.max(0, parseInt(e.target.value) || 0)
                        const remainder = Math.max(0, total - amount)
                        setCashReceived(amount)
                        setPartialPaymentData({
                          ...partialPaymentData,
                          amount,
                          remainder,
                          hasRemainder: remainder > 0,
                        })
                      }}
                      onFocus={(e) => e.target.select()}
                      className="amount-input"
                      min="0"
                      placeholder="0"
                    />
                  </div>

                  {cashReceived > 0 && (
                    <div className={`change-display ${cashReceived >= total ? 'success' : 'error'}`}>
                      <div className="change-row">
                        <span>Montant à payer :</span>
                        <span>{total.toLocaleString('fr-FR')} FCFA</span>
                      </div>
                      <div className="change-row">
                        <span>Somme reçue :</span>
                        <span>{cashReceived.toLocaleString('fr-FR')} FCFA</span>
                      </div>
                      <div className="change-row change-result">
                        <span>{cashReceived >= total ? '💵 Monnaie à rendre :' : '⚠️ Montant insuffisant :'}</span>
                        <span className={cashReceived >= total ? 'text-success' : 'text-error'}>
                          {Math.abs(total - cashReceived).toLocaleString('fr-FR')} FCFA
                        </span>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="info-section">
                  <label>Montant {partialPaymentData.method === 'wave' ? 'WAVE' : 'en carte'} :</label>
                  <input
                    type="number"
                    value={partialPaymentData.amount || ''}
                    onChange={(e) => {
                      const amount = Math.max(0, parseInt(e.target.value) || 0)
                      const remainder = Math.max(0, total - amount)
                      setPartialPaymentData({
                        ...partialPaymentData,
                        amount,
                        remainder,
                        hasRemainder: remainder > 0,
                      })
                    }}
                    onFocus={(e) => e.target.select()}
                    className="amount-input"
                    min="0"
                    max={total}
                  />
                </div>
              )}

              {partialPaymentData.remainder > 0 && (
                <>
                  <div className="debt-preview">
                    <div className="preview-row">
                      <span>Crédit à créer :</span>
                      <span className="debt-amount">
                        {partialPaymentData.remainder.toLocaleString('fr-FR')} FCFA
                      </span>
                    </div>
                  </div>

                  <div className="credit-tabs">
                    <button
                      className={`tab ${partialPaymentData.tab === 'search' ? 'active' : ''}`}
                      onClick={() => setPartialPaymentData({ ...partialPaymentData, tab: 'search' })}
                    >
                      Client existant
                    </button>
                    <button
                      className={`tab ${partialPaymentData.tab === 'new' ? 'active' : ''}`}
                      onClick={() => setPartialPaymentData({ ...partialPaymentData, tab: 'new' })}
                    >
                      Nouveau client
                    </button>
                  </div>

                  {partialPaymentData.tab === 'search' ? (
                    <div className="credit-search">
                      <input
                        type="text"
                        placeholder="Rechercher un client..."
                        value={partialPaymentData.searchTerm}
                        onChange={(e) =>
                          setPartialPaymentData({
                            ...partialPaymentData,
                            searchTerm: e.target.value,
                          })
                        }
                        className="search-input"
                      />
                      {filteredClients.length > 0 && (
                        <div className="client-list">
                          {filteredClients.map(client => (
                            <button
                              key={client.id}
                              className={`client-item ${
                                partialPaymentData.selectedClientId === client.id ? 'selected' : ''
                              }`}
                              onClick={() =>
                                setPartialPaymentData({
                                  ...partialPaymentData,
                                  selectedClientId: client.id,
                                })
                              }
                            >
                              <div className="client-name">{client.name}</div>
                              <div className="client-phone">{client.phone}</div>
                              <div className="client-debt">
                                Dette: {client.totalDebt.toLocaleString('fr-FR')} FCFA
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="credit-form">
                      <input
                        type="text"
                        placeholder="Nom complet"
                        value={partialPaymentData.newClientForm.name}
                        onChange={(e) =>
                          setPartialPaymentData({
                            ...partialPaymentData,
                            newClientForm: {
                              ...partialPaymentData.newClientForm,
                              name: e.target.value,
                            },
                          })
                        }
                        className="form-input"
                      />
                      <input
                        type="tel"
                        placeholder="Téléphone"
                        value={partialPaymentData.newClientForm.phone}
                        onChange={(e) =>
                          setPartialPaymentData({
                            ...partialPaymentData,
                            newClientForm: {
                              ...partialPaymentData.newClientForm,
                              phone: e.target.value,
                            },
                          })
                        }
                        className="form-input"
                      />
                    </div>
                  )}
                </>
              )}
            </div>

            <button
              className="btn-primary-large"
              onClick={handlePartialPayment}
              onTouchEnd={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handlePartialPayment()
              }}
              type="button"
            >
              Valider le paiement
            </button>
          </div>
        </div>
      )}

      {showCreditModal && (
        <div className="modal-overlay" onClick={() => setShowCreditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📒 Vente à crédit</h3>
              <button className="modal-close" onClick={() => setShowCreditModal(false)}>
                ✕
              </button>
            </div>

            <div className="credit-tabs">
              <button
                className={`tab ${creditTab === 'search' ? 'active' : ''}`}
                onClick={() => setCreditTab('search')}
              >
                Client existant
              </button>
              <button
                className={`tab ${creditTab === 'new' ? 'active' : ''}`}
                onClick={() => setCreditTab('new')}
              >
                Nouveau client
              </button>
            </div>

            {creditTab === 'search' ? (
              <div className="credit-search">
                <input
                  type="text"
                  placeholder="Rechercher un client..."
                  value={creditData.searchTerm}
                  onChange={(e) =>
                    setCreditData({
                      ...creditData,
                      searchTerm: e.target.value,
                    })
                  }
                  className="search-input"
                />
                {filteredClients.length > 0 && (
                  <div className="client-list">
                    {filteredClients.map(client => (
                      <button
                        key={client.id}
                        className={`client-item ${
                          creditData.selectedClientId === client.id ? 'selected' : ''
                        }`}
                        onClick={() =>
                          setCreditData({
                            ...creditData,
                            selectedClientId: client.id,
                          })
                        }
                      >
                        <div className="client-name">{client.name}</div>
                        <div className="client-phone">{client.phone}</div>
                        <div className="client-debt">
                          Dette: {client.totalDebt.toLocaleString('fr-FR')} FCFA
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="credit-form">
                <input
                  type="text"
                  placeholder="Nom complet"
                  value={creditData.newClientForm.name}
                  onChange={(e) =>
                    setCreditData({
                      ...creditData,
                      newClientForm: {
                        ...creditData.newClientForm,
                        name: e.target.value,
                      },
                    })
                  }
                  className="form-input"
                />
                <input
                  type="tel"
                  placeholder="Téléphone"
                  value={creditData.newClientForm.phone}
                  onChange={(e) =>
                    setCreditData({
                      ...creditData,
                      newClientForm: {
                        ...creditData.newClientForm,
                        phone: e.target.value,
                      },
                    })
                  }
                  className="form-input"
                />
              </div>
            )}

            <div className="credit-info">
              <div className="info-section">
                <label>Montant de la vente :</label>
                <div className="amount">{total.toLocaleString('fr-FR')} FCFA</div>
              </div>

              <div className="info-section">
                <label>Montant payé maintenant :</label>
                <input
                  type="number"
                  value={creditData.paidAmount || ''}
                  onChange={(e) =>
                    setCreditData({
                      ...creditData,
                      paidAmount: Math.max(0, parseInt(e.target.value) || 0),
                    })
                  }
                  onFocus={(e) => e.target.select()}
                  className="amount-input"
                  min="0"
                  max={total}
                />
              </div>

              <div className="quick-amounts">
                <button
                  type="button"
                  onClick={() =>
                    setCreditData({
                      ...creditData,
                      paidAmount: 0,
                    })
                  }
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setCreditData({
                      ...creditData,
                      paidAmount: Math.min(5000, total),
                    })
                  }
                >
                  5K
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setCreditData({
                      ...creditData,
                      paidAmount: Math.min(10000, total),
                    })
                  }
                >
                  10K
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setCreditData({
                      ...creditData,
                      paidAmount: total,
                    })
                  }
                  className="total-btn"
                >
                  TOTAL
                </button>
              </div>

              <div className="debt-preview">
                <div className="preview-row">
                  <span>Montant restant dû :</span>
                  <span className="debt-amount">
                    {Math.max(0, total - creditData.paidAmount).toLocaleString('fr-FR')} FCFA
                  </span>
                </div>
              </div>
            </div>

            <button
              className="btn-primary-large"
              onClick={handleCreditPayment}
              onTouchEnd={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleCreditPayment()
              }}
              type="button"
            >
              Valider la vente
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
