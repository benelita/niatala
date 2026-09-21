import React, { useState, useEffect } from 'react'
import { useClients } from '../hooks/useClients'
import { useSales } from '../hooks/useSales'
import '../styles/CreditsScreen.css'

interface PaymentData {
  clientId: string
  amount: number
}

export function CreditsScreen() {
  const { clients, addDebtOperation, getClientsWithDebt } = useClients()
  const { sales } = useSales()
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentData, setPaymentData] = useState<PaymentData>({ clientId: '', amount: 0 })
  const [showClientDetails, setShowClientDetails] = useState<string | null>(null)
  const [inlinePayments, setInlinePayments] = useState<{ [clientId: string]: number }>({})
  const [refreshKey, setRefreshKey] = useState(0)
  const [clientsWithDebtState, setClientsWithDebtState] = useState<any[]>([])

  useEffect(() => {
    setClientsWithDebtState(getClientsWithDebt())
  }, [refreshKey, clients])

  const handleInlinePayment = (clientId: string) => {
    const amount = inlinePayments[clientId] || 0
    if (amount <= 0) {
      alert('Veuillez entrer un montant')
      return
    }

    const client = clients.find(c => c.id === clientId)
    if (!client || amount > client.totalDebt) {
      alert('Montant invalide')
      return
    }

    const newBalance = client.totalDebt - amount
    addDebtOperation(clientId, {
      date: Date.now(),
      type: 'PAYMENT',
      amount,
      balance: newBalance,
    })

    setInlinePayments({ ...inlinePayments, [clientId]: 0 })
    setRefreshKey(refreshKey + 1) // Force refresh
    alert(`✅ Paiement de ${amount.toLocaleString('fr-FR')} FCFA enregistré`)
  }

  const totalDebts = clientsWithDebtState.reduce((sum, c) => sum + c.totalDebt, 0)


  const getLastCreditSale = (clientId: string) => {
    const clientCreditSales = sales.filter(
      s => s.clientId === clientId && (s.status === 'PARTIAL_CREDIT' || s.status === 'CREDIT')
    )
    if (clientCreditSales.length === 0) return null
    return clientCreditSales.reduce((latest, sale) =>
      sale.date > latest.date ? sale : latest, clientCreditSales[0]
    )
  }

  const formatTime = (timestamp: number | null | undefined): string => {
    if (!timestamp) return '—'
    return new Date(timestamp).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!paymentData.clientId || paymentData.amount <= 0) {
      alert('Veuillez sélectionner un client et un montant')
      return
    }

    const client = clients.find(c => c.id === paymentData.clientId)
    if (!client || client.totalDebt <= 0) {
      alert('Client invalide ou sans dette')
      return
    }

    if (paymentData.amount > client.totalDebt) {
      alert(`Le montant ne peut pas dépasser la dette de ${client.totalDebt.toLocaleString('fr-FR')} FCFA`)
      return
    }

    const newBalance = client.totalDebt - paymentData.amount

    addDebtOperation(paymentData.clientId, {
      date: Date.now(),
      type: 'PAYMENT',
      amount: paymentData.amount,
      balance: newBalance,
    })

    alert(
      `Paiement de ${paymentData.amount.toLocaleString('fr-FR')} FCFA enregistré.\n` +
      `Nouvelle dette: ${newBalance.toLocaleString('fr-FR')} FCFA`,
    )

    setPaymentData({ clientId: '', amount: 0 })
    setShowPaymentModal(false)
    setSelectedClientId(null)
    setRefreshKey(refreshKey + 1) // Force refresh
  }

  const openPaymentModal = (clientId: string) => {
    const client = clients.find(c => c.id === clientId)
    if (!client) return

    setPaymentData({ clientId, amount: 0 })
    setSelectedClientId(clientId)
    setShowPaymentModal(true)
  }

  const formatDate = (timestamp: number | null): string => {
    if (!timestamp) return '—'
    return new Date(timestamp).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const selectedClient = selectedClientId
    ? clients.find(c => c.id === selectedClientId)
    : null

  return (
    <div className="credits-screen">
      <div className="credits-header">
        <h2>Carnet de crédits</h2>
      </div>

      <div className="credits-summary">
        <div className="summary-card">
          <div className="summary-label">CRÉANCES TOTALES</div>
          <div className="summary-amount">{totalDebts.toLocaleString('fr-FR')} FCFA</div>
        </div>

        <div className="summary-card">
          <div className="summary-label">CLIENTS DÉBITEURS</div>
          <div className="summary-amount">{clientsWithDebtState.length}</div>
        </div>

        <div className="summary-card">
          <div className="summary-label">CLIENTS RÉGLÉS</div>
          <div className="summary-amount">
            {clients.length - clientsWithDebtState.length}
          </div>
        </div>
      </div>

      {clientsWithDebtState.length === 0 ? (
        <div className="empty-state">
          <p>Aucun client avec une dette</p>
        </div>
      ) : (
        <div className="debts-table-container">
          <table className="debts-table">
            <thead>
              <tr>
                <th>N° vente</th>
                <th>Client</th>
                <th>Téléphone</th>
                <th>Total vente</th>
                <th>Heure</th>
                <th>Dette actuelle</th>
                <th>Paiement</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {clientsWithDebtState.map((client: any) => {
                const lastCreditSale = getLastCreditSale(client.id)
                return (
                  <tr key={client.id} onClick={() => setShowClientDetails(client.id)} style={{ cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'} onMouseLeave={(e) => e.currentTarget.style.background = ''} >
                    <td className="sale-number">{lastCreditSale?.saleNumber || '—'}</td>
                    <td className="client-name">{client.name}</td>
                    <td>{client.phone}</td>
                    <td className="amount">{lastCreditSale?.total.toLocaleString('fr-FR') || '—'} {lastCreditSale ? 'FCFA' : ''}</td>
                    <td>{formatTime(lastCreditSale?.date)}</td>
                    <td className="debt-amount">
                      {client.totalDebt.toLocaleString('fr-FR')} FCFA
                    </td>
                    <td style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                      <input
                        type="number"
                        value={inlinePayments[client.id] || ''}
                        onChange={(e) => setInlinePayments({ ...inlinePayments, [client.id]: parseInt(e.target.value) || 0 })}
                        placeholder="Montant"
                        max={client.totalDebt}
                        style={{
                          width: '80px',
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.85rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '0.25rem',
                        }}
                      />
                      <button
                        onClick={() => handleInlinePayment(client.id)}
                        style={{
                          padding: '0.25rem 0.5rem',
                          background: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.25rem',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                        }}
                      >
                        ✓
                      </button>
                    </td>
                    <td>
                      <span className="status-badge in-progress">🔴 EN COURS</span>
                    </td>
                    <td>
                      <button
                        className="payment-btn"
                        onClick={() => setShowClientDetails(client.id)}
                        title="Voir les détails"
                      >
                        👁️
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {showClientDetails && (() => {
        const detailClient = clients.find(c => c.id === showClientDetails)
        if (!detailClient) return null

        const clientCredits = sales.filter(
          s => s.clientId === showClientDetails && (s.status === 'PARTIAL_CREDIT' || s.status === 'CREDIT')
        ).sort((a, b) => b.date - a.date)

        const clientPayments = (detailClient as any).operations?.filter((op: any) => op.type === 'PAYMENT') || []

        return (
          <div className="modal-overlay" onClick={() => setShowClientDetails(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px', maxHeight: '80vh', overflow: 'auto' }}>
              <div className="modal-header">
                <h3>📋 Détails crédit - {detailClient.name}</h3>
                <button className="modal-close" onClick={() => setShowClientDetails(null)}>✕</button>
              </div>

              <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ background: '#f3f4f6', padding: '1rem', borderRadius: '0.5rem' }}>
                  <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>Téléphone</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: '600' }}>{detailClient.phone || '—'}</div>
                </div>
                <div style={{ background: '#fef2f2', padding: '1rem', borderRadius: '0.5rem' }}>
                  <div style={{ fontSize: '0.85rem', color: '#dc2626' }}>Dette actuelle</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: '600' }}>{detailClient.totalDebt.toLocaleString('fr-FR')} FCFA</div>
                </div>
              </div>

              <h4 style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>📊 Historique des crédits ({clientCredits.length})</h4>
              {clientCredits.length === 0 ? (
                <p style={{ color: '#9ca3af' }}>Aucun crédit enregistré</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ background: '#f3f4f6' }}>
                      <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #d1d5db' }}>Date</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #d1d5db' }}>N° vente</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '1px solid #d1d5db' }}>Montant</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '1px solid #d1d5db' }}>Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientCredits.map(sale => (
                      <tr key={sale.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '0.75rem' }}>{formatDate(sale.date)}</td>
                        <td style={{ padding: '0.75rem' }}>{sale.saleNumber}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600' }}>{sale.total.toLocaleString('fr-FR')} FCFA</td>
                        <td style={{ padding: '0.75rem', textAlign: 'right' }}>{sale.status === 'CREDIT' ? '100% crédit' : 'Partiel'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              <h4 style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>💰 Paiements effectués ({clientPayments.length})</h4>
              {clientPayments.length === 0 ? (
                <p style={{ color: '#9ca3af' }}>Aucun paiement enregistré</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ background: '#f3f4f6' }}>
                      <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #d1d5db' }}>Date</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '1px solid #d1d5db' }}>Montant</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '1px solid #d1d5db' }}>Reste</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientPayments.map((payment: any, idx: number) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '0.75rem' }}>{formatDate(payment.date)}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#10b981' }}>-{payment.amount.toLocaleString('fr-FR')} FCFA</td>
                        <td style={{ padding: '0.75rem', textAlign: 'right' }}>{payment.balance.toLocaleString('fr-FR')} FCFA</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              <button
                onClick={() => {
                  setShowClientDetails(null)
                  openPaymentModal(detailClient.id)
                }}
                style={{
                  marginTop: '1.5rem',
                  width: '100%',
                  padding: '0.75rem',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600',
                }}
              >
                💰 Enregistrer un paiement
              </button>
            </div>
          </div>
        )
      })()}

      {showPaymentModal && selectedClient && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>💰 Enregistrer un paiement</h3>
              <button
                className="modal-close"
                onClick={() => setShowPaymentModal(false)}
              >
                ✕
              </button>
            </div>

            <form className="payment-form" onSubmit={handlePaymentSubmit}>
              <div className="form-section">
                <label className="form-label">Client :</label>
                <div className="form-value">{selectedClient.name}</div>
              </div>

              <div className="form-section">
                <label className="form-label">Dette actuelle :</label>
                <div className="form-value debt-value">
                  {selectedClient.totalDebt.toLocaleString('fr-FR')} FCFA
                </div>
              </div>

              <div className="form-section">
                <label className="form-label">Montant du paiement :</label>
                <input
                  type="number"
                  value={paymentData.amount}
                  onChange={(e) =>
                    setPaymentData({
                      ...paymentData,
                      amount: Math.max(0, parseInt(e.target.value) || 0),
                    })
                  }
                  placeholder="0"
                  className="amount-input"
                  min="0"
                  max={selectedClient.totalDebt}
                />
              </div>

              <div className="quick-buttons">
                <button
                  type="button"
                  className="quick-btn"
                  onClick={() =>
                    setPaymentData({
                      ...paymentData,
                      amount: 5000,
                    })
                  }
                >
                  5 000
                </button>
                <button
                  type="button"
                  className="quick-btn"
                  onClick={() =>
                    setPaymentData({
                      ...paymentData,
                      amount: 10000,
                    })
                  }
                >
                  10 000
                </button>
                <button
                  type="button"
                  className="quick-btn"
                  onClick={() =>
                    setPaymentData({
                      ...paymentData,
                      amount: 25000,
                    })
                  }
                >
                  25 000
                </button>
                <button
                  type="button"
                  className="quick-btn total"
                  onClick={() =>
                    setPaymentData({
                      ...paymentData,
                      amount: selectedClient.totalDebt,
                    })
                  }
                >
                  TOTAL
                </button>
              </div>

              <div className="payment-preview">
                <div className="preview-row">
                  <span>Montant à payer :</span>
                  <strong>{paymentData.amount.toLocaleString('fr-FR')} FCFA</strong>
                </div>
                <div className="preview-row">
                  <span>Nouvelle dette :</span>
                  <strong>
                    {(selectedClient.totalDebt - paymentData.amount).toLocaleString('fr-FR')}{' '}
                    FCFA
                  </strong>
                </div>
              </div>

              <button type="submit" className="btn-primary-large">
                Valider le paiement
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
