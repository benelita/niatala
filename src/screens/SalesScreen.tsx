import { useState } from 'react'
import type { Sale, PaymentMethod } from '../types'
import { useSales } from '../hooks/useSales'
import { useClients } from '../hooks/useClients'
import { useAuthContext } from '../context/AuthContext'
import { logAction } from '../services/auditService'
import { CancelSaleModal } from '../components/CancelSaleModal'
import '../styles/SalesScreen.css'

interface DetailedSale extends Sale {
  clientName?: string
}

export function SalesScreen() {
  const { sales, cancelSale } = useSales()
  const { getClientById } = useClients()
  const { session } = useAuthContext()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | 'all'>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [timePeriod, setTimePeriod] = useState<'day' | 'week' | 'month'>('month')
  const [selectedSale, setSelectedSale] = useState<DetailedSale | null>(null)
  const [saleForCancel, setSaleForCancel] = useState<Sale | null>(null)
  const [showCancelModal, setShowCancelModal] = useState(false)

  const getTimePeriodRange = () => {
    const now = new Date()
    const start = new Date()

    if (timePeriod === 'day') {
      start.setHours(0, 0, 0, 0)
    } else if (timePeriod === 'week') {
      start.setDate(now.getDate() - now.getDay())
      start.setHours(0, 0, 0, 0)
    } else {
      start.setDate(1)
      start.setHours(0, 0, 0, 0)
    }

    return { start: start.getTime(), end: now.getTime() }
  }

  const filteredSales = sales
    .filter(sale => {
      const range = getTimePeriodRange()
      if (sale.date < range.start || sale.date > range.end) return false

      if (selectedPayment !== 'all' && sale.paymentMethod !== selectedPayment) {
        return false
      }

      if (selectedStatus !== 'all' && sale.status !== selectedStatus) {
        return false
      }

      const searchLower = searchTerm.toLowerCase()
      const matchesSearch =
        sale.saleNumber.toLowerCase().includes(searchLower) ||
        (sale.clientId && getClientById(sale.clientId)?.name.toLowerCase().includes(searchLower))

      return matchesSearch
    })
    .map(sale => ({
      ...sale,
      clientName: sale.clientId ? getClientById(sale.clientId)?.name : undefined,
    }))

  const enrichedSales: DetailedSale[] = filteredSales

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const formatTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getPaymentLabel = (method: PaymentMethod): string => {
    const labels: Record<PaymentMethod, string> = {
      cash: '💵 ESPÈCES',
      wave: '📱 WAVE',
      orange_money: '🟠 ORANGE MONEY',
      free: '🟪 FREE',
      card: '💳 CARTE',
      credit: '📒 CRÉDIT',
    }
    return labels[method]
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      { label: string; color: string }
    > = {
      PAID: { label: 'PAYÉ', color: '#10b981' },
      CREDIT: { label: 'CRÉDIT', color: '#f59e0b' },
      PARTIAL_CREDIT: { label: 'CRÉDIT PARTIEL', color: '#f59e0b' },
      SETTLED: { label: 'RÉGLÉ', color: '#6366f1' },
      CANCELLED: { label: 'ANNULÉE', color: '#ef4444' },
    }

    const config = statusConfig[status] || { label: status, color: '#6b7280' }

    return (
      <span
        style={{
          backgroundColor: `${config.color}20`,
          color: config.color,
          padding: '0.25rem 0.75rem',
          borderRadius: '0.375rem',
          fontSize: '0.75rem',
          fontWeight: '600',
          whiteSpace: 'nowrap',
        }}
      >
        {config.label}
      </span>
    )
  }

  const handleCancelClick = (sale: Sale) => {
    setSaleForCancel(sale)
    setShowCancelModal(true)
  }

  const handleConfirmCancel = (reason: string) => {
    if (saleForCancel && session) {
      const cancelled = cancelSale(saleForCancel.id, reason)
      if (cancelled) {
        logAction(session.userId, session.username, session.role, 'CANCEL_SALE', {
          reference: saleForCancel.saleNumber,
          amount: saleForCancel.total,
          motif: reason,
        })
      }
      setShowCancelModal(false)
      setSaleForCancel(null)
    }
  }

  return (
    <div className="sales-screen">
      <div className="sales-header">
        <h2>Historique des ventes</h2>
      </div>

      <div className="sales-filters">
        <input
          type="text"
          placeholder="Rechercher..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="sales-search"
        />

        <div className="filter-chips">
          <div className="filter-section">
            <button className={`filter-chip ${timePeriod === 'day' ? 'active' : ''}`} onClick={() => setTimePeriod('day')}>📅 Aujourd'hui</button>
            <button className={`filter-chip ${timePeriod === 'week' ? 'active' : ''}`} onClick={() => setTimePeriod('week')}>📆 Semaine</button>
            <button className={`filter-chip ${timePeriod === 'month' ? 'active' : ''}`} onClick={() => setTimePeriod('month')}>📈 Mois</button>
          </div>

          <div className="filter-section">
            <button className={`filter-chip ${selectedPayment === 'all' ? 'active' : ''}`} onClick={() => setSelectedPayment('all')}>Tous</button>
            <button className={`filter-chip ${selectedPayment === 'cash' ? 'active' : ''}`} onClick={() => setSelectedPayment('cash')}>💵</button>
            <button className={`filter-chip ${selectedPayment === 'wave' ? 'active' : ''}`} onClick={() => setSelectedPayment('wave')}>📱</button>
            <button className={`filter-chip ${selectedPayment === 'card' ? 'active' : ''}`} onClick={() => setSelectedPayment('card')}>💳</button>
            <button className={`filter-chip ${selectedPayment === 'credit' ? 'active' : ''}`} onClick={() => setSelectedPayment('credit')}>📒</button>
          </div>

          <div className="filter-section">
            <button className={`filter-chip ${selectedStatus === 'all' ? 'active' : ''}`} onClick={() => setSelectedStatus('all')}>Tous</button>
            <button className={`filter-chip ${selectedStatus === 'PAID' ? 'active' : ''}`} onClick={() => setSelectedStatus('PAID')}>✓ Payé</button>
            <button className={`filter-chip ${selectedStatus === 'CREDIT' ? 'active' : ''}`} onClick={() => setSelectedStatus('CREDIT')}>📒 Crédit</button>
            <button className={`filter-chip ${selectedStatus === 'PARTIAL_CREDIT' ? 'active' : ''}`} onClick={() => setSelectedStatus('PARTIAL_CREDIT')}>⚠ Partiel</button>
          </div>
        </div>
      </div>

      {enrichedSales.length === 0 ? (
        <div className="empty-state">
          <p>Aucune vente trouvée</p>
        </div>
      ) : (
        <div className="sales-table-container">
          <table className="sales-table">
            <thead>
              <tr>
                <th>N° vente</th>
                <th>Date</th>
                <th>Heure</th>
                <th>Client</th>
                <th>Montant</th>
                <th>Paiement</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {enrichedSales.map(sale => (
                <tr key={sale.id}>
                  <td className="sale-number">{sale.saleNumber}</td>
                  <td>{formatDate(sale.date)}</td>
                  <td>{formatTime(sale.date)}</td>
                  <td className="client-name">{sale.clientName || '—'}</td>
                  <td className="amount">{sale.total.toLocaleString('fr-FR')} FCFA</td>
                  <td>{getPaymentLabel(sale.paymentMethod)}</td>
                  <td>{getStatusBadge(sale.status)}</td>
                  <td>
                    <button
                      className="detail-btn"
                      onClick={() => setSelectedSale(sale)}
                      title="Voir détail"
                    >
                      👁️
                    </button>
                    {sale.status !== 'CANCELLED' && (session?.role === 'CASHIER' || session?.role === 'ADMIN') && (
                      <button
                        className="cancel-btn"
                        onClick={() => handleCancelClick(sale)}
                        title="Annuler cette vente"
                      >
                        ❌
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedSale && (
        <div className="modal-overlay" onClick={() => setSelectedSale(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Détail de la vente {selectedSale.saleNumber}</h3>
              <button
                className="modal-close"
                onClick={() => setSelectedSale(null)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="detail-section">
                <h4>Informations</h4>
                <div className="detail-row">
                  <span>Date :</span>
                  <strong>{formatDate(selectedSale.date)} à {formatTime(selectedSale.date)}</strong>
                </div>
                {selectedSale.clientName && (
                  <>
                    <div className="detail-row">
                      <span>Client :</span>
                      <strong>{selectedSale.clientName}</strong>
                    </div>
                    {getClientById(selectedSale.clientId)?.phone && (
                      <div className="detail-row">
                        <span>Téléphone :</span>
                        <strong>{getClientById(selectedSale.clientId)?.phone}</strong>
                      </div>
                    )}
                  </>
                )}
                <div className="detail-row">
                  <span>Paiement :</span>
                  <strong>{getPaymentLabel(selectedSale.paymentMethod)}</strong>
                </div>
              </div>

              <div className="detail-section">
                <h4>Produits</h4>
                <table className="items-table">
                  <thead>
                    <tr>
                      <th>Produit</th>
                      <th>Prix unit.</th>
                      <th>Qty</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedSale.items.map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.name}</td>
                        <td>{item.price.toLocaleString('fr-FR')} FCFA</td>
                        <td>{item.quantity}</td>
                        <td className="amount">
                          {(item.price * item.quantity).toLocaleString('fr-FR')} FCFA
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="detail-section">
                <div className="detail-row">
                  <span>Total :</span>
                  <strong className="amount">{selectedSale.total.toLocaleString('fr-FR')} FCFA</strong>
                </div>
                {(selectedSale.status === 'PARTIAL_CREDIT' || selectedSale.status === 'CREDIT') && (
                  <>
                    <div className="detail-row">
                      <span>Montant réglé :</span>
                      <strong className="amount">{selectedSale.paidAmount.toLocaleString('fr-FR')} FCFA</strong>
                    </div>
                    <div className="detail-row">
                      <span>Montant à régler :</span>
                      <strong className="amount" style={{ color: 'var(--danger)' }}>{selectedSale.remainingAmount.toLocaleString('fr-FR')} FCFA</strong>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <CancelSaleModal
        sale={saleForCancel}
        isOpen={showCancelModal}
        onClose={() => {
          setShowCancelModal(false)
          setSaleForCancel(null)
        }}
        onConfirm={handleConfirmCancel}
      />
    </div>
  )
}
