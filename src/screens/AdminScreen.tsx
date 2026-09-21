import { useState, useEffect } from 'react'
import type { AuthSession } from '../types'
import { getUsers, createUser, updateUserStatus } from '../services/authService'
import { getAuditLogs } from '../services/auditService'
import { downloadCSV } from '../utils/csvExport'
import { useSettings } from '../hooks/useSettings'
import { getWaveStatus, connectWaveAccount, disconnectWaveAccount } from '../services/waveService'
import { getOrangeMoneyStatus, connectOrangeMoneyAccount, disconnectOrangeMoneyAccount } from '../services/orangeMoneyService'
import { getFreeStatus, connectFreeAccount, disconnectFreeAccount } from '../services/freeService'
import { getPaymentSettingsForUser, enablePaymentMethod, disablePaymentMethod } from '../services/paymentSettingsService'
import { getDefaultThresholds, setDefaultThresholds, validateThresholds } from '../services/inventoryService'
import '../styles/AdminScreen.css'

interface AdminScreenProps {
  session: AuthSession
}

type AdminTab = 'cashiers' | 'audit' | 'payments' | 'settings' | 'stock' | 'create-admin' | 'admins' | 'export'

export function AdminScreen({ session }: AdminScreenProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>(session.role === 'SUPER_ADMIN' ? 'create-admin' : 'cashiers')
  const [newCashierName, setNewCashierName] = useState('')
  const [newCashierUsername, setNewCashierUsername] = useState('')
  const [newCashierPassword, setNewCashierPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const { enableInventory, toggleInventory } = useSettings()

  // Payment config states
  const [waveMerchantNumber, setWaveMerchantNumber] = useState('')
  const [waveMerchantName, setWaveMerchantName] = useState('')
  const [orangeMerchantNumber, setOrangeMerchantNumber] = useState('')
  const [orangeMerchantName, setOrangeMerchantName] = useState('')
  const [freeMerchantNumber, setFreeMerchantNumber] = useState('')
  const [freeMerchantName, setFreeMerchantName] = useState('')

  // Cashier payment methods management
  const [selectedCashierForPayment, setSelectedCashierForPayment] = useState<string | null>(null)

  // Stock thresholds
  const [stockThresholdOrange, setStockThresholdOrange] = useState<string>(() => {
    const thresholds = getDefaultThresholds()
    return thresholds.thresholdOrange.toString()
  })
  const [stockThresholdRed, setStockThresholdRed] = useState<string>(() => {
    const thresholds = getDefaultThresholds()
    return thresholds.thresholdRed.toString()
  })

  // Create admin states (SUPER_ADMIN only)
  const [newAdminFirstName, setNewAdminFirstName] = useState('')
  const [newAdminLastName, setNewAdminLastName] = useState('')
  const [newAdminWhatsapp, setNewAdminWhatsapp] = useState('')
  const [newAdminUsername, setNewAdminUsername] = useState('')
  const [newAdminBusiness, setNewAdminBusiness] = useState('')
  const [createAdminLoading, setCreateAdminLoading] = useState(false)
  const [createdAdminInfo, setCreatedAdminInfo] = useState<any>(null)

  // Administrators list states
  const [administrators, setAdministrators] = useState<any[]>([])
  const [adminsLoading, setAdminsLoading] = useState(false)

  // Cashiers list state
  const [cashiers, setCashiers] = useState<any[]>([])

  // Created cashier password display
  const [createdCashierPassword, setCreatedCashierPassword] = useState<string | null>(null)
  const [createdCashierName, setCreatedCashierName] = useState<string | null>(null)
  const [createdCashierId, setCreatedCashierId] = useState<string | null>(null)
  const [visiblePasswordId, setVisiblePasswordId] = useState<string | null>(null)

  // Get cashier password from localStorage
  const getCashierPassword = (cashierId: string): string | null => {
    try {
      const passwordsKey = 'niatala_cashier_passwords'
      const stored = localStorage.getItem(passwordsKey)
      if (!stored) return null
      const passwords = JSON.parse(stored)
      return passwords[cashierId] || null
    } catch (err) {
      return null
    }
  }

  // Load cashiers from API
  const loadCashiers = async () => {
    try {
      const host = window.location.hostname
      const port = 3001
      const url = `http://${host}:${port}/api/auth/users`

      const response = await fetch(url, {
        credentials: 'include',
      })

      const data = await response.json()
      if (data.users) {
        setCashiers(data.users)
      }
    } catch (err) {
      console.error('Error loading cashiers:', err)
    }
  }

  // Load on mount
  useEffect(() => {
    loadCashiers().catch(err => console.error('Error loading cashiers:', err))
  }, [])

  const auditLogs = getAuditLogs()

  const handleCreateCashier = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!newCashierName.trim() || !newCashierUsername.trim() || !newCashierPassword.trim()) {
      setError('Tous les champs sont obligatoires')
      return
    }

    if (newCashierPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères')
      return
    }

    try {
      const result = await createUser(newCashierName.trim(), newCashierUsername.trim(), newCashierPassword, 'CASHIER')

      if (!result) {
        setError('Erreur: le caissier n\'a pas pu être créé')
        return
      }

      // Store the password to display and persist in localStorage
      setCreatedCashierPassword(newCashierPassword)
      setCreatedCashierName(newCashierName)
      setCreatedCashierId(result.id)
      setVisiblePasswordId(result.id)

      // Persist password in localStorage for this session
      try {
        const passwordsKey = 'niatala_cashier_passwords'
        const stored = localStorage.getItem(passwordsKey)
        const passwords = stored ? JSON.parse(stored) : {}
        passwords[result.id] = newCashierPassword
        localStorage.setItem(passwordsKey, JSON.stringify(passwords))
      } catch (err) {
        console.error('Error storing password:', err)
      }

      setSuccess(`Caissier "${newCashierName}" créé avec succès`)
      setNewCashierName('')
      setNewCashierUsername('')
      setNewCashierPassword('')
      // Reload cashiers list
      await loadCashiers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création')
    }
  }

  const handleToggleCashierStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'DISABLED' : 'ACTIVE'

    try {
      const host = window.location.hostname
      const port = 3001
      const url = `http://${host}:${port}/api/auth/update-user-status`

      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId, status: newStatus }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la mise à jour')
      }

      setSuccess(`✅ Statut du caissier mis à jour`)
      loadCashiers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour')
    }
  }

  const handleDeleteCashier = async (cashierId: string, cashierName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le caissier "${cashierName}" ?\n\nCette action est irréversible.`)) {
      return
    }

    try {
      const host = window.location.hostname
      const port = 3001
      const url = `http://${host}:${port}/api/auth/delete-user`

      const response = await fetch(url, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId: cashierId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la suppression')
      }

      setSuccess('✅ Caissier supprimé avec succès!')
      loadCashiers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression')
    }
  }

  const handleConnectWave = () => {
    setError('')
    setSuccess('')

    if (!waveMerchantNumber.trim() || !waveMerchantName.trim()) {
      setError('Numéro marchand et nom du commerce sont obligatoires')
      return
    }

    const success = connectWaveAccount(waveMerchantNumber, waveMerchantName)
    if (success) {
      setSuccess('✅ Compte Wave connecté avec succès')
      setWaveMerchantNumber('')
      setWaveMerchantName('')
    } else {
      setError('Erreur lors de la connexion')
    }
  }

  const handleDisconnectWave = () => {
    disconnectWaveAccount()
    setSuccess('✅ Compte Wave déconnecté')
  }

  const handleConnectOrangeMoney = () => {
    setError('')
    setSuccess('')

    if (!orangeMerchantNumber.trim() || !orangeMerchantName.trim()) {
      setError('Numéro marchand et nom du commerce sont obligatoires')
      return
    }

    const success = connectOrangeMoneyAccount(orangeMerchantNumber, orangeMerchantName)
    if (success) {
      setSuccess('✅ Compte Orange Money connecté avec succès')
      setOrangeMerchantNumber('')
      setOrangeMerchantName('')
    } else {
      setError('Erreur lors de la connexion')
    }
  }

  const handleDisconnectOrangeMoney = () => {
    disconnectOrangeMoneyAccount()
    setSuccess('✅ Compte Orange Money déconnecté')
  }

  const handleConnectFree = () => {
    setError('')
    setSuccess('')

    if (!freeMerchantNumber.trim() || !freeMerchantName.trim()) {
      setError('Numéro marchand et nom du commerce sont obligatoires')
      return
    }

    const success = connectFreeAccount(freeMerchantNumber, freeMerchantName)
    if (success) {
      setSuccess('✅ Compte Free connecté avec succès')
      setFreeMerchantNumber('')
      setFreeMerchantName('')
    } else {
      setError('Erreur lors de la connexion')
    }
  }

  const handleDisconnectFree = () => {
    disconnectFreeAccount()
    setSuccess('✅ Compte Free déconnecté')
  }

  const handleToggleCashierPaymentMethod = (cashierId: string, method: 'wave' | 'orange_money' | 'free' | 'card') => {
    const settings = getPaymentSettingsForUser(cashierId)
    if (settings.enabledMethods.includes(method)) {
      disablePaymentMethod(cashierId, method)
    } else {
      enablePaymentMethod(cashierId, method)
    }
  }

  const handleSaveStockThresholds = () => {
    setError('')
    setSuccess('')

    const orange = parseInt(stockThresholdOrange)
    const red = parseInt(stockThresholdRed)

    if (isNaN(orange) || isNaN(red)) {
      setError('Les seuils doivent être des nombres')
      return
    }

    const validation = validateThresholds(orange, red)
    if (!validation.valid) {
      setError(validation.error || 'Erreur de validation')
      return
    }

    try {
      setDefaultThresholds({ thresholdOrange: orange, thresholdRed: red })
      setSuccess('✅ Seuils de stock mis à jour avec succès')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour')
    }
  }

  const [resetPasswordAdminId, setResetPasswordAdminId] = useState<string | null>(null)
  const [resetPasswordResult, setResetPasswordResult] = useState<any>(null)

  const loadAdministrators = async () => {
    setAdminsLoading(true)
    try {
      const host = window.location.hostname
      const port = 3001
      const url = `http://${host}:${port}/api/super-admin/all-admins`

      const response = await fetch(url, {
        credentials: 'include',
      })

      const data = await response.json()
      if (data.admins) {
        setAdministrators(data.admins)
      }
    } catch (err) {
      console.error('Error loading administrators:', err)
      setError('Erreur lors du chargement des administrateurs')
    } finally {
      setAdminsLoading(false)
    }
  }

  const handleDeleteAdmin = async (adminId: string, adminName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'administrateur "${adminName}" ?\n\nCette action est irréversible.`)) {
      return
    }

    try {
      const host = window.location.hostname
      const port = 3001
      const url = `http://${host}:${port}/api/super-admin/delete-admin`

      const response = await fetch(url, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ adminId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la suppression')
      }

      setSuccess('✅ Administrateur supprimé avec succès!')
      loadAdministrators()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression')
    }
  }

  const handleResetAdminPassword = async (adminId: string) => {
    try {
      const host = window.location.hostname
      const port = 3001
      const url = `http://${host}:${port}/api/super-admin/reset-admin-password`

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ adminId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la réinitialisation')
      }

      setResetPasswordAdminId(adminId)
      setResetPasswordResult(data.tempPassword)
      setSuccess('✅ Mot de passe réinitialisé!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la réinitialisation')
    }
  }

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setCreateAdminLoading(true)

    try {
      if (!newAdminFirstName.trim() || !newAdminLastName.trim() || !newAdminWhatsapp.trim() || !newAdminUsername.trim()) {
        throw new Error('Tous les champs sont obligatoires')
      }

      const host = window.location.hostname
      const port = 3001
      const apiUrl = `http://${host}:${port}/api/super-admin/create-admin`

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          firstName: newAdminFirstName,
          lastName: newAdminLastName,
          whatsapp: newAdminWhatsapp,
          username: newAdminUsername,
          businessName: newAdminBusiness,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création')
      }

      setSuccess('✅ Administrateur créé avec succès!')
      setCreatedAdminInfo(data.admin)
      setNewAdminFirstName('')
      setNewAdminLastName('')
      setNewAdminWhatsapp('')
      setNewAdminUsername('')
      setNewAdminBusiness('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création')
    } finally {
      setCreateAdminLoading(false)
    }
  }

  return (
    <div className="admin-screen">
      <div className="admin-header">
        <h1>⚙️ ADMINISTRATION</h1>
        <p>Connecté en tant que: {session.name}</p>
      </div>

      <div className="admin-tabs">
        {session.role === 'SUPER_ADMIN' ? (
          <>
            <button
              className={`tab-btn ${activeTab === 'create-admin' ? 'active' : ''}`}
              onClick={() => setActiveTab('create-admin')}
            >
              ➕ Créer Admin
            </button>
            <button
              className={`tab-btn ${activeTab === 'admins' ? 'active' : ''}`}
              onClick={() => setActiveTab('admins')}
            >
              👥 Administrateurs
            </button>
          </>
        ) : (
          <button
            className={`tab-btn ${activeTab === 'cashiers' ? 'active' : ''}`}
            onClick={() => setActiveTab('cashiers')}
          >
            👥 Caissiers
          </button>
        )}
        <button
          className={`tab-btn ${activeTab === 'audit' ? 'active' : ''}`}
          onClick={() => setActiveTab('audit')}
        >
          🔎 Journal d'audit
        </button>
        <button
          className={`tab-btn ${activeTab === 'payments' ? 'active' : ''}`}
          onClick={() => setActiveTab('payments')}
        >
          💳 Paiements mobiles
        </button>
        <button
          className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          ⚙️ Paramètres
        </button>
        <button
          className={`tab-btn ${activeTab === 'stock' ? 'active' : ''}`}
          onClick={() => setActiveTab('stock')}
        >
          📦 Stocks
        </button>
        <button
          className={`tab-btn ${activeTab === 'export' ? 'active' : ''}`}
          onClick={() => setActiveTab('export')}
        >
          📥 Exporter
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'create-admin' && session.role === 'SUPER_ADMIN' && (
          <div className="create-admin-section" style={{ maxWidth: '600px' }}>
            <h2>➕ Créer un nouvel Administrateur</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Chaque administrateur aura sa propre application isolée avec ses caissiers et ses données.</p>

            <form onSubmit={handleCreateAdmin} style={{ display: 'grid', gap: '1rem', marginTop: '2rem' }}>
              <div className="form-group">
                <label>Prénom *</label>
                <input
                  type="text"
                  value={newAdminFirstName}
                  onChange={(e) => setNewAdminFirstName(e.target.value)}
                  placeholder="Ex: Moussa"
                  disabled={createAdminLoading}
                  required
                />
              </div>

              <div className="form-group">
                <label>Nom *</label>
                <input
                  type="text"
                  value={newAdminLastName}
                  onChange={(e) => setNewAdminLastName(e.target.value)}
                  placeholder="Ex: Diop"
                  disabled={createAdminLoading}
                  required
                />
              </div>

              <div className="form-group">
                <label>Numéro WhatsApp *</label>
                <input
                  type="tel"
                  value={newAdminWhatsapp}
                  onChange={(e) => setNewAdminWhatsapp(e.target.value)}
                  placeholder="+221781234567"
                  disabled={createAdminLoading}
                  required
                />
              </div>

              <div className="form-group">
                <label>Nom d'utilisateur *</label>
                <input
                  type="text"
                  value={newAdminUsername}
                  onChange={(e) => setNewAdminUsername(e.target.value)}
                  placeholder="Ex: admin1"
                  disabled={createAdminLoading}
                  required
                />
              </div>

              <div className="form-group">
                <label>Nom du commerce (optionnel)</label>
                <input
                  type="text"
                  value={newAdminBusiness}
                  onChange={(e) => setNewAdminBusiness(e.target.value)}
                  placeholder="Ex: Magasin ABC"
                  disabled={createAdminLoading}
                />
              </div>

              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{success}</div>}

              <button type="submit" className="btn-primary" disabled={createAdminLoading} style={{ marginTop: '1rem' }}>
                {createAdminLoading ? '⏳ Création...' : '✅ CRÉER ADMINISTRATEUR'}
              </button>
            </form>

            {createdAdminInfo && (
              <div style={{
                marginTop: '2rem',
                padding: '1.5rem',
                background: '#dcfce7',
                border: '2px solid #16a34a',
                borderRadius: '0.5rem'
              }}>
                <h3 style={{ marginTop: 0, color: '#166534' }}>✅ Administrateur créé!</h3>
                <p><strong>Identifiant:</strong> {createdAdminInfo.username}</p>
                <p><strong>Mot de passe temporaire:</strong> <code style={{ background: '#fff', padding: '0.5rem', borderRadius: '0.25rem' }}>{createdAdminInfo.temporaryPassword}</code></p>
                <p style={{ fontSize: '0.9rem', color: '#166534' }}>Partagez ces identifiants avec l'administrateur pour qu'il se connecte et configure son compte.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'admins' && session.role === 'SUPER_ADMIN' && (
          <div className="administrators-section">
            <h2>👥 Liste des Administrateurs</h2>
            <button
              onClick={loadAdministrators}
              style={{ marginBottom: '1rem', padding: '0.5rem 1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}
            >
              🔄 Rafraîchir
            </button>

            {adminsLoading ? (
              <p>⏳ Chargement...</p>
            ) : administrators.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>Aucun administrateur trouvé</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border)' }}>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>Nom</th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>Username</th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>WhatsApp</th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>Rôle</th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>Statut</th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>Créé</th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {administrators.map((admin: any) => (
                      <tr key={admin.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '1rem' }}>{admin.name || admin.firstName} {admin.lastName}</td>
                        <td style={{ padding: '1rem' }}><strong>{admin.username}</strong></td>
                        <td style={{ padding: '1rem', color: '#059669' }}>{admin.whatsapp || '-'}</td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{ background: admin.role === 'SUPER_ADMIN' ? '#dbeafe' : '#fef3c7', color: admin.role === 'SUPER_ADMIN' ? '#1e40af' : '#92400e', padding: '0.25rem 0.75rem', borderRadius: '0.25rem', fontSize: '0.875rem', fontWeight: 'bold' }}>
                            {admin.role}
                          </span>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{ background: admin.status === 'ACTIVE' ? '#dcfce7' : '#fee2e2', color: admin.status === 'ACTIVE' ? '#166534' : '#991b1b', padding: '0.25rem 0.75rem', borderRadius: '0.25rem', fontSize: '0.875rem' }}>
                            {admin.status}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                          {new Date(admin.createdAt).toLocaleDateString('fr-FR')}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {admin.role !== 'SUPER_ADMIN' && (
                              <>
                                <button
                                  onClick={() => handleResetAdminPassword(admin.id)}
                                  title="Réinitialiser le mot de passe"
                                  style={{
                                    background: '#3b82f6',
                                    color: 'white',
                                    border: 'none',
                                    padding: '0.5rem 0.75rem',
                                    borderRadius: '0.25rem',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                  }}
                                >
                                  👁️
                                </button>
                                <button
                                  onClick={() => handleDeleteAdmin(admin.id, admin.name)}
                                  title="Supprimer l'administrateur"
                                  style={{
                                    background: '#dc2626',
                                    color: 'white',
                                    border: 'none',
                                    padding: '0.5rem 0.75rem',
                                    borderRadius: '0.25rem',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                  }}
                                >
                                  🗑️
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {resetPasswordAdminId && resetPasswordResult && (
              <div style={{
                marginTop: '2rem',
                padding: '1.5rem',
                background: '#e0f2fe',
                border: '2px solid #0284c7',
                borderRadius: '0.5rem'
              }}>
                <h4 style={{ marginTop: 0, color: '#0c4a6e' }}>✅ Nouveau mot de passe temporaire</h4>
                <p style={{ marginBottom: '0.5rem' }}>Partagez ce mot de passe avec l'administrateur:</p>
                <code style={{ background: '#fff', padding: '0.75rem', display: 'block', borderRadius: '0.25rem', fontWeight: 'bold', color: '#0284c7' }}>
                  {resetPasswordResult}
                </code>
                <button
                  onClick={() => setResetPasswordResult(null)}
                  style={{
                    marginTop: '0.5rem',
                    background: 'none',
                    border: 'none',
                    color: '#0284c7',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Fermer
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'cashiers' && (
          <div className="cashiers-section">
            <h2>Gestion des caissiers</h2>

            <form onSubmit={handleCreateCashier} className="create-cashier-form">
              <h3>+ Ajouter un caissier</h3>

              <div className="form-group">
                <label>Nom complet</label>
                <input
                  type="text"
                  value={newCashierName}
                  onChange={(e) => setNewCashierName(e.target.value)}
                  placeholder="Ex: Moussa Diop"
                />
              </div>

              <div className="form-group">
                <label>Identifiant</label>
                <input
                  type="text"
                  value={newCashierUsername}
                  onChange={(e) => setNewCashierUsername(e.target.value)}
                  placeholder="Ex: moussa"
                />
              </div>

              <div className="form-group">
                <label>Mot de passe initial</label>
                <input
                  type="password"
                  value={newCashierPassword}
                  onChange={(e) => setNewCashierPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{success}</div>}

              <button type="submit" className="btn-primary">
                ➕ CRÉER LE CAISSIER
              </button>
            </form>

            {createdCashierPassword && createdCashierName && (
              <div style={{
                marginTop: '2rem',
                padding: '1.5rem',
                background: '#dbeafe',
                border: '2px solid #3b82f6',
                borderRadius: '0.75rem',
              }}>
                <h4 style={{ margin: '0 0 1rem 0', color: '#1e40af' }}>📋 Identifiants du caissier "{createdCashierName}"</h4>
                <p style={{ margin: '0.5rem 0', fontSize: '0.95rem' }}>
                  <strong>Mot de passe:</strong> <code style={{ background: '#fff', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontFamily: 'monospace' }}>{createdCashierPassword}</code>
                </p>
                <button
                  onClick={() => {
                    setCreatedCashierPassword(null)
                    setCreatedCashierName(null)
                  }}
                  style={{
                    marginTop: '1rem',
                    padding: '0.5rem 1rem',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                  }}
                >
                  Masquer
                </button>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}>Caissiers existants ({cashiers.length})</h3>
              {cashiers.length > 0 && (
                <button
                  onClick={() => {
                    if (confirm('Révoquer l\'accès inventaire de TOUS les caissiers ?')) {
                      try {
                        localStorage.removeItem('cashier_inventory_access')
                        setSuccess('✅ Tous les accès inventaire ont été révoqués')
                      } catch (err) {
                        setError('Erreur lors de la révocation')
                      }
                    }
                  }}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#dc2626',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                  }}
                >
                  🚫 Révoquer tous
                </button>
              )}
            </div>
            <div className="cashiers-list">
              {cashiers.length === 0 ? (
                <p className="empty-message">Aucun caissier créé</p>
              ) : (
                <table className="cashiers-table">
                  <thead>
                    <tr>
                      <th>Nom</th>
                      <th>Identifiant</th>
                      <th>Mot de passe</th>
                      <th>Statut</th>
                      <th>Permissions</th>
                      <th>Dernière connexion</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cashiers.map(cashier => (
                      <tr key={cashier.id}>
                        <td>{cashier.name}</td>
                        <td>{cashier.username}</td>
                        <td>
                          {(() => {
                            const password = getCashierPassword(cashier.id)
                            if (!password) return <span style={{ color: '#9ca3af' }}>-</span>

                            return (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <code style={{ background: '#f3f4f6', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                                  {visiblePasswordId === cashier.id ? password : '••••••••'}
                                </code>
                                <button
                                  onClick={() => setVisiblePasswordId(visiblePasswordId === cashier.id ? null : cashier.id)}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '1.2rem',
                                    padding: '0',
                                  }}
                                  title={visiblePasswordId === cashier.id ? 'Masquer' : 'Afficher'}
                                >
                                  {visiblePasswordId === cashier.id ? '👁️' : '👁️‍🗨️'}
                                </button>
                              </div>
                            )
                          })()}
                        </td>
                        <td>
                          <span className={`status-badge ${cashier.status.toLowerCase()}`}>
                            {cashier.status === 'ACTIVE' ? '🟢 ACTIF' : '🔴 DÉSACTIVÉ'}
                          </span>
                        </td>
                        <td>
                          {(() => {
                            const expiresAt = (() => {
                              try {
                                const perms = JSON.parse(localStorage.getItem('cashier_inventory_access') || '{}')
                                return perms[cashier.id]?.expiresAt || null
                              } catch {
                                return null
                              }
                            })()

                            const now = Date.now()
                            const isActive = expiresAt && expiresAt > now
                            const remainingHours = isActive ? Math.round((expiresAt - now) / (1000 * 60 * 60) * 10) / 10 : 0

                            return (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                {isActive ? (
                                  <span style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: '600' }}>
                                    ✓ {remainingHours}h
                                  </span>
                                ) : (
                                  <span style={{ fontSize: '0.85rem', color: '#9ca3af' }}>-</span>
                                )}
                                <button
                                  onClick={() => {
                                    try {
                                      const perms = JSON.parse(localStorage.getItem('cashier_inventory_access') || '{}')
                                      if (isActive) {
                                        // Révoquer: supprimer l'accès
                                        delete perms[cashier.id]
                                        localStorage.setItem('cashier_inventory_access', JSON.stringify(perms))
                                        setSuccess(`✅ Accès inventaire révoqué`)
                                      } else {
                                        // Autoriser: activer pour 12h
                                        const expiresAt = Date.now() + (12 * 60 * 60 * 1000)
                                        if (!perms[cashier.id]) perms[cashier.id] = {}
                                        perms[cashier.id].expiresAt = expiresAt
                                        localStorage.setItem('cashier_inventory_access', JSON.stringify(perms))
                                        setSuccess(`✅ Accès inventaire activé pour 12h`)
                                      }
                                    } catch (err) {
                                      setError('Erreur')
                                    }
                                  }}
                                  style={{
                                    padding: '0.25rem 0.5rem',
                                    background: isActive ? '#dc2626' : '#10b981',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.25rem',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem',
                                    fontWeight: '600',
                                  }}
                                >
                                  {isActive ? 'Révoquer' : 'Autoriser 12h'}
                                </button>
                              </div>
                            )
                          })()}
                        </td>
                        <td>
                          {cashier.lastLogin
                            ? new Date(cashier.lastLogin).toLocaleString('fr-FR')
                            : 'Jamais'}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              className={`btn-toggle ${cashier.status.toLowerCase()}`}
                              onClick={() => handleToggleCashierStatus(cashier.id, cashier.status)}
                            >
                              {cashier.status === 'ACTIVE' ? '🔒' : '🔓'}
                            </button>
                            <button
                              className="btn-toggle"
                              onClick={() => setSelectedCashierForPayment(selectedCashierForPayment === cashier.id ? null : cashier.id)}
                              title="Gérer les paiements"
                            >
                              💳
                            </button>
                            <button
                              className="btn-toggle btn-danger"
                              onClick={() => handleDeleteCashier(cashier.id, cashier.name)}
                              title="Supprimer le caissier"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {selectedCashierForPayment && (
              <div className="payment-methods-section" style={{ marginTop: '2rem' }}>
                <div className="section-header">
                  <h3>
                    Moyens de paiement pour {cashiers.find(c => c.id === selectedCashierForPayment)?.name}
                  </h3>
                  <button
                    className="btn-close"
                    onClick={() => setSelectedCashierForPayment(null)}
                  >
                    ✕
                  </button>
                </div>

                <div className="payment-methods-grid">
                  <div className="method-card">
                    <div className="method-icon">💵</div>
                    <div className="method-name">ESPÈCES</div>
                    <div className="method-status active">✓ Activé</div>
                  </div>

                  {getWaveStatus().status === 'CONNECTED' && (
                    <button
                      className={`method-card toggle-btn ${getPaymentSettingsForUser(selectedCashierForPayment).enabledMethods.includes('wave') ? 'active' : ''}`}
                      onClick={() => handleToggleCashierPaymentMethod(selectedCashierForPayment, 'wave')}
                    >
                      <div className="method-icon">📱</div>
                      <div className="method-name">WAVE</div>
                      <div className={`method-status ${getPaymentSettingsForUser(selectedCashierForPayment).enabledMethods.includes('wave') ? 'enabled' : 'disabled'}`}>
                        {getPaymentSettingsForUser(selectedCashierForPayment).enabledMethods.includes('wave') ? '✓ Activé' : '○ Désactivé'}
                      </div>
                    </button>
                  )}

                  {getOrangeMoneyStatus().status === 'CONNECTED' && (
                    <button
                      className={`method-card toggle-btn ${getPaymentSettingsForUser(selectedCashierForPayment).enabledMethods.includes('orange_money') ? 'active' : ''}`}
                      onClick={() => handleToggleCashierPaymentMethod(selectedCashierForPayment, 'orange_money')}
                    >
                      <div className="method-icon">🟠</div>
                      <div className="method-name">ORANGE</div>
                      <div className={`method-status ${getPaymentSettingsForUser(selectedCashierForPayment).enabledMethods.includes('orange_money') ? 'enabled' : 'disabled'}`}>
                        {getPaymentSettingsForUser(selectedCashierForPayment).enabledMethods.includes('orange_money') ? '✓ Activé' : '○ Désactivé'}
                      </div>
                    </button>
                  )}

                  {getFreeStatus().status === 'CONNECTED' && (
                    <button
                      className={`method-card toggle-btn ${getPaymentSettingsForUser(selectedCashierForPayment).enabledMethods.includes('free') ? 'active' : ''}`}
                      onClick={() => handleToggleCashierPaymentMethod(selectedCashierForPayment, 'free')}
                    >
                      <div className="method-icon">🟪</div>
                      <div className="method-name">FREE</div>
                      <div className={`method-status ${getPaymentSettingsForUser(selectedCashierForPayment).enabledMethods.includes('free') ? 'enabled' : 'disabled'}`}>
                        {getPaymentSettingsForUser(selectedCashierForPayment).enabledMethods.includes('free') ? '✓ Activé' : '○ Désactivé'}
                      </div>
                    </button>
                  )}

                  <button
                    className={`method-card toggle-btn ${getPaymentSettingsForUser(selectedCashierForPayment).enabledMethods.includes('card') ? 'active' : ''}`}
                    onClick={() => handleToggleCashierPaymentMethod(selectedCashierForPayment, 'card')}
                  >
                    <div className="method-icon">💳</div>
                    <div className="method-name">CARTE</div>
                    <div className={`method-status ${getPaymentSettingsForUser(selectedCashierForPayment).enabledMethods.includes('card') ? 'enabled' : 'disabled'}`}>
                      {getPaymentSettingsForUser(selectedCashierForPayment).enabledMethods.includes('card') ? '✓ Activé' : '○ Désactivé'}
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="audit-section">
            <h2>🔎 Journal d'audit</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Total d'événements: {auditLogs.length}
            </p>

            <div className="audit-logs">
              {auditLogs.length === 0 ? (
                <p className="empty-message">Aucun événement enregistré</p>
              ) : (
                <table className="audit-table">
                  <thead>
                    <tr>
                      <th>Date/Heure</th>
                      <th>Utilisateur</th>
                      <th>Rôle</th>
                      <th>Action</th>
                      <th>Référence</th>
                      <th>Montant</th>
                      <th>Détails</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...auditLogs].reverse().map(log => (
                      <tr key={log.id}>
                        <td className="date-time">
                          <div>{log.date}</div>
                          <div style={{ fontSize: '0.75rem' }}>{log.time}</div>
                        </td>
                        <td>{log.username}</td>
                        <td>
                          <span className={`role-badge ${log.userRole.toLowerCase()}`}>
                            {log.userRole === 'ADMIN' ? '⚙️ Admin' : '💳 Caissier'}
                          </span>
                        </td>
                        <td className="action">
                          <span className={`action-badge ${log.action.toLowerCase()}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="reference">{log.reference || '-'}</td>
                        <td className="amount">
                          {log.amount ? log.amount.toLocaleString('fr-FR') + ' FCFA' : '-'}
                        </td>
                        <td className="motif">{log.motif || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="payments-section">
            <h2>💳 Moyens de paiement</h2>

            <div className="payment-providers">
              {/* WAVE */}
              <div className="provider-card">
                <div className="provider-header">
                  <h3>WAVE</h3>
                  <span className={`status-badge ${getWaveStatus().status.toLowerCase()}`}>
                    {getWaveStatus().status === 'CONNECTED' ? '🟢 CONNECTÉ' : '⚪ NON CONNECTÉ'}
                  </span>
                </div>

                {getWaveStatus().status === 'DISCONNECTED' ? (
                  <div className="provider-form">
                    <div className="form-group">
                      <label>Numéro marchand</label>
                      <input
                        type="text"
                        value={waveMerchantNumber}
                        onChange={(e) => setWaveMerchantNumber(e.target.value)}
                        placeholder="Ex: MERCHANT-12345"
                      />
                    </div>

                    <div className="form-group">
                      <label>Nom du commerce</label>
                      <input
                        type="text"
                        value={waveMerchantName}
                        onChange={(e) => setWaveMerchantName(e.target.value)}
                        placeholder="Ex: Mon Magasin SARL"
                      />
                    </div>

                    <button className="btn-primary" onClick={handleConnectWave}>
                      🔗 CONNECTER
                    </button>
                  </div>
                ) : (
                  <div className="provider-connected">
                    <p>
                      <strong>Numéro marchand:</strong> {getWaveStatus().merchantNumber}
                    </p>
                    <p>
                      <strong>Nom:</strong> {getWaveStatus().merchantName}
                    </p>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      Connecté depuis: {new Date(getWaveStatus().connectedAt || 0).toLocaleString('fr-FR')}
                    </p>
                    <button className="btn-danger" onClick={handleDisconnectWave}>
                      🔌 DÉCONNECTER
                    </button>
                  </div>
                )}
              </div>

              {/* ORANGE MONEY */}
              <div className="provider-card">
                <div className="provider-header">
                  <h3>ORANGE MONEY</h3>
                  <span className={`status-badge ${getOrangeMoneyStatus().status.toLowerCase()}`}>
                    {getOrangeMoneyStatus().status === 'CONNECTED' ? '🟢 CONNECTÉ' : '⚪ NON CONNECTÉ'}
                  </span>
                </div>

                {getOrangeMoneyStatus().status === 'DISCONNECTED' ? (
                  <div className="provider-form">
                    <div className="form-group">
                      <label>Numéro marchand</label>
                      <input
                        type="text"
                        value={orangeMerchantNumber}
                        onChange={(e) => setOrangeMerchantNumber(e.target.value)}
                        placeholder="Ex: ORANGE-12345"
                      />
                    </div>

                    <div className="form-group">
                      <label>Nom du commerce</label>
                      <input
                        type="text"
                        value={orangeMerchantName}
                        onChange={(e) => setOrangeMerchantName(e.target.value)}
                        placeholder="Ex: Mon Magasin SARL"
                      />
                    </div>

                    <button className="btn-primary" onClick={handleConnectOrangeMoney}>
                      🔗 CONNECTER
                    </button>
                  </div>
                ) : (
                  <div className="provider-connected">
                    <p>
                      <strong>Numéro marchand:</strong> {getOrangeMoneyStatus().merchantNumber}
                    </p>
                    <p>
                      <strong>Nom:</strong> {getOrangeMoneyStatus().merchantName}
                    </p>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      Connecté depuis: {new Date(getOrangeMoneyStatus().connectedAt || 0).toLocaleString('fr-FR')}
                    </p>
                    <button className="btn-danger" onClick={handleDisconnectOrangeMoney}>
                      🔌 DÉCONNECTER
                    </button>
                  </div>
                )}
              </div>

              {/* FREE */}
              <div className="provider-card">
                <div className="provider-header">
                  <h3>FREE</h3>
                  <span className={`status-badge ${getFreeStatus().status.toLowerCase()}`}>
                    {getFreeStatus().status === 'CONNECTED' ? '🟢 CONNECTÉ' : '⚪ NON CONNECTÉ'}
                  </span>
                </div>

                {getFreeStatus().status === 'DISCONNECTED' ? (
                  <div className="provider-form">
                    <div className="form-group">
                      <label>Numéro marchand</label>
                      <input
                        type="text"
                        value={freeMerchantNumber}
                        onChange={(e) => setFreeMerchantNumber(e.target.value)}
                        placeholder="Ex: FREE-12345"
                      />
                    </div>

                    <div className="form-group">
                      <label>Nom du commerce</label>
                      <input
                        type="text"
                        value={freeMerchantName}
                        onChange={(e) => setFreeMerchantName(e.target.value)}
                        placeholder="Ex: Mon Magasin SARL"
                      />
                    </div>

                    <button className="btn-primary" onClick={handleConnectFree}>
                      🔗 CONNECTER
                    </button>
                  </div>
                ) : (
                  <div className="provider-connected">
                    <p>
                      <strong>Numéro marchand:</strong> {getFreeStatus().merchantNumber}
                    </p>
                    <p>
                      <strong>Nom:</strong> {getFreeStatus().merchantName}
                    </p>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      Connecté depuis: {new Date(getFreeStatus().connectedAt || 0).toLocaleString('fr-FR')}
                    </p>
                    <button className="btn-danger" onClick={handleDisconnectFree}>
                      🔌 DÉCONNECTER
                    </button>
                  </div>
                )}
              </div>
            </div>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <div className="info-box" style={{ marginTop: '2rem' }}>
              <h4>ℹ️ Architecture de paiement</h4>
              <p>
                Les clés API ne sont jamais stockées dans le frontend. Préparez votre backend pour
                gérer les intégrations réelles avec Wave et Orange Money.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="settings-section">
            <h2>⚙️ Paramètres</h2>

            <div className="settings-group">
              <h3>📦 Gestion des stocks</h3>
              <div className="setting-item">
                <div className="setting-info">
                  <label>Activer le suivi des stocks</label>
                  <p className="setting-description">
                    Si désactivé, les vendeurs pourront vendre des produits sans vérification de stock
                  </p>
                </div>
                <button
                  className={`toggle-btn ${enableInventory ? 'active' : ''}`}
                  onClick={toggleInventory}
                  title={enableInventory ? 'Désactiver le suivi des stocks' : 'Activer le suivi des stocks'}
                >
                  {enableInventory ? '✓ ACTIVÉ' : '✗ DÉSACTIVÉ'}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'stock' && (
          <div className="stock-settings-section">
            <h2>📦 Paramètres des stocks</h2>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <div className="settings-form">
              <h3>Seuils par défaut</h3>
              <p>Ces seuils s'appliquent à tous les produits (sauf ceux avec seuils personnalisés).</p>

              <div className="form-group">
                <label>Seuil orange (stock faible)</label>
                <input
                  type="number"
                  value={stockThresholdOrange}
                  onChange={(e) => setStockThresholdOrange(e.target.value)}
                  min="0"
                  placeholder="10"
                />
                <small>Alerte quand le stock est ≤ à cette valeur</small>
              </div>

              <div className="form-group">
                <label>Seuil rouge (stock critique)</label>
                <input
                  type="number"
                  value={stockThresholdRed}
                  onChange={(e) => setStockThresholdRed(e.target.value)}
                  min="0"
                  placeholder="5"
                />
                <small>Alerte critique quand le stock est ≤ à cette valeur</small>
              </div>

              <button className="btn-save" onClick={handleSaveStockThresholds}>
                💾 Enregistrer les seuils
              </button>

              <div className="info-box">
                <h4>💡 Informations importantes:</h4>
                <ul>
                  <li>Le seuil rouge doit être inférieur au seuil orange</li>
                  <li>Vous pouvez définir des seuils personnalisés pour chaque produit dans la gestion des articles</li>
                  <li>Ces paramètres s'appliquent automatiquement à tous les nouveaux produits</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'export' && (
          <div style={{ maxWidth: '800px' }}>
            <h2>📥 Exporter les données</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Téléchargez vos données en format CSV pour votre comptabilité ou analyse.</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
              <button
                onClick={() => {
                  const data = cashiers.map(c => ({
                    'Nom': c.name,
                    'Identifiant': c.username,
                    'Statut': c.status,
                    'Créé': c.createdAt ? new Date(c.createdAt).toLocaleDateString('fr-FR') : '-',
                  }))
                  downloadCSV(data, `Caissiers_${new Date().toLocaleDateString('fr-FR')}`)
                }}
                style={{
                  padding: '1rem',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600',
                }}
              >
                📋 Exporter Caissiers
              </button>

              <button
                onClick={() => {
                  const data = auditLogs.map(log => ({
                    'Date': log.timestamp ? new Date(log.timestamp).toLocaleString('fr-FR') : '-',
                    'Utilisateur': log.username || '-',
                    'Action': log.action || '-',
                    'Détails': log.details || '-',
                  }))
                  downloadCSV(data, `Audit_${new Date().toLocaleDateString('fr-FR')}`)
                }}
                style={{
                  padding: '1rem',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600',
                }}
              >
                📊 Exporter Audit
              </button>
            </div>

            <div style={{
              padding: '1.5rem',
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: '0.5rem',
            }}>
              <h4 style={{ marginTop: 0 }}>💾 Format CSV</h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Les fichiers sont exportés en format CSV (Comma-Separated Values) compatible avec Excel, Google Sheets, et autres outils de tableur.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
