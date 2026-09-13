import { useState } from 'react'
import type { PaymentProvider2 } from '../types'
import { useAuthContext } from '../context/AuthContext'
import { logAction } from '../services/auditService'
import { validateSenegalPhoneNumber, displayPhoneNumber } from '../services/qrService'
import '../styles/PayoutScreen.css'

export function PayoutScreen() {
  const { session } = useAuthContext()
  const [provider, setProvider] = useState<PaymentProvider2 | null>(null)
  const [amount, setAmount] = useState(0)
  const [recipientName, setRecipientName] = useState('')
  const [recipientPhone, setRecipientPhone] = useState('')
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = () => {
    setError('')
    setSuccess('')

    if (!provider) {
      setError('Sélectionnez un moyen de paiement')
      return
    }

    if (!amount || amount <= 0) {
      setError('Montant invalide')
      return
    }

    if (!recipientName.trim()) {
      setError('Entrez le nom du destinataire')
      return
    }

    if (!validateSenegalPhoneNumber(recipientPhone)) {
      setError('Numéro de téléphone invalide')
      return
    }

    if (!reason.trim()) {
      setError('Entrez un motif')
      return
    }

    // Log payout action
    logAction(session?.userId || '', session?.username || '', session?.role || 'ADMIN', 'PAYMENT_CANCELLED', {
      reference: `PAYOUT-${Date.now()}`,
      amount,
      details: {
        type: 'PAYOUT',
        provider,
        recipient: recipientName,
        phone: displayPhoneNumber(recipientPhone),
        reason,
      },
    })

    setSuccess(
      `✅ Transfert de ${amount.toLocaleString('fr-FR')} FCFA vers ${recipientName} enregistré. En attente de confirmation.`
    )

    setProvider(null)
    setAmount(0)
    setRecipientName('')
    setRecipientPhone('')
    setReason('')

    setTimeout(() => setSuccess(''), 3000)
  }

  return (
    <div className="payout-screen">
      <div className="payout-header">
        <h1>💸 Retraits / Transferts</h1>
        <p>Transférez de l'argent de votre compte marchand</p>
      </div>

      <div className="payout-form-container">
        <div className="payout-form">
          <h2>Nouveau transfert</h2>

          <div className="form-group">
            <label>Moyen de paiement</label>
            <div className="provider-selector">
              <button
                className={`provider-btn ${provider === 'wave' ? 'active' : ''}`}
                onClick={() => setProvider('wave')}
              >
                💙 WAVE
              </button>
              <button
                className={`provider-btn ${provider === 'orange_money' ? 'active' : ''}`}
                onClick={() => setProvider('orange_money')}
              >
                🟠 ORANGE MONEY
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Montant à transférer (FCFA)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Math.max(0, parseInt(e.target.value) || 0))}
              placeholder="Montant"
              min={0}
              step={100}
              className="input-field"
            />
          </div>

          <div className="form-group">
            <label>Nom du destinataire</label>
            <input
              type="text"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="Ex: Moussa Diop"
              className="input-field"
            />
          </div>

          <div className="form-group">
            <label>Téléphone du destinataire</label>
            <input
              type="tel"
              value={recipientPhone}
              onChange={(e) => setRecipientPhone(e.target.value)}
              placeholder="+221 77 XXX XX XX"
              className="input-field"
            />
          </div>

          <div className="form-group">
            <label>Motif du transfert</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Retrait hebdomadaire, investissement..."
              rows={3}
              className="input-field"
            />
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <div className="form-actions">
            <button className="btn-primary" onClick={handleSubmit}>
              ✓ VALIDER LE TRANSFERT
            </button>
          </div>

          <div className="info-box">
            <strong>⚠️ Important:</strong>
            <ul>
              <li>Seul l'administrateur peut effectuer des transferts</li>
              <li>Chaque transfert est enregistré dans l'audit</li>
              <li>Les transferts sont en attente de confirmation par le prestataire</li>
            </ul>
          </div>
        </div>

        <div className="payout-info-panel">
          <h3>À savoir</h3>

          <div className="info-section">
            <h4>Limites</h4>
            <p>
              Les montants minimaux et maximaux dépendent de votre compte et du prestataire.
            </p>
          </div>

          <div className="info-section">
            <h4>Délais</h4>
            <p>
              Les transferts sont généralement confirmés dans les 30 minutes à 2 heures
              selon le prestataire.
            </p>
          </div>

          <div className="info-section">
            <h4>Frais</h4>
            <p>
              Vérifiez les frais de transfert auprès de votre prestataire (Wave, Orange Money).
            </p>
          </div>

          <div className="info-section">
            <h4>Sécurité</h4>
            <p>
              Tous les transferts sont enregistrés dans le journal d'audit pour la traçabilité
              complète.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
