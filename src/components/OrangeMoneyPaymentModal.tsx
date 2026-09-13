import { useState } from 'react'
import type { PaymentAccount } from '../types'
import { validateSenegalPhoneNumber, formatPhoneNumber, displayPhoneNumber } from '../services/qrService'
import '../styles/PaymentModal.css'

interface OrangeMoneyPaymentModalProps {
  isOpen: boolean
  amount: number
  account: PaymentAccount | null
  mode: 'PERSONAL' | 'BUSINESS'
  onClose: () => void
  onConfirmPayment?: () => void
  onRequestPayment?: (phoneNumber: string) => void
  onShowQR?: () => void
}

export function OrangeMoneyPaymentModal({
  isOpen,
  amount,
  account,
  mode,
  onClose,
  onConfirmPayment,
  onRequestPayment,
  onShowQR,
}: OrangeMoneyPaymentModalProps) {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  if (!isOpen || !account) return null

  const handleCopyNumber = () => {
    if (account.phone) {
      navigator.clipboard.writeText(account.phone)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleRequest = () => {
    setError('')

    if (!phoneNumber.trim()) {
      setError('Veuillez entrer un numéro de téléphone')
      return
    }

    if (!validateSenegalPhoneNumber(phoneNumber)) {
      setError('Format invalide. Utilisez: 77 XXX XX XX')
      return
    }

    onRequestPayment?.(formatPhoneNumber(phoneNumber))
    setPhoneNumber('')
  }

  if (mode === 'PERSONAL') {
    return (
      <div className="payment-modal-overlay" onClick={onClose}>
        <div className="payment-modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header orange-header">
            <h3>🟠 ORANGE MONEY Personnel</h3>
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
                Demandez au client de payer ce montant sur ce numéro Orange Money.
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
                {copied ? '✓ COPIÉ' : '📋 COPIER'}
              </button>
            </div>

            <div className="payment-status-section">
              <div className="status-info">
                <strong>⏳ Paiement en cours</strong>
                <p>
                  Une fois que le client a payé sur ce numéro, confirmez le paiement pour terminer
                  la transaction.
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

  // BUSINESS MODE
  return (
    <div className="payment-modal-overlay" onClick={onClose}>
      <div className="payment-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header orange-header">
          <h3>🟠 ORANGE MONEY Business</h3>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div className="amount-box">
            <div className="label">Montant à demander</div>
            <div className="amount">{amount.toLocaleString('fr-FR')} FCFA</div>
          </div>

          <div className="business-form">
            <label>Téléphone du client</label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => {
                setPhoneNumber(e.target.value)
                setError('')
              }}
              placeholder="+221 77 XXX XX XX"
              className="phone-input"
            />

            {error && <div className="error-message">{error}</div>}
          </div>

          <div className="action-buttons">
            <button className="btn-primary" onClick={handleRequest}>
              💳 DEMANDER LE PAIEMENT
            </button>
            <button className="btn-secondary" onClick={onShowQR}>
              📱 SCANNER QR
            </button>
          </div>

          <div className="pending-state">
            <div className="spinner"></div>
            <strong>🟡 PAIEMENT EN ATTENTE</strong>
            <p>
              Le client doit confirmer le paiement sur son téléphone. Une notification Orange Money
              lui sera envoyée.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
