import React, { useState } from 'react'
import { useClients } from '../hooks/useClients'
import { useSales } from '../hooks/useSales'
import '../styles/ClientsScreen.css'

interface FormData {
  name: string
  phone: string
  address: string
}

export function ClientsScreen() {
  const { clients, addClient } = useClients()
  const { sales } = useSales()
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState<FormData>({ name: '', phone: '', address: '' })
  const [selectedClient, setSelectedClient] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const filteredClients = clients.filter(
    c =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm),
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.phone.trim()) {
      alert('Veuillez remplir le nom et le téléphone')
      return
    }

    addClient({
      name: formData.name,
      phone: formData.phone,
      address: formData.address || undefined,
    })

    setFormData({ name: '', phone: '', address: '' })
    setShowForm(false)
  }

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const getClientSalesCount = (clientId: string): number => {
    return sales.filter(s => s.clientId === clientId).length
  }

  const selectedClientData = selectedClient ? clients.find(c => c.id === selectedClient) : null

  return (
    <div className="clients-screen">
      <div className="clients-header">
        <h2>Gestion des clients</h2>
        <button
          className="btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? '✕ Fermer' : '➕ Nouveau client'}
        </button>
      </div>

      {showForm && (
        <form className="client-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nom complet *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Amadou Ndiaye"
              required
            />
          </div>

          <div className="form-group">
            <label>Téléphone *</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="Ex: 77123456"
              required
            />
          </div>

          <div className="form-group">
            <label>Adresse</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Ex: Dakar, Marché Sandaga"
            />
          </div>

          <button type="submit" className="btn-primary">
            Créer le client
          </button>
        </form>
      )}

      <div className="clients-search">
        <input
          type="text"
          placeholder="Rechercher par nom ou téléphone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="clients-container">
        <div className="clients-list">
          {filteredClients.length === 0 ? (
            <div className="empty-state">
              <p>Aucun client trouvé</p>
            </div>
          ) : (
            <table className="clients-table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Téléphone</th>
                  <th>Inscription</th>
                  <th>Ventes</th>
                  <th>Dette</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map(client => (
                  <tr
                    key={client.id}
                    className={selectedClient === client.id ? 'selected' : ''}
                  >
                    <td className="client-name">{client.name}</td>
                    <td>{client.phone}</td>
                    <td>{formatDate(client.createdAt)}</td>
                    <td>{getClientSalesCount(client.id)}</td>
                    <td className={client.totalDebt > 0 ? 'has-debt' : ''}>
                      {client.totalDebt.toLocaleString('fr-FR')} FCFA
                    </td>
                    <td>
                      <button
                        className="detail-btn"
                        onClick={() =>
                          setSelectedClient(selectedClient === client.id ? null : client.id)
                        }
                      >
                        {selectedClient === client.id ? '▼' : '▶'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {selectedClientData && (
          <div className="client-detail">
            <div className="detail-header">
              <h3>{selectedClientData.name}</h3>
              <button
                className="close-btn"
                onClick={() => setSelectedClient(null)}
              >
                ✕
              </button>
            </div>

            <div className="detail-info">
              <div className="info-group">
                <span className="label">Téléphone :</span>
                <span className="value">{selectedClientData.phone}</span>
              </div>

              {selectedClientData.address && (
                <div className="info-group">
                  <span className="label">Adresse :</span>
                  <span className="value">{selectedClientData.address}</span>
                </div>
              )}

              <div className="info-group">
                <span className="label">Client depuis :</span>
                <span className="value">{formatDate(selectedClientData.createdAt)}</span>
              </div>

              <div className="info-group">
                <span className="label">Nombre de ventes :</span>
                <span className="value">{getClientSalesCount(selectedClientData.id)}</span>
              </div>

              <div className="debt-summary">
                <div className="debt-amount">
                  <span className="label">Dette actuelle :</span>
                  <span className="amount">
                    {selectedClientData.totalDebt.toLocaleString('fr-FR')} FCFA
                  </span>
                </div>
              </div>
            </div>

            {selectedClientData.operations && selectedClientData.operations.length > 0 && (
              <div className="operations-section">
                <h4>Historique</h4>
                <table className="operations-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Montant</th>
                      <th>Solde</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedClientData.operations
                      .slice()
                      .reverse()
                      .map((op) => (
                        <tr key={op.id}>
                          <td>
                            {new Date(op.date).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            })}
                          </td>
                          <td>
                            {op.type === 'PURCHASE' ? (
                              <span className="badge-purchase">Achat à crédit</span>
                            ) : (
                              <span className="badge-payment">Paiement</span>
                            )}
                          </td>
                          <td className={op.type === 'PURCHASE' ? 'purchase' : 'payment'}>
                            {op.type === 'PURCHASE' ? '+' : '−'}
                            {op.amount.toLocaleString('fr-FR')} FCFA
                          </td>
                          <td className="balance">
                            {op.balance.toLocaleString('fr-FR')} FCFA
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
