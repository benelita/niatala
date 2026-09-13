import { useState } from 'react'
import { getAllFreeAmounts, identifyFreeAmount } from '../services/freeAmountService'
import { useAuthContext } from '../context/AuthContext'
import type { FreeAmount } from '../types'
import '../styles/FreeAmountsScreen.css'

export function FreeAmountsScreen() {
  const { session } = useAuthContext()
  const [tab, setTab] = useState<'pending' | 'history'>('pending')
  const [allAmounts, setAllAmounts] = useState<FreeAmount[]>(getAllFreeAmounts())
  const pendingAmounts = allAmounts.filter(a => a.status === 'PENDING')
  const identifiedAmounts = allAmounts.filter(a => a.status === 'IDENTIFIED')
  const [selectedAmount, setSelectedAmount] = useState<FreeAmount | null>(null)
  const [formData, setFormData] = useState({
    objectName: '',
    type: 'INTERNAL' as 'INTERNAL' | 'EXTERNAL',
    vendorName: '',
  })

  const handleIdentify = (amount: FreeAmount) => {
    setSelectedAmount(amount)
    setFormData({
      objectName: '',
      type: 'INTERNAL',
      vendorName: '',
    })
  }

  const handleSave = () => {
    if (!selectedAmount) return
    if (!formData.objectName.trim()) {
      alert('Le nom de l\'objet est obligatoire')
      return
    }

    identifyFreeAmount(
      selectedAmount.id,
      formData.type,
      formData.objectName,
      formData.type === 'EXTERNAL' ? formData.vendorName || undefined : undefined,
      session?.userId,
    )

    setAllAmounts(getAllFreeAmounts())
    setSelectedAmount(null)
  }

  return (
    <div className="free-amounts-screen">
      <div className="free-amounts-header">
        <h2>📋 Sommes libres</h2>
        <div className="tabs">
          <button
            className={`tab ${tab === 'pending' ? 'active' : ''}`}
            onClick={() => setTab('pending')}
          >
            ⏳ En attente ({pendingAmounts.length})
          </button>
          <button
            className={`tab ${tab === 'history' ? 'active' : ''}`}
            onClick={() => setTab('history')}
          >
            ✓ Historique ({identifiedAmounts.length})
          </button>
        </div>
      </div>

      {tab === 'pending' ? (
        // Onglet En attente
        <>
          {pendingAmounts.length === 0 ? (
            <div className="empty-state">
              <p>Aucune somme libre en attente d'identification</p>
            </div>
          ) : (
            <div className="amounts-list">
              {pendingAmounts.map((amount) => (
                <div key={amount.id} className="amount-card">
                  <div className="amount-info">
                    <div className="amount-value">
                      {amount.amount.toLocaleString('fr-FR')} FCFA
                    </div>
                    <div className="amount-meta">
                      <span>Vente #{amount.saleId.slice(0, 8)}</span>
                      <span>{new Date(amount.date).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                  <button
                    className="btn-identify"
                    onClick={() => handleIdentify(amount)}
                  >
                    ✏️ Identifier
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        // Onglet Historique
        <>
          {identifiedAmounts.length === 0 ? (
            <div className="empty-state">
              <p>Aucune somme libre identifiée</p>
            </div>
          ) : (
            <div className="amounts-history">
              {identifiedAmounts.map((amount) => (
                <div key={amount.id} className="history-card">
                  <div className="history-header">
                    <div className="history-amount">
                      {amount.amount.toLocaleString('fr-FR')} FCFA
                    </div>
                    <div className={`type-badge ${amount.type?.toLowerCase() || ''}`}>
                      {amount.type === 'INTERNAL' ? '🏪 Interne' : '👤 Dépôt-vente'}
                    </div>
                  </div>
                  <div className="history-content">
                    <div className="history-row">
                      <span className="label">Objet:</span>
                      <span className="value">{amount.objectName}</span>
                    </div>
                    {amount.vendorName && (
                      <div className="history-row">
                        <span className="label">Vendeur:</span>
                        <span className="value">{amount.vendorName}</span>
                      </div>
                    )}
                    <div className="history-row">
                      <span className="label">Vente:</span>
                      <span className="value">#{amount.saleId.slice(0, 8)}</span>
                    </div>
                    <div className="history-row">
                      <span className="label">Identifié:</span>
                      <span className="value">
                        {amount.identifiedAt ? new Date(amount.identifiedAt).toLocaleDateString('fr-FR') : '-'}
                      </span>
                    </div>
                    {amount.identifiedBy && (
                      <div className="history-row">
                        <span className="label">Par:</span>
                        <span className="value">{amount.identifiedBy}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {selectedAmount && (
        <div className="modal-overlay" onClick={() => setSelectedAmount(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Identifier {selectedAmount.amount.toLocaleString('fr-FR')} FCFA</h3>
              <button className="modal-close" onClick={() => setSelectedAmount(null)}>
                ✕
              </button>
            </div>

            <div className="form-group">
              <label>Nom de l'objet vendu *</label>
              <input
                type="text"
                value={formData.objectName}
                onChange={(e) => setFormData({ ...formData, objectName: e.target.value })}
                placeholder="Ex: Vélo, Téléphone, etc."
                autoFocus
              />
            </div>

            <div className="form-group">
              <label>Type</label>
              <div className="type-options">
                <button
                  className={`type-btn ${formData.type === 'INTERNAL' ? 'active' : ''}`}
                  onClick={() => setFormData({ ...formData, type: 'INTERNAL' })}
                >
                  <span className="icon">🏪</span>
                  <span className="label">Interne (Magasin)</span>
                </button>
                <button
                  className={`type-btn ${formData.type === 'EXTERNAL' ? 'active' : ''}`}
                  onClick={() => setFormData({ ...formData, type: 'EXTERNAL' })}
                >
                  <span className="icon">👤</span>
                  <span className="label">Externe (Dépôt-vente)</span>
                </button>
              </div>
            </div>

            {formData.type === 'EXTERNAL' && (
              <div className="form-group">
                <label>Nom du vendeur (optionnel)</label>
                <input
                  type="text"
                  value={formData.vendorName}
                  onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
                  placeholder="Nom du vendeur..."
                />
              </div>
            )}

            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setSelectedAmount(null)}>
                Annuler
              </button>
              <button className="btn-save" onClick={handleSave}>
                ✓ Identifier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
