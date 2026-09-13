import { useState } from 'react'
import type { PaymentAccount } from '../types'
import { validateSenegalPhoneNumber, formatPhoneNumber } from '../services/qrService'
import '../styles/PaymentModal.css'

interface WaveBusinessPaymentModalProps {
  isOpen: boolean
  amount: number
  account: PaymentAccount | null
  onClose: () => void
  onRequestPayment: (phoneNumber: string) => void
  onShowQR: () => void
}

export function WaveBusinessPaymentModal({
  isOpen,
  amount,
  account,
  onClose,
  onRequestPayment,
  onShowQR,
}: WaveBusinessPaymentModalProps) {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [error, setError] = useState('')

  if (!isOpen || !account) return null

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

    onRequestPayment(formatPhoneNumber(phoneNumber))
    setPhoneNumber('')
  }

  return (
    <div className="payment-modal-overlay" onClick={onClose}>
      <div className="payment-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header wave-header">
          <h3>💙 WAVE Business</h3>
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
              Le client doit confirmer le paiement sur son téléphone. Une notification Wave lui sera
              envoyée.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
