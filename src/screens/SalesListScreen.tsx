import { useState } from 'react'
import type { Sale } from '../types'
import { useSales } from '../hooks/useSales'
import { useAuthContext } from '../context/AuthContext'
import { logAction } from '../services/auditService'
import { CancelSaleModal } from '../components/CancelSaleModal'
import '../styles/SalesListScreen.css'

export function SalesListScreen() {
  const { sales, cancelSale } = useSales()
  const { session } = useAuthContext()
  const [selectedSaleForCancel, setSelectedSaleForCancel] = useState<Sale | null>(null)
  const [showCancelModal, setShowCancelModal] = useState(false)

  const activeSales = sales.filter(s => s.status !== 'CANCELLED').reverse()

  const handleCancelClick = (sale: Sale) => {
    setSelectedSaleForCancel(sale)
    setShowCancelModal(true)
  }

  const handleConfirmCancel = (reason: string) => {
    if (selectedSaleForCancel && session) {
      const cancelled = cancelSale(selectedSaleForCancel.id, reason)
      if (cancelled) {
        logAction(session.userId, session.username, session.role, 'CANCEL_SALE', {
          reference: selectedSaleForCancel.saleNumber,
          amount: selectedSaleForCancel.total,
          motif: reason,
        })
      }
      setShowCancelModal(false)
      setSelectedSaleForCancel(null)
    }
  }

  return (
    <div className="sales-list-screen">
      <h1>📋 Historique des ventes</h1>

      <div className="sales-container">
        {activeSales.length === 0 ? (
          <p className="empty-message">Aucune vente enregistrée</p>
        ) : (
          <table className="sales-table">
            <thead>
              <tr>
                <th>Numéro</th>
                <th>Date</th>
                <th>Montant</th>
                <th>Paiement</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {activeSales.map(sale => (
                <tr key={sale.id}>
                  <td className="sale-number">{sale.saleNumber}</td>
                  <td className="sale-date">
                    {new Date(sale.date).toLocaleString('fr-FR')}
                  </td>
                  <td className="sale-amount">
                    {sale.total.toLocaleString('fr-FR')} FCFA
                  </td>
                  <td className="payment-method">
                    {sale.paymentMethod === 'cash'
                      ? '💵'
                      : sale.paymentMethod === 'wave'
                        ? '📱'
                        : sale.paymentMethod === 'card'
                          ? '💳'
                          : '📒'}
                  </td>
                  <td className="status">
                    <span className={`status-badge ${sale.status.toLowerCase()}`}>
                      {sale.status === 'PAID'
                        ? '✓ Payée'
                        : sale.status === 'CREDIT'
                          ? '📒 Crédit'
                          : sale.status === 'PARTIAL_CREDIT'
                            ? '⚠ Crédit partiel'
                            : 'Réglée'}
                    </span>
                  </td>
                  <td className="actions">
                    {(session?.role === 'CASHIER' || session?.role === 'ADMIN') && (
                      <button
                        className="btn-cancel-sale"
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
        )}
      </div>

      <CancelSaleModal
        sale={selectedSaleForCancel}
        isOpen={showCancelModal}
        onClose={() => {
          setShowCancelModal(false)
          setSelectedSaleForCancel(null)
        }}
        onConfirm={handleConfirmCancel}
      />
    </div>
  )
}
