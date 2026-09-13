import type { Payment } from '../types'
import '../styles/PaymentStatusModal.css'

interface PaymentStatusModalProps {
  isOpen: boolean
  payment: Payment | null
  onClose: () => void
  onConfirmSuccess: () => void
  onRetry: () => void
}

export function PaymentStatusModal({ isOpen, payment, onClose, onConfirmSuccess, onRetry }: PaymentStatusModalProps) {

  if (!isOpen || !payment) return null

  const methodLabel = payment.method === 'wave' ? 'WAVE' : payment.method === 'orange_money' ? 'ORANGE MONEY' : 'Paiement'

  return (
    <div className="status-modal-overlay" onClick={onClose}>
      <div className="status-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className={`modal-icon ${payment.status.toLowerCase()}`}>
          {payment.status === 'PENDING' && '⏳'}
          {payment.status === 'SUCCESS' && '✅'}
          {payment.status === 'FAILED' && '❌'}
          {payment.status === 'CANCELLED' && '⛔'}
        </div>

        <h3 className={`status-title ${payment.status.toLowerCase()}`}>
          {payment.status === 'PENDING' && 'Paiement en attente'}
          {payment.status === 'SUCCESS' && 'Paiement confirmé'}
          {payment.status === 'FAILED' && 'Paiement échoué'}
          {payment.status === 'CANCELLED' && 'Paiement annulé'}
        </h3>

        <div className="payment-details">
          <div className="detail-row">
            <span className="label">Méthode :</span>
            <span className="value">{methodLabel}</span>
          </div>
          <div className="detail-row">
            <span className="label">Montant :</span>
            <span className="value amount">{payment.amount.toLocaleString('fr-FR')} FCFA</span>
          </div>
          {payment.phoneNumber && (
            <div className="detail-row">
              <span className="label">Téléphone :</span>
              <span className="value">{payment.phoneNumber}</span>
            </div>
          )}
          {payment.reference && (
            <div className="detail-row">
              <span className="label">Référence :</span>
              <span className="value reference">{payment.reference}</span>
            </div>
          )}
        </div>

        {payment.status === 'PENDING' && (
          <div className="waiting-box">
            <div className="spinner"></div>
            <p>En attente de confirmation du client...</p>
            <p className="hint">Le client doit confirmer le paiement sur son téléphone</p>
          </div>
        )}

        {payment.status === 'FAILED' && (
          <div className="error-box">
            <p>Le paiement n'a pas pu être effectué.</p>
            <p className="hint">Vérifiez le numéro de téléphone et réessayez.</p>
          </div>
        )}

        <div className="button-group">
          {payment.status === 'PENDING' && (
            <>
              <button className="btn-secondary" onClick={onRetry}>
                🔄 RECHARGER
              </button>
              <button className="btn-danger" onClick={onClose}>
                ❌ ANNULER
              </button>
            </>
          )}

          {payment.status === 'SUCCESS' && (
            <button className="btn-primary" onClick={onConfirmSuccess}>
              ✅ PAIEMENT CONFIRMÉ
            </button>
          )}

          {payment.status === 'FAILED' && (
            <>
              <button className="btn-primary" onClick={onRetry}>
                🔄 RÉESSAYER
              </button>
              <button className="btn-danger" onClick={onClose}>
                ❌ ANNULER
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
