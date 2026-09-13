import { useState } from 'react'
import '../styles/WavePaymentModal.css'

interface WavePaymentModalProps {
  isOpen: boolean
  amount: number
  onClose: () => void
  onRequest: (phoneNumber: string) => void
  onScanQR: () => void
}

export function WavePaymentModal({ isOpen, amount, onClose, onRequest, onScanQR }: WavePaymentModalProps) {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleRequest = () => {
    setError('')

    if (!phoneNumber.trim()) {
      setError('Le numéro de téléphone est obligatoire')
      return
    }

    onRequest(phoneNumber)
    setPhoneNumber('')
  }

  return (
    <div className="payment-modal-overlay" onClick={onClose}>
      <div className="payment-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>📱 WAVE</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="payment-amount">
            <span className="label">Montant :</span>
            <span className="amount">{amount.toLocaleString('fr-FR')} FCFA</span>
          </div>

          <div className="form-group">
            <label>Téléphone client</label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+221 __ __ __ __"
              className="phone-input"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="button-group">
            <button className="btn-primary" onClick={handleRequest}>
              💳 DEMANDER LE PAIEMENT
            </button>
            <button className="btn-secondary" onClick={onScanQR}>
              📷 SCANNER QR
            </button>
          </div>

          <div className="info-text">
            🟡 PAIEMENT EN ATTENTE - Le client doit confirmer sur son téléphone
          </div>
        </div>
      </div>
    </div>
  )
}
