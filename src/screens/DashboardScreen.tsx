import { useSales } from '../hooks/useSales'
import { useClients } from '../hooks/useClients'
import { useInventory } from '../hooks/useInventory'
import { calculateStockValue } from '../services/inventoryService'
import '../styles/DashboardScreen.css'

export function DashboardScreen() {
  const { sales } = useSales()
  const { getClientsWithDebt } = useClients()
  const { products, getProductsInStatus } = useInventory()

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayEnd = new Date(today.getTime() + 24 * 60 * 60 * 1000)

  const todaySales = sales.filter(
    s => new Date(s.date).getTime() >= today.getTime() && new Date(s.date).getTime() < todayEnd.getTime(),
  )

  const totalSalesAmount = todaySales.reduce((sum, s) => sum + s.total, 0)
  const totalCashEncashed = todaySales
    .filter(s => s.paymentMethod === 'cash')
    .reduce((sum, s) => sum + s.paidAmount, 0)

  const totalWaveEncashed = todaySales
    .filter(s => s.paymentMethod === 'wave')
    .reduce((sum, s) => sum + s.paidAmount, 0)

  const totalCardEncashed = todaySales
    .filter(s => s.paymentMethod === 'card')
    .reduce((sum, s) => sum + s.paidAmount, 0)

  const totalCreditSold = todaySales
    .filter(s => s.paymentMethod === 'credit')
    .reduce((sum, s) => sum + s.total, 0)

  const totalCreditRemaining = todaySales
    .filter(s => s.paymentMethod === 'credit')
    .reduce((sum, s) => sum + s.remainingAmount, 0)

  const totalOutstandingDebts = getClientsWithDebt().reduce((sum, c) => sum + c.totalDebt, 0)

  const totalEncashed = totalCashEncashed + totalWaveEncashed + totalCardEncashed

  // Stock alerts
  const stockValue = calculateStockValue(products)
  const lowStockCount = getProductsInStatus(products, 'LOW').length
  const criticalStockCount = getProductsInStatus(products, 'CRITICAL').length
  const outOfStockCount = getProductsInStatus(products, 'OUTOFSTOCK').length
  const alertCount = lowStockCount + criticalStockCount + outOfStockCount

  return (
    <div className="dashboard-screen">
      <div className="dashboard-header">
        <h2>Tableau de bord</h2>
        <div className="date-display">
          {today.toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          })}
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card main-card">
          <div className="card-label">CHIFFRE D'AFFAIRES DU JOUR</div>
          <div className="card-amount">
            {totalSalesAmount.toLocaleString('fr-FR')} FCFA
          </div>
          <div className="card-subtitle">
            {todaySales.length} vente{todaySales.length > 1 ? 's' : ''}
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-label">MONTANT ENCAISSÉ</div>
          <div className="card-amount">{totalEncashed.toLocaleString('fr-FR')} FCFA</div>
          <div className="card-subtitle">Liquidités réelles</div>
        </div>

        <div className="dashboard-card">
          <div className="card-label">CRÉANCES CLIENTS</div>
          <div className="card-amount">{totalOutstandingDebts.toLocaleString('fr-FR')} FCFA</div>
          <div className="card-subtitle">À recouvrer</div>
        </div>
      </div>

      <div className="breakdown-grid">
        <div className="breakdown-section">
          <h3>VENTES DU JOUR</h3>
          <div className="breakdown-cards">
            <div className="breakdown-card cash">
              <div className="breakdown-icon">💵</div>
              <div className="breakdown-label">ESPÈCES</div>
              <div className="breakdown-amount">
                {totalCashEncashed.toLocaleString('fr-FR')} FCFA
              </div>
              <div className="breakdown-count">
                {todaySales.filter(s => s.paymentMethod === 'cash').length} transaction
                {todaySales.filter(s => s.paymentMethod === 'cash').length > 1 ? 's' : ''}
              </div>
            </div>

            <div className="breakdown-card wave">
              <div className="breakdown-icon">📱</div>
              <div className="breakdown-label">WAVE</div>
              <div className="breakdown-amount">
                {totalWaveEncashed.toLocaleString('fr-FR')} FCFA
              </div>
              <div className="breakdown-count">
                {todaySales.filter(s => s.paymentMethod === 'wave').length} transaction
                {todaySales.filter(s => s.paymentMethod === 'wave').length > 1 ? 's' : ''}
              </div>
            </div>

            <div className="breakdown-card card">
              <div className="breakdown-icon">💳</div>
              <div className="breakdown-label">CARTE</div>
              <div className="breakdown-amount">
                {totalCardEncashed.toLocaleString('fr-FR')} FCFA
              </div>
              <div className="breakdown-count">
                {todaySales.filter(s => s.paymentMethod === 'card').length} transaction
                {todaySales.filter(s => s.paymentMethod === 'card').length > 1 ? 's' : ''}
              </div>
            </div>

            <div className="breakdown-card credit">
              <div className="breakdown-icon">📒</div>
              <div className="breakdown-label">CRÉDIT</div>
              <div className="breakdown-amount">
                {totalCreditSold.toLocaleString('fr-FR')} FCFA
              </div>
              <div className="breakdown-count">
                {todaySales.filter(s => s.paymentMethod === 'credit').length} transaction
                {todaySales.filter(s => s.paymentMethod === 'credit').length > 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </div>

        <div className="breakdown-section">
          <h3>ANALYSE DES CRÉDITS</h3>
          <div className="credit-analysis">
            <div className="analysis-item">
              <span className="label">Montant vendu à crédit :</span>
              <span className="amount">{totalCreditSold.toLocaleString('fr-FR')} FCFA</span>
            </div>
            <div className="analysis-item">
              <span className="label">Montant payé immédiatement :</span>
              <span className="amount">
                {(totalCreditSold - totalCreditRemaining).toLocaleString('fr-FR')} FCFA
              </span>
            </div>
            <div className="analysis-item">
              <span className="label">Montant restant dû :</span>
              <span className="amount">{totalCreditRemaining.toLocaleString('fr-FR')} FCFA</span>
            </div>
          </div>
        </div>
      </div>

      <div className="stock-section">
        <div className="stock-cards">
          <div className="stock-card value">
            <div className="stock-icon">📦</div>
            <div className="stock-label">VALEUR DES STOCKS</div>
            <div className="stock-amount">{stockValue.saleValue.toLocaleString('fr-FR')} FCFA</div>
            <div className="stock-subtitle">Prix de vente ({stockValue.totalUnits} unités)</div>
          </div>

          {alertCount > 0 && (
            <div className={`stock-card alerts ${alertCount > 0 ? 'with-alerts' : ''}`}>
              <div className="stock-icon">⚠️</div>
              <div className="stock-label">ALERTES STOCKS</div>
              <div className="alert-items">
                {lowStockCount > 0 && <div className="alert-item low">🟠 {lowStockCount} faible</div>}
                {criticalStockCount > 0 && <div className="alert-item critical">🔴 {criticalStockCount} critique</div>}
                {outOfStockCount > 0 && <div className="alert-item out">⛔ {outOfStockCount} rupture</div>}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="summary-section">
        <h3>RÉSUMÉ FINANCIER</h3>
        <div className="summary-table">
          <div className="summary-row">
            <span className="label">Total des ventes (valeur commerciale) :</span>
            <span className="amount">{totalSalesAmount.toLocaleString('fr-FR')} FCFA</span>
          </div>
          <div className="summary-row">
            <span className="label">Montant effectivement encaissé :</span>
            <span className="amount highlight">
              {totalEncashed.toLocaleString('fr-FR')} FCFA
            </span>
          </div>
          <div className="summary-row">
            <span className="label">Créances en cours :</span>
            <span className="amount">{totalOutstandingDebts.toLocaleString('fr-FR')} FCFA</span>
          </div>
        </div>
      </div>
    </div>
  )
}
