import { useState } from 'react'
import { login, logout } from '../services/authService'
import { logAction } from '../services/auditService'
import '../styles/LoginScreen.css'

interface LoginScreenProps {
  onLoginSuccess: () => void
}

export function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [loginType, setLoginType] = useState<'admin' | 'cashier'>('cashier')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const session = login(username, password)

      if (!session) {
        setError('Identifiant ou mot de passe incorrect')
        setIsLoading(false)
        return
      }

      if (loginType === 'admin' && session.role !== 'ADMIN') {
        setError('Accès administrateur requis')
        logout()
        setIsLoading(false)
        return
      }

      if (loginType === 'cashier' && session.role !== 'CASHIER') {
        setError('Accès caissier requis')
        logout()
        setIsLoading(false)
        return
      }

      logAction(session.userId, session.username, session.role, 'LOGIN')
      onLoginSuccess()
    } catch (err) {
      setError('Une erreur est survenue')
    } finally {
      setIsLoading(false)
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

          <div className="form-group">
            <label htmlFor="password">Mot de passe</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={isLoading}
              required
            />
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
      </div>
    </div>
  )
}
