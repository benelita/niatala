import { useState } from 'react'
import type { PaymentAccount } from '../types'
import { displayPhoneNumber } from '../services/qrService'
import '../styles/PaymentModal.css'

interface WavePersonalPaymentModalProps {
  isOpen: boolean
  amount: number
  account: PaymentAccount | null
  onClose: () => void
  onConfirmPayment: () => void
  onShowQR: () => void
}

export function WavePersonalPaymentModal({
  isOpen,
  amount,
  account,
  onClose,
  onConfirmPayment,
  onShowQR,
}: WavePersonalPaymentModalProps) {
  const [copied, setCopied] = useState(false)

  if (!isOpen || !account) return null

  const handleCopyNumber = () => {
    if (account.phone) {
      navigator.clipboard.writeText(account.phone)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="payment-modal-overlay" onClick={onClose}>
      <div className="payment-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header wave-header">
          <h3>💙 WAVE Personnel</h3>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div className="amount-box">
            <div className="label">Montant à recevoir</div>
            <div className="amount">{amount.toLocaleString('fr-FR')} FCFA</div>
          </div>

          <div className="merchant-info">
            <div className="info-label">Numéro de réception</div>
            <div className="merchant-number">{displayPhoneNumber(account.phone || '')}</div>
            <p className="info-text">
              Demandez au client de payer ce montant sur ce numéro Wave.
            </p>
          </div>

          <div className="action-buttons">
            <button className="btn-secondary" onClick={onShowQR}>
              📱 AFFICHER QR
            </button>
            <button
              className={`btn-secondary ${copied ? 'copied' : ''}`}
              onClick={handleCopyNumber}
            >
              {copied ? '✓ COPIÉ' : '📋 COPIER LE NUMÉRO'}
            </button>
          </div>

          <div className="payment-status-section">
            <div className="status-info">
              <strong>⏳ Paiement en cours</strong>
              <p>
                Une fois que le client a payé sur ce numéro, confirmez le paiement pour terminer la
                transaction.
              </p>
            </div>

            <button className="btn-primary" onClick={onConfirmPayment}>
              ✓ PAIEMENT EFFECTUÉ
            </button>

            <div className="important-note">
              ⚠️ <strong>Important:</strong> Confirmez uniquement après avoir reçu le paiement.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
