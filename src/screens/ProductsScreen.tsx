import { useState } from 'react'
import { useProducts, type StoredProduct } from '../hooks/useProducts'
import { useCategories } from '../hooks/useCategories'
import { PRODUCT_EMOJIS } from '../constants/productEmojis'
import '../styles/ProductsScreen.css'

export function ProductsScreen() {
  const { products, addProduct, updateProduct, deleteProduct, getStockStatus } = useProducts()
  const { categories, addCategory } = useCategories()

  const [showForm, setShowForm] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<StoredProduct | null>(null)
  const [selectedEmoji, setSelectedEmoji] = useState('📦')
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

  return (
    <div className="products-screen">
      <div className="products-header">
        <h2>Gestion des articles</h2>
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

          <div className="form-row">
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.useCustomThresholds}
                  onChange={(e) => setFormData({ ...formData, useCustomThresholds: e.target.checked })}
                />
                Utiliser des seuils personnalisés
              </label>
            </div>
          </div>

          {formData.useCustomThresholds && (
            <div className="form-row">
              <div className="form-group">
                <label>Seuil orange (faible)</label>
                <input
                  type="number"
                  value={formData.customThresholdOrange}
                  onChange={(e) => setFormData({ ...formData, customThresholdOrange: e.target.value })}
                  placeholder="10"
                  min="0"
                />
              </div>
              <div className="form-group">
                <label>Seuil rouge (critique)</label>
                <input
                  type="number"
                  value={formData.customThresholdRed}
                  onChange={(e) => setFormData({ ...formData, customThresholdRed: e.target.value })}
                  placeholder="5"
                  min="0"
                />
              </div>
            </div>
          )}

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
              {PRODUCT_EMOJIS.map((item) => (
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
              <label>Prix d'achat (FCFA)</label>
              <input
                type="number"
                defaultValue={selectedProduct.costPrice || ''}
                onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                min="0"
                step="0.01"
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
            <div className="form-group">
              <label>Catégorie</label>
              <select
                defaultValue={selectedProduct.category}
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
              <label>Stock</label>
              <input
                type="number"
                defaultValue={selectedProduct.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                min="0"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.useCustomThresholds}
                  onChange={(e) => setFormData({ ...formData, useCustomThresholds: e.target.checked })}
                />
                Utiliser des seuils personnalisés
              </label>
            </div>
          </div>

          {formData.useCustomThresholds && (
            <div className="form-row">
              <div className="form-group">
                <label>Seuil orange (faible)</label>
                <input
                  type="number"
                  defaultValue={selectedProduct.customThresholdOrange || ''}
                  onChange={(e) => setFormData({ ...formData, customThresholdOrange: e.target.value })}
                  placeholder="10"
                  min="0"
                />
              </div>
              <div className="form-group">
                <label>Seuil rouge (critique)</label>
                <input
                  type="number"
                  defaultValue={selectedProduct.customThresholdRed || ''}
                  onChange={(e) => setFormData({ ...formData, customThresholdRed: e.target.value })}
                  placeholder="5"
                  min="0"
                />
              </div>
            </div>
          )}

          <div className="form-group full">
            <label>Description</label>
            <textarea
              defaultValue={selectedProduct.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="(facultatif)"
              rows={2}
            />
          </div>

          <div className="emoji-selector">
            <label>Illustration de l'article</label>
            <div className="emoji-grid">
              {PRODUCT_EMOJIS.map((item) => (
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

          <div className="form-row">
            <button type="submit" className="btn-primary">
              Enregistrer
            </button>
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
          {categories.map((cat) => (
            <span key={cat} className="category-tag">
              {cat}
            </span>
          ))}
        </div>
        <div className="add-category">
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="Nouvelle catégorie"
            onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
          />
          <button onClick={handleAddCategory}>+ Ajouter</button>
        </div>
      </div>

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
                  <button
                    className="btn-small"
                    onClick={() => {
                      setSelectedProduct(product)
                      setSelectedEmoji(product.emoji || '📦')
                      setFormData({
                        name: product.name,
                        price: product.price.toString(),
                        costPrice: product.costPrice?.toString() || '',
                        category: product.category,
                        stock: product.stock.toString(),
                        alertThreshold: product.alertThreshold.toString(),
                        barcode: product.barcode || '',
                        description: product.description || '',
                        useCustomThresholds: !product.useDefaultThresholds,
                        customThresholdOrange: product.customThresholdOrange?.toString() || '',
                        customThresholdRed: product.customThresholdRed?.toString() || '',
                      })
                    }}
                  >
                    ✏️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
