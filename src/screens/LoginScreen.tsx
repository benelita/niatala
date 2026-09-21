import { useState } from 'react'
import { login, logout } from '../services/authService'
import { logAction } from '../services/auditService'
import '../styles/LoginScreen.css'

interface LoginScreenProps {
  onLoginSuccess: () => Promise<void> | void
  setCurrentScreen?: (screen: string) => void
}

export function LoginScreen({ onLoginSuccess, setCurrentScreen }: LoginScreenProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [loginType, setLoginType] = useState<'admin' | 'cashier'>('cashier')
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotUsername, setForgotUsername] = useState('')
  const [forgotWhatsapp, setForgotWhatsapp] = useState('')
  const [resetCode, setResetCode] = useState('')
  const [forgotError, setForgotError] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const session = await login(username, password)

      if (!session) {
        setError('Identifiant ou mot de passe incorrect')
        setIsLoading(false)
        return
      }

      if (loginType === 'admin' && session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN') {
        setError('Accès administrateur requis')
        await logout()
        setIsLoading(false)
        return
      }

      if (loginType === 'cashier' && session.role !== 'CASHIER' && session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN') {
        setError('Accès caissier requis')
        await logout()
        setIsLoading(false)
        return
      }

      logAction(session.userId, session.username, session.role, 'LOGIN')
      await onLoginSuccess()
    } catch (err) {
      setError('Une erreur est survenue')
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setForgotError('')
    setForgotLoading(true)

    try {
      if (!forgotUsername.trim() || !forgotWhatsapp.trim()) {
        setForgotError('Remplissez tous les champs')
        setForgotLoading(false)
        return
      }

      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: forgotUsername,
          whatsapp: forgotWhatsapp,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setForgotError(data.error || 'Utilisateur non trouvé')
        setForgotLoading(false)
        return
      }

      setResetCode(data.resetCode)
      setForgotError('')
    } catch (err) {
      setForgotError('Erreur lors de l\'envoi du code')
    } finally {
      setForgotLoading(false)
    }
  }

  return (
    <div className="login-screen">
      <div className="login-container">
        <div className="login-header">
          <h1 className="app-title">NIATALA</h1>
          <p className="login-subtitle">
            {loginType === 'admin' ? 'CONNEXION ADMINISTRATEUR' : 'CONNEXION CAISSIER'}
          </p>
        </div>

        <div className="login-type-selector">
          <button
            className={`type-btn ${loginType === 'cashier' ? 'active' : ''}`}
            onClick={() => setLoginType('cashier')}
          >
            💳 Caissier
          </button>
          <button
            className={`type-btn ${loginType === 'admin' ? 'active' : ''}`}
            onClick={() => setLoginType('admin')}
          >
            ⚙️ Administrateur
          </button>
        </div>

        {!showForgotPassword ? (
          <>
            <form onSubmit={handleLogin} className="login-form">
              <div className="form-group">
                <label htmlFor="username">
                  {loginType === 'admin' ? 'Identifiant' : 'Nom / Identifiant'}
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={loginType === 'admin' ? 'admin' : 'Votre identifiant'}
                  disabled={isLoading}
                  required
                  autoFocus
                />
              </div>

              <div className="form-group password-group">
                <label htmlFor="password">Mot de passe</label>
                <div className="password-input-wrapper">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={isLoading}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? 'Masquer' : 'Afficher'}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              {error && <div className="error-message">{error}</div>}

              <button
                type="submit"
                className="login-btn"
                disabled={isLoading}
              >
                {isLoading ? '⏳ Connexion...' : '🔓 OUVRIR LA CAISSE'}
              </button>
            </form>

            <p className="login-hint">
              {loginType === 'admin'
                ? 'Demo: admin / admin123'
                : 'Demandez vos identifiants au responsable'}
            </p>

            {loginType === 'admin' && (
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem' }}>
                <button
                  className="forgot-password-btn"
                  onClick={() => setShowForgotPassword(true)}
                >
                  Mot de passe oublié?
                </button>
                <button
                  className="forgot-password-btn"
                  onClick={() => setCurrentScreen?.('admin-registration')}
                >
                  S'inscrire
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            <form onSubmit={handleForgotPassword} className="login-form">
              <h3 style={{ marginTop: 0, textAlign: 'center' }}>Réinitialiser le mot de passe</h3>

              {!resetCode ? (
                <>
                  <div className="form-group">
                    <label htmlFor="forgot-username">Identifiant administrateur</label>
                    <input
                      id="forgot-username"
                      type="text"
                      value={forgotUsername}
                      onChange={(e) => setForgotUsername(e.target.value)}
                      placeholder="Votre identifiant"
                      disabled={forgotLoading}
                      required
                      autoFocus
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="forgot-whatsapp">Numéro WhatsApp</label>
                    <input
                      id="forgot-whatsapp"
                      type="tel"
                      value={forgotWhatsapp}
                      onChange={(e) => setForgotWhatsapp(e.target.value)}
                      placeholder="+221..."
                      disabled={forgotLoading}
                      required
                    />
                  </div>

                  {forgotError && <div className="error-message">{forgotError}</div>}

                  <button
                    type="submit"
                    className="login-btn"
                    disabled={forgotLoading}
                  >
                    {forgotLoading ? '⏳ Envoi...' : '📱 Recevoir le code'}
                  </button>
                </>
              ) : (
                <div className="success-section">
                  <p style={{ textAlign: 'center', fontSize: '0.95rem' }}>
                    ✅ Un code de réinitialisation a été envoyé sur votre WhatsApp:
                  </p>
                  <div className="reset-code-box">
                    <strong>{resetCode}</strong>
                  </div>
                  <p style={{ fontSize: '0.85rem', textAlign: 'center', color: '#666', marginTop: '1rem' }}>
                    Utilisez ce code pour réinitialiser votre mot de passe via votre administrateur système.
                  </p>
                </div>
              )}

              <button
                type="button"
                className="forgot-password-btn"
                onClick={() => {
                  setShowForgotPassword(false)
                  setForgotUsername('')
                  setForgotWhatsapp('')
                  setResetCode('')
                  setForgotError('')
                }}
                style={{ marginTop: '1rem' }}
              >
                ← Retour à la connexion
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
