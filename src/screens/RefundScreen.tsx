import { useState } from 'react'
import { useSales } from '../hooks/useSales'
import { useAuthContext } from '../context/AuthContext'
import { logAction } from '../services/auditService'
import '../styles/RefundScreen.css'

export function RefundScreen() {
  const { sales } = useSales()
  const { session } = useAuthContext()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSale, setSelectedSale] = useState<any | null>(null)
  const [refundAmount, setRefundAmount] = useState(0)
  const [refundReason, setRefundReason] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const filteredSales = sales.filter(
    s =>
      s.status === 'PAID' &&
      (s.saleNumber.includes(searchTerm) || (s.clientId && s.clientId.includes(searchTerm)))
  )

  const handleSelectSale = (sale: any) => {
    setSelectedSale(sale)
    setRefundAmount(sale.total)
    setError('')
  }

  const handleRefund = () => {
    setError('')
    setSuccess('')

    if (!selectedSale) {
      setError('Sélectionnez une vente')
      return
    }

    if (!refundAmount || refundAmount <= 0 || refundAmount > selectedSale.total) {
      setError(`Montant invalide (max: ${selectedSale.total} FCFA)`)
      return
    }

    if (!refundReason.trim()) {
      setError('Veuillez entrer un motif de remboursement')
      return
    }

    // Log the refund action
    logAction(session?.userId || '', session?.username || '', session?.role || 'ADMIN', 'REFUND_SALE', {
      reference: selectedSale.saleNumber,
      amount: refundAmount,
      motif: refundReason,
    })

    setSuccess(
      `✅ Remboursement de ${refundAmount.toLocaleString('fr-FR')} FCFA enregistré pour la vente ${selectedSale.saleNumber}`
    )

    setSelectedSale(null)
    setRefundAmount(0)
    setRefundReason('')

    setTimeout(() => setSuccess(''), 3000)
  }

  return (
    <div className="refund-screen">
      <div className="refund-header">
        <h1>🔄 Remboursements</h1>
        <p>Effectuez des remboursements partiels ou totaux</p>
      </div>

      {!selectedSale ? (
        <div className="refund-search">
          <h2>Sélectionner une vente</h2>

          <input
            type="text"
            placeholder="Rechercher par numéro de vente ou client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />

          <div className="sales-list">
            {filteredSales.length === 0 ? (
              <p className="empty-message">Aucune vente payée trouvée</p>
            ) : (
              filteredSales.map(sale => (
                <button
                  key={sale.id}
                  className="sale-card"
                  onClick={() => handleSelectSale(sale)}
                >
                  <div className="sale-info">
                    <div className="sale-number">{sale.saleNumber}</div>
                    <div className="sale-amount">{sale.total.toLocaleString('fr-FR')} FCFA</div>
                    <div className="sale-date">{new Date(sale.date).toLocaleDateString('fr-FR')}</div>
                  </div>
                  <div className="sale-action">→</div>
                </button>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="refund-form">
          <button className="btn-back" onClick={() => setSelectedSale(null)}>
            ← RETOUR
          </button>

          <div className="sale-selected-info">
            <div className="info-item">
              <span className="label">Vente:</span>
              <span className="value">{selectedSale.saleNumber}</span>
            </div>
            <div className="info-item">
              <span className="label">Montant total:</span>
              <span className="value">{selectedSale.total.toLocaleString('fr-FR')} FCFA</span>
            </div>
            <div className="info-item">
              <span className="label">Date:</span>
              <span className="value">{new Date(selectedSale.date).toLocaleString('fr-FR')}</span>
            </div>
          </div>

          <div className="form-group">
            <label>Montant à rembourser</label>
            <input
              type="number"
              value={refundAmount}
              onChange={(e) => setRefundAmount(Math.max(0, parseInt(e.target.value) || 0))}
              max={selectedSale.total}
              min={0}
              className="amount-input"
            />
            <div className="amount-hint">
              {refundAmount === selectedSale.total ? '✓ Remboursement total' : `Remboursement partiel (${selectedSale.total - refundAmount} FCFA restent)`}
            </div>
          </div>

          <div className="form-group">
            <label>Motif du remboursement</label>
            <textarea
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              placeholder="Ex: Produit défectueux, demande du client, erreur de caisse..."
              className="reason-textarea"
              rows={3}
            />
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <button className="btn-primary" onClick={handleRefund}>
            ✓ CONFIRMER LE REMBOURSEMENT
          </button>
        </div>
      )}
    </div>
  )
}
