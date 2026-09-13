import { useState } from 'react'
import { displayPhoneNumber } from '../services/qrService'
import '../styles/QRCodeModal.css'

interface QRCodeModalProps {
  isOpen: boolean
  mode: 'DISPLAY' | 'SCAN'
  provider: 'wave' | 'orange_money'
  amount?: number
  phoneNumber?: string
  onClose: () => void
}

export function QRCodeModal({
  isOpen,
  mode,
  provider,
  amount,
  phoneNumber,
  onClose,
}: QRCodeModalProps) {
  const [cameraActive, setCameraActive] = useState(false)

  if (!isOpen) return null

  const providerIcon = provider === 'wave' ? '💙' : '🟠'
  const providerName = provider === 'wave' ? 'WAVE' : 'ORANGE MONEY'

  if (mode === 'DISPLAY') {
    return (
      <div className="qr-modal-overlay" onClick={onClose}>
        <div className="qr-modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="qr-header">
            <h3>{providerIcon} {providerName} QR</h3>
            <button className="qr-close" onClick={onClose}>
              ✕
            </button>
          </div>

          <div className="qr-body">
            <div className="qr-display-box">
              <div className="qr-placeholder">📱</div>
              <p className="qr-hint">QR CODE ({displayPhoneNumber(phoneNumber || '')})</p>
            </div>

            {amount && (
              <div className="qr-info">
                <div className="info-row">
                  <span className="label">Montant:</span>
                  <span className="value">{amount.toLocaleString('fr-FR')} FCFA</span>
                </div>
                <div className="info-row">
                  <span className="label">Numéro:</span>
                  <span className="value">{displayPhoneNumber(phoneNumber || '')}</span>
                </div>
              </div>
            )}

            <div className="qr-instruction">
              <strong>Comment utiliser le QR :</strong>
              <ol>
                <li>Le client ouvre son application {providerName}</li>
                <li>Il sélectionne "Scanner QR"</li>
                <li>Il scanne ce QR code</li>
                <li>Il confirme le paiement</li>
              </ol>
            </div>

            <button className="btn-primary" onClick={onClose}>
              ← RETOUR
            </button>
          </div>
        </div>
      </div>
    )
  }

  // SCAN MODE
  return (
    <div className="qr-modal-overlay" onClick={onClose}>
      <div className="qr-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="qr-header">
          <h3>{providerIcon} Scanner QR {providerName}</h3>
          <button className="qr-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="qr-body">
          {!cameraActive ? (
            <>
              <div className="camera-placeholder">
                <div className="camera-icon">📷</div>
                <p>Utilisez la caméra pour scanner un QR code</p>
              </div>

              <button className="btn-primary" onClick={() => setCameraActive(true)}>
                📷 OUVRIR LA CAMÉRA
              </button>
            </>
          ) : (
            <>
              <div className="camera-active">
                <div className="camera-frame">
                  <p>📷 Caméra en cours d'utilisation...</p>
                  <p className="camera-hint">
                    (En production: utiliser un lecteur de QR réel avec caméra)
                  </p>
                </div>
              </div>

              <div className="button-group">
                <button className="btn-secondary" onClick={() => setCameraActive(false)}>
                  ❌ ARRÊTER
                </button>
              </div>
            </>
          )}

          <div className="qr-instruction">
            <strong>⚠️ Important:</strong>
            <p>
              Après avoir scanné un QR code, vérifiez les informations (montant, bénéficiaire) avant
              de confirmer.
            </p>
          </div>

          <button className="btn-secondary" onClick={onClose} style={{ marginTop: '1rem' }}>
            ← RETOUR
          </button>
        </div>
      </div>
    </div>
  )
}
