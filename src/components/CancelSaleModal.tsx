import { useState } from 'react'
import type { Sale } from '../types'
import '../styles/CancelSaleModal.css'

interface CancelSaleModalProps {
  sale: Sale | null
  isOpen: boolean
  onClose: () => void
  onConfirm: (reason: string) => void
}

const CANCELLATION_REASONS = [
  'Erreur de quantité',
  'Erreur de produit',
  'Erreur de paiement',
  'Demande du client',
  'Produit indisponible',
  'Autre',
]

export function CancelSaleModal({ sale, isOpen, onClose, onConfirm }: CancelSaleModalProps) {
  const [selectedReason, setSelectedReason] = useState('')
  const [customReason, setCustomReason] = useState('')
  const [error, setError] = useState('')

  if (!isOpen || !sale) return null

  const handleConfirm = () => {
    setError('')

    if (!selectedReason) {
      setError('Veuillez sélectionner ou entrer un motif')
      return
    }

    const reason = selectedReason === 'Autre' ? customReason : selectedReason

    if (!reason.trim()) {
      setError('Veuillez préciser le motif')
      return
    }

    onConfirm(reason)
    setSelectedReason('')
    setCustomReason('')
  }

  const handleClose = () => {
    setSelectedReason('')
    setCustomReason('')
    setError('')
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>❌ Annuler la vente</h3>
          <button className="modal-close" onClick={handleClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div className="sale-info">
            <p>
              <strong>Vente:</strong> {sale.saleNumber}
            </p>
            <p>
              <strong>Montant:</strong> {sale.total.toLocaleString('fr-FR')} FCFA
            </p>
            <p>
              <strong>Date:</strong> {new Date(sale.date).toLocaleString('fr-FR')}
            </p>
          </div>

          <div className="form-section">
            <label>Motif de l'annulation</label>

            <div className="reason-buttons">
              {CANCELLATION_REASONS.map(reason => (
                <button
                  key={reason}
                  className={`reason-btn ${selectedReason === reason ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedReason(reason)
                    if (reason !== 'Autre') {
                      setCustomReason('')
                    }
                  }}
                >
                  {reason}
                </button>
              ))}
            </div>

            {selectedReason === 'Autre' && (
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Décrivez le motif..."
                className="custom-reason-input"
              />
            )}
          </div>

          {error && <div className="error-message">{error}</div>}
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={handleClose}>
            ← Annuler
          </button>
          <button className="btn-confirm" onClick={handleConfirm}>
            ✓ Confirmer l'annulation
          </button>
        </div>
      </div>
    </div>
  )
}
