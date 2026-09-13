import { useState } from 'react'
import { useAuthContext } from '../context/AuthContext'
import {
  createPaymentAccount,
  getPaymentAccountsByProvider,
  deletePaymentAccount,
} from '../services/paymentAccountService'
import { validateSenegalPhoneNumber, formatPhoneNumber, displayPhoneNumber } from '../services/qrService'
import { logAction } from '../services/auditService'
import '../styles/PaymentSettingsScreen.css'

type PaymentProvider = 'wave' | 'orange_money'
type AccountMode = 'personal' | 'business'

interface ProviderState {
  selectedMode: AccountMode | null
  personalPhone: string
  error: string
  success: string
}

export function PaymentSettingsScreen() {
  const { session } = useAuthContext()

  const [waveState, setWaveState] = useState<ProviderState>({
    selectedMode: null,
    personalPhone: '',
    error: '',
    success: '',
  })

  const [orangeState, setOrangeState] = useState<ProviderState>({
    selectedMode: null,
    personalPhone: '',
    error: '',
    success: '',
  })

  const waveAccounts = getPaymentAccountsByProvider('wave')
  const orangeAccounts = getPaymentAccountsByProvider('orange_money')

  const handleSelectMode = (provider: PaymentProvider, mode: AccountMode) => {
    const setState = provider === 'wave' ? setWaveState : setOrangeState
    setState(prev => ({
      ...prev,
      selectedMode: mode,
      error: '',
      success: '',
    }))
  }

  const handlePersonalPhoneSubmit = (provider: PaymentProvider) => {
    const state = provider === 'wave' ? waveState : orangeState
    const setState = provider === 'wave' ? setWaveState : setOrangeState

    if (!state.personalPhone.trim()) {
      setState(prev => ({ ...prev, error: 'Veuillez entrer un numéro de téléphone' }))
      return
    }

    if (!validateSenegalPhoneNumber(state.personalPhone)) {
      setState(prev => ({
        ...prev,
        error: 'Format invalide. Utilisez: 77 XXX XX XX ou +221 77 XXX XX XX',
      }))
      return
    }

    const formattedPhone = formatPhoneNumber(state.personalPhone)

    try {
      createPaymentAccount(provider, 'PERSONAL', formattedPhone, undefined, undefined, `${provider} Personnel`)

      logAction(
        session?.userId || '',
        session?.username || '',
        session?.role || 'ADMIN',
        'PAYMENT_CONFIGURATION_CHANGED',
        {
          reference: `${provider}_personal`,
          details: { provider, mode: 'PERSONAL', phone: displayPhoneNumber(formattedPhone) },
        }
      )

      setState(prev => ({
        ...prev,
        personalPhone: '',
        success: `✅ Numéro ${provider} enregistré : ${displayPhoneNumber(formattedPhone)}`,
      }))

      setTimeout(() => {
        setState(prev => ({ ...prev, success: '' }))
      }, 3000)
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: `Erreur lors de l'enregistrement du numéro`,
      }))
    }
  }

  const handleDeleteAccount = (provider: PaymentProvider, accountId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce compte ?')) {
      deletePaymentAccount(accountId)

      logAction(
        session?.userId || '',
        session?.username || '',
        session?.role || 'ADMIN',
        'PAYMENT_CONFIGURATION_CHANGED',
        {
          reference: `${provider}_deleted`,
          details: { provider, accountId },
        }
      )

      const setState = provider === 'wave' ? setWaveState : setOrangeState
      setState(prev => ({
        ...prev,
        selectedMode: null,
        success: 'Compte supprimé',
      }))

      setTimeout(() => {
        setState(prev => ({ ...prev, success: '' }))
      }, 2000)
    }
  }

  const renderProviderSection = (
    provider: PaymentProvider,
    state: ProviderState,
    setState: (state: ProviderState) => void,
    accounts: any[]
  ) => {
    const providerLabel = provider === 'wave' ? 'WAVE' : 'ORANGE MONEY'
    const providerIcon = provider === 'wave' ? '💙' : '🟠'

    return (
      <div className="provider-section">
        <div className="section-header">
          <h3>{providerIcon} {providerLabel}</h3>
        </div>

        {!state.selectedMode ? (
          <div className="mode-selector">
            <p className="instruction">Comment souhaitez-vous utiliser {providerLabel} ?</p>

            <div className="mode-buttons">
              <button
                className="mode-btn personal"
                onClick={() => handleSelectMode(provider, 'personal')}
              >
                <div className="mode-icon">👤</div>
                <div className="mode-title">Compte personnel</div>
                <div className="mode-desc">Utiliser mon numéro de téléphone</div>
              </button>

              <button
                className="mode-btn business"
                onClick={() => handleSelectMode(provider, 'business')}
              >
                <div className="mode-icon">🏢</div>
                <div className="mode-title">Compte marchand</div>
                <div className="mode-desc">Connecter mon compte Business</div>
              </button>
            </div>

            {accounts.length > 0 && (
              <div className="accounts-list">
                <h4>Comptes configurés</h4>
                {accounts.map(account => (
                  <div key={account.id} className="account-card">
                    <div className="account-info">
                      <div className="account-type">
                        {account.accountType === 'PERSONAL' ? '👤 Personnel' : '🏢 Business'}
                      </div>
                      <div className="account-display">{account.displayName}</div>
                      {account.phone && (
                        <div className="account-phone">{account.phone}</div>
                      )}
                      <div className={`account-status ${account.status.toLowerCase()}`}>
                        {account.status === 'CONFIGURED' && '✓ Configuré'}
                        {account.status === 'CONNECTED' && '✓ Connecté'}
                        {account.status === 'DISCONNECTED' && '✗ Déconnecté'}
                      </div>
                    </div>
                    <button
                      className="btn-delete"
                      onClick={() => handleDeleteAccount(provider, account.id)}
                      title="Supprimer ce compte"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : state.selectedMode === 'personal' ? (
          <div className="personal-setup">
            <div className="setup-form">
              <label>Numéro de téléphone</label>
              <input
                type="tel"
                value={state.personalPhone}
                onChange={(e) =>
                  setState({ ...state, personalPhone: e.target.value, error: '' })
                }
                placeholder="+221 77 XXX XX XX"
                className="phone-input"
              />

              {state.error && <div className="error-message">{state.error}</div>}
              {state.success && <div className="success-message">{state.success}</div>}

              <div className="button-group">
                <button
                  className="btn-primary"
                  onClick={() => handlePersonalPhoneSubmit(provider)}
                >
                  ✓ ENREGISTRER LE NUMÉRO
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => setState({ ...state, selectedMode: null })}
                >
                  ← RETOUR
                </button>
              </div>
            </div>

            <div className="info-box">
              <p>
                <strong>Important:</strong> NIATALA conservera uniquement votre numéro de réception.
              </p>
              <p>
                Nous n'accédons pas à votre solde, vos transactions, ni vos données personnelles du
                compte {providerLabel}.
              </p>
            </div>
          </div>
        ) : (
          <div className="business-setup">
            <div className="setup-form">
              <h4>Connexion du compte {providerLabel} Business</h4>

              <div className="info-box">
                <p>
                  <strong>Prochainement:</strong> Vous pourrez connecter votre compte marchand officiel
                  {provider === 'wave' && ' Wave Business'}
                  {provider === 'orange_money' && ' Orange Money Business'}.
                </p>
                <p>
                  Cette fonctionnalité nécessite une connexion sécurisée via votre backend. Les clés API
                  seront gérées de manière sécurisée, jamais stockées dans le navigateur.
                </p>
              </div>

              <div className="button-group">
                <button className="btn-primary disabled" disabled title="Bientôt disponible">
                  🔗 CONNECTER {providerLabel} BUSINESS
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => setState({ ...state, selectedMode: null })}
                >
                  ← RETOUR
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="payment-settings-screen">
      <div className="settings-header">
        <h1>💳 Configuration des paiements mobiles</h1>
        <p>Configurez comment recevoir vos paiements</p>
      </div>

      <div className="settings-content">
        {renderProviderSection('wave', waveState, setWaveState, waveAccounts)}
        {renderProviderSection('orange_money', orangeState, setOrangeState, orangeAccounts)}
      </div>

      <div className="settings-footer">
        <div className="footer-box">
          <h3>🔒 Sécurité</h3>
          <ul>
            <li>✓ Aucune clé API n'est jamais stockée dans le navigateur</li>
            <li>✓ Vos données personnelles sont sécurisées</li>
            <li>✓ Les connexions officielles utiliseront une API backend sécurisée</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
