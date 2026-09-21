import { useState } from 'react'
import '../styles/AdminRegistrationScreen.css'

interface AdminRegistrationScreenProps {
  setCurrentScreen?: (screen: string) => void
}

export function AdminRegistrationScreen({ setCurrentScreen }: AdminRegistrationScreenProps) {
  const [step, setStep] = useState<'register' | 'verify'>('register')
  const [adminId, setAdminId] = useState('')

  // Step 1: Registration
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [registerError, setRegisterError] = useState('')
  const [registerLoading, setRegisterLoading] = useState(false)

  // Step 2: Verification
  const [authCode, setAuthCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [verifyError, setVerifyError] = useState('')
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [success, setSuccess] = useState('')

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setRegisterError('')
    setRegisterLoading(true)

    try {
      if (!firstName.trim() || !lastName.trim() || !whatsapp.trim()) {
        throw new Error('Tous les champs sont obligatoires')
      }

      const response = await fetch('/api/admin-registration/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          whatsapp: whatsapp.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'inscription')
      }

      setAdminId(data.adminId)
      setStep('verify')
      setSuccess('✅ Code d\'authentification envoyé sur WhatsApp!')
    } catch (err) {
      setRegisterError(err instanceof Error ? err.message : 'Erreur lors de l\'inscription')
    } finally {
      setRegisterLoading(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setVerifyError('')
    setVerifyLoading(true)

    try {
      if (!authCode.trim() || !password.trim() || !confirmPassword.trim()) {
        throw new Error('Tous les champs sont obligatoires')
      }

      if (password !== confirmPassword) {
        throw new Error('Les mots de passe ne correspondent pas')
      }

      if (password.length < 6) {
        throw new Error('Le mot de passe doit contenir au moins 6 caractères')
      }

      const response = await fetch('/api/admin-registration/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId,
          authCode: authCode.trim(),
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la vérification')
      }

      setSuccess('✅ Compte activé avec succès! Redirection...')
      setTimeout(() => {
        setCurrentScreen?.('cashier')
      }, 2000)
    } catch (err) {
      setVerifyError(err instanceof Error ? err.message : 'Erreur lors de la vérification')
    } finally {
      setVerifyLoading(false)
    }
  }

  return (
    <div className="admin-registration-screen">
      <div className="registration-container">
        <div className="registration-header">
          <h1>NIATALA</h1>
          <p className="registration-subtitle">Inscription Administrateur</p>
        </div>

        {step === 'register' ? (
          <form onSubmit={handleRegister} className="registration-form">
            <h2>📝 Créer votre compte administrateur</h2>

            <div className="form-group">
              <label>Prénom *</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Ex: Moussa"
                disabled={registerLoading}
                required
              />
            </div>

            <div className="form-group">
              <label>Nom *</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Ex: Diop"
                disabled={registerLoading}
                required
              />
            </div>

            <div className="form-group">
              <label>Numéro WhatsApp *</label>
              <input
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="Ex: +221781234567"
                disabled={registerLoading}
                required
              />
              <small>Format: +221 suivi de 9 chiffres</small>
            </div>

            {registerError && <div className="error-message">{registerError}</div>}

            <button
              type="submit"
              className="btn-primary"
              disabled={registerLoading}
            >
              {registerLoading ? '⏳ Inscription...' : '📱 Recevoir le code'}
            </button>

            <p className="back-link">
              Déjà inscrit? <button
                type="button"
                onClick={() => setCurrentScreen?.('cashier')}
                style={{ background: 'none', border: 'none', color: 'var(--accent)', textDecoration: 'underline', cursor: 'pointer', fontWeight: 600 }}
              >
                Se connecter
              </button>
            </p>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="verification-form">
            <h2>🔐 Vérifier votre code</h2>

            <div style={{
              background: '#e0f2fe',
              border: '1px solid #0284c7',
              borderRadius: '0.5rem',
              padding: '1rem',
              marginBottom: '1.5rem',
              color: '#0c4a6e',
              fontSize: '0.9rem'
            }}>
              ✅ Un code a été envoyé sur votre WhatsApp
            </div>

            <div className="form-group">
              <label>Code d'authentification (6 chiffres) *</label>
              <input
                type="text"
                value={authCode}
                onChange={(e) => setAuthCode(e.target.value.slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                disabled={verifyLoading}
                required
              />
            </div>

            <div className="form-group">
              <label>Mot de passe *</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={verifyLoading}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Confirmer le mot de passe *</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                disabled={verifyLoading}
                required
              />
            </div>

            {verifyError && <div className="error-message">{verifyError}</div>}
            {success && <div className="success-message">{success}</div>}

            <button
              type="submit"
              className="btn-primary"
              disabled={verifyLoading}
            >
              {verifyLoading ? '⏳ Vérification...' : '✅ Activer le compte'}
            </button>

            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setStep('register')
                setAuthCode('')
                setPassword('')
                setConfirmPassword('')
                setVerifyError('')
              }}
              disabled={verifyLoading}
            >
              ← Retour
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
