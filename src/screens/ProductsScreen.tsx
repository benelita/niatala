import { useState } from 'react'
import { useProducts, type StoredProduct } from '../hooks/useProducts'
import { useCategories } from '../hooks/useCategories'
import { useAuthContext } from '../context/AuthContext'
import { useInventoryAuthorization } from '../hooks/useInventoryAuthorization'
import { PRODUCT_EMOJIS, EMOJI_BANKS } from '../constants/productEmojis'
import '../styles/ProductsScreen.css'

export function ProductsScreen() {
  const { session } = useAuthContext()
  const isAdmin = session?.role === 'ADMIN' || session?.role === 'SUPER_ADMIN'
  const isCashier = session?.role === 'CASHIER'
  const { hasAccess: inventoryAccess, authorization, loading, getTimeRemaining } = useInventoryAuthorization()
  const { products, addProduct, updateProduct, deleteProduct, getStockStatus } = useProducts()
  const { categories, addCategory, removeCategory } = useCategories()

  const [showForm, setShowForm] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<StoredProduct | null>(null)
  const [selectedEmoji, setSelectedEmoji] = useState('📦')
  const [emojiBank, setEmojiBank] = useState<'bar' | 'epicerie' | 'quincaillerie'>('epicerie')
  const [editingProduct, setEditingProduct] = useState<StoredProduct | null>(null)
  const [quickEditName, setQuickEditName] = useState('')
  const [quickEditCategory, setQuickEditCategory] = useState('')
  const [quickEditStock, setQuickEditStock] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    costPrice: '',
    category: 'Alimentation',
    stock: '',
    alertThreshold: '',
    barcode: '',
    description: '',
    useCustomThresholds: false,
    customThresholdOrange: '',
    customThresholdRed: '',
  })
  const [newCategory, setNewCategory] = useState('')

  const currentEmojis = EMOJI_BANKS[emojiBank]

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.price || !formData.stock) {
      alert('Remplissez les champs obligatoires')
      return
    }

    const newProduct: Omit<StoredProduct, 'id'> = {
      name: formData.name,
      price: Math.round(parseFloat(formData.price) * 100) / 100,
      costPrice: formData.costPrice ? Math.round(parseFloat(formData.costPrice) * 100) / 100 : undefined,
      category: formData.category,
      stock: parseInt(formData.stock),
      alertThreshold: parseInt(formData.alertThreshold) || 5,
      barcode: formData.barcode || undefined,
      description: formData.description || undefined,
      emoji: selectedEmoji,
      useDefaultThresholds: !formData.useCustomThresholds,
      customThresholdOrange: formData.useCustomThresholds && formData.customThresholdOrange ? parseInt(formData.customThresholdOrange) : undefined,
      customThresholdRed: formData.useCustomThresholds && formData.customThresholdRed ? parseInt(formData.customThresholdRed) : undefined,
    }

    addProduct(newProduct)
    setFormData({ name: '', price: '', costPrice: '', category: 'Alimentation', stock: '', alertThreshold: '', barcode: '', description: '', useCustomThresholds: false, customThresholdOrange: '', customThresholdRed: '' })
    setSelectedEmoji('📦')
    setShowForm(false)
  }

  const handleUpdateProduct = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProduct) return

    updateProduct(selectedProduct.id, {
      name: formData.name || selectedProduct.name,
      price: formData.price ? Math.round(parseFloat(formData.price) * 100) / 100 : selectedProduct.price,
      costPrice: formData.costPrice ? Math.round(parseFloat(formData.costPrice) * 100) / 100 : selectedProduct.costPrice,
      category: formData.category,
      stock: formData.stock ? parseInt(formData.stock) : selectedProduct.stock,
      alertThreshold: formData.alertThreshold ? parseInt(formData.alertThreshold) : selectedProduct.alertThreshold,
      description: formData.description || selectedProduct.description,
      emoji: selectedEmoji,
      useDefaultThresholds: !formData.useCustomThresholds,
      customThresholdOrange: formData.useCustomThresholds && formData.customThresholdOrange ? parseInt(formData.customThresholdOrange) : selectedProduct.customThresholdOrange,
      customThresholdRed: formData.useCustomThresholds && formData.customThresholdRed ? parseInt(formData.customThresholdRed) : selectedProduct.customThresholdRed,
    })

    setSelectedProduct(null)
    setSelectedEmoji('📦')
    setFormData({ name: '', price: '', costPrice: '', category: 'Alimentation', stock: '', alertThreshold: '', barcode: '', description: '', useCustomThresholds: false, customThresholdOrange: '', customThresholdRed: '' })
  }

  const handleAddCategory = () => {
    if (newCategory.trim()) {
      addCategory(newCategory)
      setNewCategory('')
    }
  }

  const formatPrice = (price: number) => {
    return price.toLocaleString('fr-FR')
  }

  const handleQuickEdit = (product: StoredProduct) => {
    setEditingProduct(product)
    setQuickEditName(product.name)
    setQuickEditCategory(product.category)
    setQuickEditStock(product.stock.toString())
  }

  const handleSaveQuickEdit = () => {
    if (!editingProduct) return
    if (!quickEditName.trim()) {
      alert('Le nom est obligatoire')
      return
    }
    const newStock = parseInt(quickEditStock)
    if (isNaN(newStock) || newStock < 0) {
      alert('Le stock doit être un nombre positif')
      return
    }

    updateProduct(editingProduct.id, {
      name: quickEditName,
      price: editingProduct.price,
      costPrice: editingProduct.costPrice,
      category: quickEditCategory,
      stock: newStock,
      alertThreshold: editingProduct.alertThreshold,
      description: editingProduct.description,
      emoji: editingProduct.emoji,
      useDefaultThresholds: editingProduct.useDefaultThresholds,
      customThresholdOrange: editingProduct.customThresholdOrange,
      customThresholdRed: editingProduct.customThresholdRed,
    })

    setEditingProduct(null)
  }

  const getStatusBadge = (product: StoredProduct) => {
    const status = getStockStatus(product)
    switch (status) {
      case 'ok':
        return <span className="status-badge ok">🟢 OK</span>
      case 'low':
        return <span className="status-badge low">🟠 FAIBLE</span>
      case 'out':
        return <span className="status-badge out">🔴 RUPTURE</span>
    }
  }

  // Check if cashier has permission to manage inventory
  const hasCashierPermission = (() => {
    if (!isCashier) return true // Admins always have access
    try {
      const perms = JSON.parse(localStorage.getItem('cashier_inventory_access') || '{}')
      const expiresAt = perms[session?.userId]?.expiresAt
      if (expiresAt && expiresAt > Date.now()) return true
    } catch {
      // Ignore
    }
    return false
  })()

  // Check access for cashiers
  if (isCashier && (!inventoryAccess && !loading || !hasCashierPermission)) {
    const timeRemaining = getTimeRemaining()
    return (
      <div className="products-screen">
        <div className="products-header">
          <h2>Gestion des articles</h2>
        </div>
        <div className="access-denied">
          <p>🔒 Accès à l'inventaire non autorisé</p>
          <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
            Demandez à votre administrateur de vous accorder l'accès pour faire l'inventaire.
          </p>
          {timeRemaining && (
            <p style={{ fontSize: '0.85rem', marginTop: '0.5rem', color: '#666' }}>
              Accès valide pour: {timeRemaining.hours}h {timeRemaining.minutes}m
            </p>
          )}
        </div>
      </div>
    )
  }

  // Show remaining time if cashier has access
  const timeRemaining = isCashier && inventoryAccess ? getTimeRemaining() : null

  return (
    <div className="products-screen">
      <div className="products-header">
        <div>
          <h2>Gestion des articles</h2>
          <select
            value={emojiBank}
            onChange={(e) => {
              const newBank = e.target.value as 'bar' | 'epicerie' | 'quincaillerie'
              setEmojiBank(newBank)
              setSelectedEmoji(EMOJI_BANKS[newBank][0].emoji)
            }}
            style={{
              padding: '0.5rem',
              borderRadius: '0.375rem',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text)',
              cursor: 'pointer',
              marginTop: '0.5rem',
              fontSize: '0.9rem',
            }}
          >
            <option value="epicerie">🛒 Épicerie</option>
            <option value="bar">🍺 Bar</option>
            <option value="quincaillerie">🔨 Quincaillerie</option>
          </select>
        </div>
        {timeRemaining && (
          <div style={{ fontSize: '0.9rem', color: '#666' }}>
            ⏱️ Accès valide: {timeRemaining.hours}h {timeRemaining.minutes}m
          </div>
        )}
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Fermer' : '+ AJOUTER'}
        </button>
      </div>

      {showForm && !selectedProduct && (
        <form className="product-form" onSubmit={handleAddProduct}>
          <div className="form-row">
            <div className="form-group">
              <label>Nom de l'article *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Coca-Cola 33cl"
                required
              />
            </div>
            <div className="form-group">
              <label>Prix d'achat (FCFA)</label>
              <input
                type="number"
                value={formData.costPrice}
                onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                placeholder="300"
                min="0"
                step="0.01"
              />
            </div>
            <div className="form-group">
              <label>Prix de vente (FCFA) *</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="500"
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Catégorie *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Stock initial *</label>
              <input
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                placeholder="50"
                min="0"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Seuil d'alerte</label>
              <input
                type="number"
                value={formData.alertThreshold}
                onChange={(e) => setFormData({ ...formData, alertThreshold: e.target.value })}
                placeholder="10"
                min="0"
              />
            </div>
            <div className="form-group">
              <label>Code-barres</label>
              <input
                type="text"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                placeholder="(facultatif)"
              />
            </div>
          </div>

          <div className="form-group full">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="(facultatif)"
              rows={2}
            />
          </div>

          <div className="emoji-selector">
            <label>Illustration de l'article</label>
            <div className="emoji-grid">
              {currentEmojis.map((item) => (
                <button
                  key={item.emoji}
                  type="button"
                  className={`emoji-btn ${selectedEmoji === item.emoji ? 'active' : ''}`}
                  onClick={() => setSelectedEmoji(item.emoji)}
                  title={item.label}
                >
                  {item.emoji}
                </button>
              ))}
            </div>
            <div className="selected-emoji">Sélectionné: {selectedEmoji}</div>
          </div>

          <button type="submit" className="btn-primary">
            Ajouter l'article
          </button>
        </form>
      )}

      {selectedProduct && (
        <form className="product-form edit-form" onSubmit={handleUpdateProduct}>
          <h3>Modifier : {selectedProduct.name}</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Nom</label>
              <input
                type="text"
                defaultValue={selectedProduct.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Prix de vente (FCFA)</label>
              <input
                type="number"
                defaultValue={selectedProduct.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                min="0"
                step="0.01"
              />
            </div>
          </div>
          <div className="form-row">
            <button type="submit" className="btn-primary">Enregistrer</button>
            <button
              type="button"
              className="btn-danger"
              onClick={() => {
                deleteProduct(selectedProduct.id)
                setSelectedProduct(null)
              }}
            >
              Supprimer
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setSelectedProduct(null)}
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      <div className="categories-section">
        <h3>Catégories</h3>
        <div className="category-list">
          {categories.map((cat) => {
            const productsInCategory = products.filter(p => p.category === cat).length
            return (
              <div key={cat} className="category-item">
                <span className="category-tag">
                  {cat} ({productsInCategory})
                </span>
                {isAdmin && productsInCategory === 0 && (
                  <button
                    className="btn-delete-category"
                    onClick={() => {
                      if (confirm(`Êtes-vous sûr de vouloir supprimer la catégorie "${cat}" ?`)) {
                        removeCategory(cat)
                      }
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            )
          })}
        </div>
        <div className="add-category">
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="Nouvelle catégorie"
            onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
          />
          <button onClick={handleAddCategory}>+ Ajouter</button>
        </div>
      </div>

      <div className="articles-section">
        <h3>📋 Articles</h3>
        <div className="products-table">
          <table>
            <thead>
              <tr>
                <th>Produit</th>
                <th>Catégorie</th>
                <th>Prix</th>
                <th>Stock</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td className="product-name">{product.name}</td>
                  <td>{product.category}</td>
                  <td className="price">{formatPrice(product.price)} FCFA</td>
                  <td className="stock">{product.stock}</td>
                  <td>{getStatusBadge(product)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className="btn-small"
                        onClick={() => handleQuickEdit(product)}
                        title="Modifier"
                      >
                        ✏️ Modifier
                      </button>
                      {isAdmin && (
                        <button
                          className="btn-small btn-delete"
                          onClick={() => {
                            if (confirm(`Êtes-vous sûr de vouloir supprimer "${product.name}" ?`)) {
                              deleteProduct(product.id)
                            }
                          }}
                          title="Supprimer"
                          style={{ background: '#dc2626', color: 'white' }}
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editingProduct && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setEditingProduct(null)}>
          <div style={{ backgroundColor: 'var(--bg)', padding: '2rem', borderRadius: '0.5rem', minWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>Modifier: {editingProduct.name}</h3>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Nom du produit</label>
              <input
                type="text"
                value={quickEditName}
                onChange={(e) => setQuickEditName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '0.375rem',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text)',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Catégorie</label>
              <select
                value={quickEditCategory}
                onChange={(e) => setQuickEditCategory(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '0.375rem',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text)',
                  boxSizing: 'border-box',
                }}
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Stock</label>
              <input
                type="number"
                value={quickEditStock}
                onChange={(e) => setQuickEditStock(e.target.value)}
                min="0"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '0.375rem',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text)',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setEditingProduct(null)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.375rem',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--bg)',
                  color: 'var(--text)',
                  cursor: 'pointer',
                }}
              >
                Annuler
              </button>
              <button
                onClick={handleSaveQuickEdit}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.375rem',
                  border: 'none',
                  backgroundColor: '#059669',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                💾 Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
