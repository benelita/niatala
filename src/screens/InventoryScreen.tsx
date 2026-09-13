import { useState } from 'react'
import { useInventory } from '../hooks/useInventory'
import { useAuthContext } from '../context/AuthContext'
import { getStockStatusLabel } from '../services/inventoryService'
import '../styles/InventoryScreen.css'

export function InventoryScreen() {
  const { products, getStockStatusForProduct, getThresholdsForProduct, calculateStockValue, getProductsInStatus, adjustStock } = useInventory()
  const { session } = useAuthContext()
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'NORMAL' | 'LOW' | 'CRITICAL' | 'OUTOFSTOCK'>('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [adjustmentQuantity, setAdjustmentQuantity] = useState('')
  const [adjustmentMotif, setAdjustmentMotif] = useState('')

  if (!session || session.role !== 'ADMIN') {
    return (
      <div className="inventory-screen">
        <div className="access-denied">
          <p>⛔ Accès réservé aux administrateurs</p>
        </div>
      </div>
    )
  }

  const stockValue = calculateStockValue(products)
  const summary = {
    normal: getProductsInStatus(products, 'NORMAL').length,
    low: getProductsInStatus(products, 'LOW').length,
    critical: getProductsInStatus(products, 'CRITICAL').length,
    outOfStock: getProductsInStatus(products, 'OUTOFSTOCK').length,
  }

  let filteredProducts = products

  if (filterStatus !== 'ALL') {
    filteredProducts = filteredProducts.filter(p => getStockStatusForProduct(p) === filterStatus)
  }

  if (searchTerm) {
    filteredProducts = filteredProducts.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  const handleAdjustStock = () => {
    if (!selectedProductId || !adjustmentQuantity || !adjustmentMotif.trim()) {
      alert('Remplissez tous les champs')
      return
    }

    const newQuantity = parseInt(adjustmentQuantity)
    if (isNaN(newQuantity) || newQuantity < 0) {
      alert('Quantité invalide')
      return
    }

    const success = adjustStock(selectedProductId, newQuantity, adjustmentMotif)
    if (success) {
      setSelectedProductId(null)
      setAdjustmentQuantity('')
      setAdjustmentMotif('')
    } else {
      alert('Erreur lors de l\'ajustement')
    }
  }

  const formatPrice = (price: number) => {
    return price.toLocaleString('fr-FR')
  }

  return (
    <div className="inventory-screen">
      <div className="inventory-header">
        <h2>📦 Gestion des stocks</h2>
      </div>

      <div className="stock-summary">
        <div className="summary-card">
          <div className="summary-value">{stockValue.totalUnits}</div>
          <div className="summary-label">Unités totales</div>
        </div>
        <div className="summary-card">
          <div className="summary-value">{formatPrice(stockValue.costValue)} FCFA</div>
          <div className="summary-label">Valeur au prix d'achat</div>
        </div>
        <div className="summary-card">
          <div className="summary-value">{formatPrice(stockValue.saleValue)} FCFA</div>
          <div className="summary-label">Valeur au prix de vente</div>
        </div>
        <div className="summary-card">
          <div className="summary-value">{formatPrice(stockValue.saleValue - stockValue.costValue)} FCFA</div>
          <div className="summary-label">Marge théorique</div>
        </div>
      </div>

      <div className="alerts-section">
        <h3>⚠️ Alertes stocks</h3>
        <div className="alert-cards">
          <div className={`alert-card ${summary.low > 0 ? 'warning' : ''}`}>
            <div className="alert-count">🟠 {summary.low}</div>
            <div className="alert-label">Stock faible</div>
          </div>
          <div className={`alert-card ${summary.critical > 0 ? 'critical' : ''}`}>
            <div className="alert-count">🔴 {summary.critical}</div>
            <div className="alert-label">Stock critique</div>
          </div>
          <div className={`alert-card ${summary.outOfStock > 0 ? 'danger' : ''}`}>
            <div className="alert-count">⛔ {summary.outOfStock}</div>
            <div className="alert-label">Rupture</div>
          </div>
        </div>
      </div>

      <div className="filters-section">
        <div className="filter-group">
          <label>Filtrer par statut:</label>
          <div className="filter-buttons">
            <button
              className={`filter-btn ${filterStatus === 'ALL' ? 'active' : ''}`}
              onClick={() => setFilterStatus('ALL')}
            >
              Tous ({products.length})
            </button>
            <button
              className={`filter-btn ${filterStatus === 'NORMAL' ? 'active' : ''}`}
              onClick={() => setFilterStatus('NORMAL')}
            >
              🟢 Normal ({summary.normal})
            </button>
            <button
              className={`filter-btn ${filterStatus === 'LOW' ? 'active' : ''}`}
              onClick={() => setFilterStatus('LOW')}
            >
              🟠 Faible ({summary.low})
            </button>
            <button
              className={`filter-btn ${filterStatus === 'CRITICAL' ? 'active' : ''}`}
              onClick={() => setFilterStatus('CRITICAL')}
            >
              🔴 Critique ({summary.critical})
            </button>
            <button
              className={`filter-btn ${filterStatus === 'OUTOFSTOCK' ? 'active' : ''}`}
              onClick={() => setFilterStatus('OUTOFSTOCK')}
            >
              ⛔ Rupture ({summary.outOfStock})
            </button>
          </div>
        </div>

        <div className="search-group">
          <input
            type="text"
            placeholder="Rechercher un produit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="products-table-section">
        <table className="products-table">
          <thead>
            <tr>
              <th>Produit</th>
              <th>Catégorie</th>
              <th>Prix d'achat</th>
              <th>Prix de vente</th>
              <th>Stock</th>
              <th>Seuil O</th>
              <th>Seuil R</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => {
              const thresholds = getThresholdsForProduct(product)
              const status = getStockStatusForProduct(product)
              return (
                <tr key={product.id}>
                  <td className="product-name">{product.name}</td>
                  <td>{product.category}</td>
                  <td className="price">{product.costPrice ? formatPrice(product.costPrice) : '-'} FCFA</td>
                  <td className="price">{formatPrice(product.price)} FCFA</td>
                  <td className="stock">{product.stock}</td>
                  <td className="threshold">{thresholds.thresholdOrange}</td>
                  <td className="threshold">{thresholds.thresholdRed}</td>
                  <td>{getStockStatusLabel(status)}</td>
                  <td>
                    <button
                      className="btn-adjust"
                      onClick={() => setSelectedProductId(product.id)}
                    >
                      ✏️
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {selectedProductId && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Ajuster le stock</h3>
            <div className="modal-content">
              <p className="product-info">
                {products.find(p => p.id === selectedProductId)?.name}
              </p>
              <p className="current-stock">
                Stock actuel: {products.find(p => p.id === selectedProductId)?.stock}
              </p>

              <div className="form-group">
                <label>Nouveau stock *</label>
                <input
                  type="number"
                  value={adjustmentQuantity}
                  onChange={(e) => setAdjustmentQuantity(e.target.value)}
                  placeholder="0"
                  min="0"
                />
              </div>

              <div className="form-group">
                <label>Motif *</label>
                <textarea
                  value={adjustmentMotif}
                  onChange={(e) => setAdjustmentMotif(e.target.value)}
                  placeholder="Ex: Inventaire physique, retour fournisseur, etc."
                  rows={3}
                />
              </div>

              <div className="modal-actions">
                <button className="btn-primary" onClick={handleAdjustStock}>
                  Enregistrer
                </button>
                <button className="btn-secondary" onClick={() => setSelectedProductId(null)}>
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
