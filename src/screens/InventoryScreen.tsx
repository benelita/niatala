import { useState } from 'react'
import { useInventory } from '../hooks/useInventory'
import { useAuthContext } from '../context/AuthContext'
import { getStockStatusLabel } from '../services/inventoryService'
import { downloadCSV } from '../utils/csvExport'
import '../styles/InventoryScreen.css'

type SortColumn = 'name' | 'category' | 'costPrice' | 'price' | 'stock' | 'status' | null
type SortDirection = 'asc' | 'desc'

export function InventoryScreen() {
  const { products, getStockStatusForProduct, getThresholdsForProduct, calculateStockValue, getProductsInStatus, adjustStock } = useInventory()
  const { session } = useAuthContext()
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'NORMAL' | 'LOW' | 'CRITICAL' | 'OUTOFSTOCK'>('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('ALL')
  const [sortColumn, setSortColumn] = useState<SortColumn>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [adjustmentQuantity, setAdjustmentQuantity] = useState('')
  const [adjustmentMotif, setAdjustmentMotif] = useState('')

  // Get unique categories
  const categories = ['ALL', ...new Set(products.map(p => p.category))].sort()

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const getSortArrow = (column: SortColumn) => {
    if (sortColumn !== column) return '⬇️'
    return sortDirection === 'asc' ? '⬆️' : '⬇️'
  }

  // Check if user has permission to access inventory
  const hasInventoryPermission = (() => {
    if (!session) return false
    if (session.role === 'ADMIN' || session.role === 'SUPER_ADMIN') return true
    // For CASHIER, check temporary access from localStorage
    try {
      const perms = JSON.parse(localStorage.getItem('cashier_inventory_access') || '{}')
      const expiresAt = perms[session.userId]?.expiresAt
      if (expiresAt && expiresAt > Date.now()) return true
    } catch {
      // Ignore
    }
    return false
  })()

  if (!session || !hasInventoryPermission) {
    return (
      <div className="inventory-screen">
        <div className="access-denied">
          <p>⛔ Accès refusé. L'administrateur doit d'abord vous autoriser à gérer l'inventaire.</p>
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

  if (filterCategory !== 'ALL') {
    filteredProducts = filteredProducts.filter(p => p.category === filterCategory)
  }

  if (searchTerm) {
    filteredProducts = filteredProducts.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  // Sort products
  if (sortColumn) {
    filteredProducts = [...filteredProducts].sort((a, b) => {
      let aVal: any = ''
      let bVal: any = ''

      switch (sortColumn) {
        case 'name':
          aVal = a.name
          bVal = b.name
          break
        case 'category':
          aVal = a.category
          bVal = b.category
          break
        case 'costPrice':
          aVal = a.costPrice || 0
          bVal = b.costPrice || 0
          break
        case 'price':
          aVal = a.price || 0
          bVal = b.price || 0
          break
        case 'stock':
          aVal = a.stock || 0
          bVal = b.stock || 0
          break
        case 'status':
          aVal = getStockStatusForProduct(a)
          bVal = getStockStatusForProduct(b)
          break
      }

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase()
        bVal = (bVal as string).toLowerCase()
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      } else {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
      }
    })
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

        <div className="filter-group" style={{ marginTop: '1rem' }}>
          <label>Filtrer par catégorie:</label>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            style={{
              padding: '0.5rem',
              borderRadius: '0.375rem',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text)',
              cursor: 'pointer',
              minWidth: '150px',
            }}
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'ALL' ? '📂 Toutes les catégories' : `📂 ${cat}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', justifyContent: 'flex-end' }}>
        <button
          onClick={() => {
            const data = filteredProducts.map(p => ({
              'Produit': p.name,
              'Catégorie': p.category,
              'Prix d\'achat': p.costPrice ? `${p.costPrice} FCFA` : '-',
              'Prix de vente': `${p.price} FCFA`,
              'Stock': p.stock,
              'Statut': getStockStatusForProduct(p),
            }))
            downloadCSV(data, `Inventaire_${new Date().toLocaleDateString('fr-FR')}`)
          }}
          style={{
            padding: '0.5rem 1rem',
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: '600',
          }}
        >
          📥 Exporter tout ({filteredProducts.length})
        </button>
      </div>

      <div className="products-table-section">
        <table className="products-table">
          <thead>
            <tr>
              <th style={{ cursor: 'pointer', textAlign: 'left', position: 'relative', paddingRight: '1.5rem' }} onClick={() => handleSort('name')}>
                Produit <span style={{ position: 'absolute', right: '0.25rem', bottom: '0.25rem' }}>{getSortArrow('name')}</span>
              </th>
              <th style={{ cursor: 'pointer', textAlign: 'left', position: 'relative', paddingRight: '1.5rem' }} onClick={() => handleSort('category')}>
                Catégorie <span style={{ position: 'absolute', right: '0.25rem', bottom: '0.25rem' }}>{getSortArrow('category')}</span>
              </th>
              <th style={{ cursor: 'pointer', textAlign: 'left', position: 'relative', paddingRight: '1.5rem' }} onClick={() => handleSort('costPrice')}>
                Prix d'achat <span style={{ position: 'absolute', right: '0.25rem', bottom: '0.25rem' }}>{getSortArrow('costPrice')}</span>
              </th>
              <th style={{ cursor: 'pointer', textAlign: 'left', position: 'relative', paddingRight: '1.5rem' }} onClick={() => handleSort('price')}>
                Prix de vente <span style={{ position: 'absolute', right: '0.25rem', bottom: '0.25rem' }}>{getSortArrow('price')}</span>
              </th>
              <th style={{ cursor: 'pointer', textAlign: 'left', position: 'relative', paddingRight: '1.5rem' }} onClick={() => handleSort('stock')}>
                Stock <span style={{ position: 'absolute', right: '0.25rem', bottom: '0.25rem' }}>{getSortArrow('stock')}</span>
              </th>
              <th>Seuil O</th>
              <th>Seuil R</th>
              <th style={{ cursor: 'pointer', textAlign: 'left', position: 'relative', paddingRight: '1.5rem' }} onClick={() => handleSort('status')}>
                Statut <span style={{ position: 'absolute', right: '0.25rem', bottom: '0.25rem' }}>{getSortArrow('status')}</span>
              </th>
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
