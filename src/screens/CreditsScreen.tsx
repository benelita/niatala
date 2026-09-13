import React, { useState } from 'react'
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

  const clientsWithDebt = getClientsWithDebt()
  const totalDebts = clientsWithDebt.reduce((sum, c) => sum + c.totalDebt, 0)

  const getLastSaleDate = (clientId: string): number | null => {
    const clientSales = sales.filter(s => s.clientId === clientId)
    if (clientSales.length === 0) return null
    return clientSales.reduce((latest, sale) => (sale.date > latest ? sale.date : latest), 0)
  }

  const getLastCreditSale = (clientId: string) => {
    const clientCreditSales = sales.filter(
      s => s.clientId === clientId && (s.status === 'PARTIAL_CREDIT' || s.status === 'CREDIT')
    )
    if (clientCreditSales.length === 0) return null
    return clientCreditSales.reduce((latest, sale) =>
      sale.date > latest.date ? sale : latest, clientCreditSales[0]
    )
  }

  const formatTime = (timestamp: number | null): string => {
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
          <div className="summary-amount">{clientsWithDebt.length}</div>
        </div>

        <div className="summary-card">
          <div className="summary-label">CLIENTS RÉGLÉS</div>
          <div className="summary-amount">
            {clients.length - clientsWithDebt.length}
          </div>
        </div>
      </div>

      {clientsWithDebt.length === 0 ? (
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
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {clientsWithDebt.map(client => {
                const lastCreditSale = getLastCreditSale(client.id)
                return (
                  <tr key={client.id}>
                    <td className="sale-number">{lastCreditSale?.saleNumber || '—'}</td>
                    <td className="client-name">{client.name}</td>
                    <td>{client.phone}</td>
                    <td className="amount">{lastCreditSale?.total.toLocaleString('fr-FR') || '—'} {lastCreditSale ? 'FCFA' : ''}</td>
                    <td>{formatTime(lastCreditSale?.date)}</td>
                    <td className="debt-amount">
                      {client.totalDebt.toLocaleString('fr-FR')} FCFA
                    </td>
                    <td>
                      <span className="status-badge in-progress">🔴 EN COURS</span>
                    </td>
                    <td>
                      <button
                        className="payment-btn"
                        onClick={() => openPaymentModal(client.id)}
                        title="Enregistrer un paiement"
                      >
                        💰
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

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
