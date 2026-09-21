import { useState, useEffect } from 'react'
import { getVendors, getStats, recordSale, recordPayment, getVendor } from '../services/externalVendorService'
import '../styles/ExternalVendorsScreen.css'

interface Vendor {
  id: string
  name: string
  phone: string
  totalSales: number
  totalPaid: number
  balance: number
  status: string
}

interface Stats {
  vendorCount: number
  totalSales: number
  totalPaid: number
  totalBalance: number
}

export function ExternalVendorsScreen() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null)
  const [showSaleForm, setShowSaleForm] = useState(false)
  const [showPaymentForm, setShowPaymentForm] = useState(false)

  // Sale form
  const [saleVendorName, setSaleVendorName] = useState('')
  const [saleVendorPhone, setSaleVendorPhone] = useState('')
  const [saleAmount, setSaleAmount] = useState('')
  const [saleDescription, setSaleDescription] = useState('')

  // Payment form
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [paymentReference, setPaymentReference] = useState('')
  const [paymentNotes, setPaymentNotes] = useState('')

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    const [vendorsData, statsData] = await Promise.all([getVendors(), getStats()])
    setVendors(vendorsData || [])
    setStats(statsData)
    setLoading(false)
  }

  const handleRecordSale = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!saleVendorName.trim() || !saleVendorPhone.trim() || !saleAmount) {
      setError('Veuillez remplir tous les champs obligatoires')
      return
    }

    const amount = parseFloat(saleAmount)
    if (isNaN(amount) || amount <= 0) {
      setError('Le montant doit être positif')
      return
    }

    const result = await recordSale(saleVendorName, saleVendorPhone, amount, saleDescription || undefined)

    if (result) {
      setSuccess('✅ Vente enregistrée avec succès')
      setSaleVendorName('')
      setSaleVendorPhone('')
      setSaleAmount('')
      setSaleDescription('')
      setShowSaleForm(false)
      await loadData()
    } else {
      setError('❌ Erreur lors de l\'enregistrement de la vente')
    }
  }

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!selectedVendor || !paymentAmount) {
      setError('Veuillez remplir tous les champs obligatoires')
      return
    }

    const amount = parseFloat(paymentAmount)
    if (isNaN(amount) || amount <= 0) {
      setError('Le montant doit être positif')
      return
    }

    if (amount > selectedVendor.balance) {
      setError(`Le montant dépasse le solde dû (${selectedVendor.balance} FCFA)`)
      return
    }

    const result = await recordPayment(
      selectedVendor.id,
      amount,
      paymentMethod,
      paymentReference || undefined,
      paymentNotes || undefined
    )

    if (result) {
      setSuccess('✅ Paiement enregistré avec succès')
      setPaymentAmount('')
      setPaymentReference('')
      setPaymentNotes('')
      setShowPaymentForm(false)
      await loadData()
      const updated = await getVendor(selectedVendor.id)
      if (updated) setSelectedVendor(updated)
    } else {
      setError('❌ Erreur lors de l\'enregistrement du paiement')
    }
  }

  const formatPrice = (price: number) => {
    return price.toLocaleString('fr-FR')
  }

  if (loading) {
    return <div className="external-vendors-screen">Chargement...</div>
  }

  return (
    <div className="external-vendors-screen">
      <div className="vendors-header">
        <h2>📦 Vendeurs externes</h2>
        <button className="btn-primary" onClick={() => setShowSaleForm(!showSaleForm)}>
          {showSaleForm ? '✕ Fermer' : '+ Enregistrer une vente'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {/* Statistics */}
      {stats && (
        <div className="stats-container">
          <div className="stat-card">
            <div className="stat-value">{stats.vendorCount}</div>
            <div className="stat-label">Vendeurs</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{formatPrice(stats.totalSales)} FCFA</div>
            <div className="stat-label">Total ventes</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{formatPrice(stats.totalPaid)} FCFA</div>
            <div className="stat-label">Total payé</div>
          </div>
          <div className="stat-card highlight">
            <div className="stat-value">{formatPrice(stats.totalBalance)} FCFA</div>
            <div className="stat-label">Solde dû</div>
          </div>
        </div>
      )}

      {/* Sale Form */}
      {showSaleForm && (
        <form className="sale-form" onSubmit={handleRecordSale}>
          <h3>Enregistrer une vente de vendeur externe</h3>

          <div className="form-row">
            <div className="form-group">
              <label>Nom du vendeur *</label>
              <input
                type="text"
                value={saleVendorName}
                onChange={(e) => setSaleVendorName(e.target.value)}
                placeholder="Ex: Moussa Diallo"
                required
              />
            </div>
            <div className="form-group">
              <label>Téléphone *</label>
              <input
                type="tel"
                value={saleVendorPhone}
                onChange={(e) => setSaleVendorPhone(e.target.value)}
                placeholder="Ex: +223 75 00 00 00"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Montant (FCFA) *</label>
              <input
                type="number"
                value={saleAmount}
                onChange={(e) => setSaleAmount(e.target.value)}
                placeholder="0"
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={saleDescription}
              onChange={(e) => setSaleDescription(e.target.value)}
              placeholder="(optionnel)"
              rows={2}
            />
          </div>

          <button type="submit" className="btn-primary">
            💾 Enregistrer la vente
          </button>
        </form>
      )}

      {/* Vendors List */}
      <div className="vendors-list">
        <h3>📋 Vendeurs et leurs ventes</h3>

        {vendors.length === 0 ? (
          <p className="no-data">Aucun vendeur externe pour le moment</p>
        ) : (
          <div className="vendors-grid">
            {vendors.map((vendor) => (
              <div key={vendor.id} className="vendor-card">
                <div className="vendor-header">
                  <div>
                    <h4>{vendor.name}</h4>
                    <p className="vendor-phone">📱 {vendor.phone}</p>
                  </div>
                </div>

                <div className="vendor-stats">
                  <div className="stat-item">
                    <span className="label">Ventes:</span>
                    <span className="value">{formatPrice(vendor.totalSales)} FCFA</span>
                  </div>
                  <div className="stat-item">
                    <span className="label">Payé:</span>
                    <span className="value">{formatPrice(vendor.totalPaid)} FCFA</span>
                  </div>
                  <div className={`stat-item ${vendor.balance > 0 ? 'due' : 'settled'}`}>
                    <span className="label">Solde:</span>
                    <span className="value">{formatPrice(vendor.balance)} FCFA</span>
                  </div>
                </div>

                {selectedVendor?.id === vendor.id && showPaymentForm ? (
                  <div className="payment-form-inline">
                    <form onSubmit={handleRecordPayment}>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Montant</label>
                          <input
                            type="number"
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                            placeholder="0"
                            min="0"
                            max={vendor.balance}
                            step="0.01"
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>Moyen de paiement</label>
                          <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                            <option value="cash">💵 Espèces</option>
                            <option value="wave">🌊 Wave</option>
                            <option value="orange_money">🟠 Orange Money</option>
                            <option value="free">🟣 Free Money</option>
                          </select>
                        </div>
                      </div>

                      {paymentMethod !== 'cash' && (
                        <div className="form-group">
                          <label>Référence de paiement</label>
                          <input
                            type="text"
                            value={paymentReference}
                            onChange={(e) => setPaymentReference(e.target.value)}
                            placeholder="Numéro de transaction"
                          />
                        </div>
                      )}

                      <div className="form-group">
                        <label>Notes</label>
                        <input
                          type="text"
                          value={paymentNotes}
                          onChange={(e) => setPaymentNotes(e.target.value)}
                          placeholder="(optionnel)"
                        />
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button type="submit" className="btn-small" style={{ background: '#059669', color: 'white' }}>
                          ✓ Payer
                        </button>
                        <button
                          type="button"
                          className="btn-small"
                          onClick={() => {
                            setShowPaymentForm(false)
                            setPaymentAmount('')
                            setPaymentReference('')
                            setPaymentNotes('')
                          }}
                          style={{ background: 'var(--border)', color: 'var(--text)' }}
                        >
                          ✕ Annuler
                        </button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <button
                    className="btn-pay"
                    onClick={() => {
                      setSelectedVendor(vendor)
                      setShowPaymentForm(true)
                    }}
                    disabled={vendor.balance <= 0}
                  >
                    💳 Payer ({formatPrice(vendor.balance)} FCFA)
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
