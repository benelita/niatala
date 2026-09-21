import { useState, useEffect } from 'react'
import { CashierScreen } from './screens/CashierScreen'
import { SalesScreen } from './screens/SalesScreen'
import { ClientsScreen } from './screens/ClientsScreen'
import { CreditsScreen } from './screens/CreditsScreen'
import { DashboardScreen } from './screens/DashboardScreen'
import { ProductsScreen } from './screens/ProductsScreen'
import { CalculatorScreen } from './screens/CalculatorScreen'
import { LoginScreen } from './screens/LoginScreen'
import { AdminRegistrationScreen } from './screens/AdminRegistrationScreen'
import { AdminScreen } from './screens/AdminScreen'
import { InventoryScreen } from './screens/InventoryScreen'
import { FreeAmountsScreen } from './screens/FreeAmountsScreen'
import { getCurrentUser, logout as authLogout } from './services/authService'
import { logAction } from './services/auditService'
import { AuthContext } from './context/AuthContext'
import type { AuthSession } from './types'
import './App.css'

type Screen = 'cashier' | 'sales' | 'clients' | 'credits' | 'dashboard' | 'products' | 'calculator' | 'admin' | 'inventory' | 'free-amounts' | 'admin-registration'

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('cashier')
  const [session, setSession] = useState<AuthSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const [zoom, setZoom] = useState(() => {
    try {
      return parseFloat(localStorage.getItem('app_zoom') || '100')
    } catch {
      return 100
    }
  })

  useEffect(() => {
    const verifySession = async () => {
      const current = await getCurrentUser()
      setSession(current)
      setLoading(false)
    }
    verifySession()
  }, [])

  // Apply zoom to document
  useEffect(() => {
    document.documentElement.style.fontSize = `${(zoom / 100) * 16}px`
    localStorage.setItem('app_zoom', zoom.toString())
  }, [zoom])

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 10, 150))
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 10, 70))
  const handleZoomReset = () => setZoom(100)

  const handleLogout = () => {
    if (session) {
      logAction(session.userId, session.username, session.role, 'LOGOUT')
    }
    authLogout()
    setSession(null)
    setCurrentScreen('cashier')
  }

  const handleLoginSuccess = async () => {
    const current = await getCurrentUser()
    setSession(current)
    setCurrentScreen((current?.role === 'ADMIN' || current?.role === 'SUPER_ADMIN') ? 'admin' : 'cashier')
  }

  if (loading) {
    return <div className="loading-screen">⏳ Chargement...</div>
  }

  if (currentScreen === 'admin-registration') {
    return <AdminRegistrationScreen setCurrentScreen={setCurrentScreen as any} />
  }

  if (!session) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} setCurrentScreen={setCurrentScreen as any} />
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case 'cashier':
        return <CashierScreen />
      case 'sales':
        return <SalesScreen />
      case 'clients':
        return <ClientsScreen />
      case 'credits':
        return <CreditsScreen />
      case 'products':
        return <ProductsScreen />
      case 'inventory':
        return <InventoryScreen />
      case 'dashboard':
        return <DashboardScreen />
      case 'calculator':
        return <CalculatorScreen />
      case 'free-amounts':
        return <FreeAmountsScreen />
      case 'admin':
        return (session.role === 'ADMIN' || session.role === 'SUPER_ADMIN') ? <AdminScreen session={session} /> : <CashierScreen />
      default:
        return <CashierScreen />
    }
  }

  return (
    <AuthContext.Provider value={{ session }}>
      <div className="app-container">
      <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="user-info" onClick={() => setMenuOpen(!menuOpen)} style={{ cursor: 'pointer' }}>
            <div className="user-name">{session.name}</div>
            <div className="user-role">{menuOpen ? ((session.role === 'ADMIN' || session.role === 'SUPER_ADMIN') ? '⚙️ Admin' : '💳 Caissier') : '📋 Menu'}</div>
            <div className="user-time">{new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
          </div>
          <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
            <button
              onClick={handleZoomOut}
              title="Réduire (Ctrl+Minus)"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1.2rem',
                padding: '0.25rem',
              }}
            >
              🔍−
            </button>
            <span style={{ fontSize: '0.75rem', minWidth: '2.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              {Math.round(zoom)}%
            </span>
            <button
              onClick={handleZoomIn}
              title="Agrandir (Ctrl+Plus)"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1.2rem',
                padding: '0.25rem',
              }}
            >
              🔍+
            </button>
            <button
              onClick={handleZoomReset}
              title="Réinitialiser (Ctrl+0)"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.8rem',
                padding: '0.25rem 0.5rem',
              }}
            >
              ↺
            </button>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Déconnexion">
            🚪
          </button>
        </div>

        <nav className="nav-menu">
          {(session.role === 'ADMIN' || session.role === 'SUPER_ADMIN') && (
            <button
              className={`nav-item ${currentScreen === 'admin' ? 'active' : ''}`}
              onClick={() => setCurrentScreen('admin')}
            >
              <span className="nav-icon">⚙️</span>
              <span className="nav-label">Administration</span>
            </button>
          )}
          <button
            className={`nav-item ${currentScreen === 'cashier' ? 'active' : ''}`}
            onClick={() => setCurrentScreen('cashier')}
          >
            <span className="nav-icon">💳</span>
            <span className="nav-label">{(session.role === 'ADMIN' || session.role === 'SUPER_ADMIN') ? 'Caisse (Admin)' : 'Caisse'}</span>
          </button>
          <button
            className={`nav-item ${currentScreen === 'sales' ? 'active' : ''}`}
            onClick={() => setCurrentScreen('sales')}
          >
            <span className="nav-icon">📋</span>
            <span className="nav-label">Ventes</span>
          </button>
          {(session.role === 'ADMIN' || session.role === 'SUPER_ADMIN') && (
            <button
              className={`nav-item ${currentScreen === 'products' ? 'active' : ''}`}
              onClick={() => setCurrentScreen('products')}
            >
              <span className="nav-icon">🛍️</span>
              <span className="nav-label">Produits</span>
            </button>
          )}
          {(session.role === 'ADMIN' || session.role === 'SUPER_ADMIN') && (
            <button
              className={`nav-item ${currentScreen === 'inventory' ? 'active' : ''}`}
              onClick={() => setCurrentScreen('inventory')}
            >
              <span className="nav-icon">📦</span>
              <span className="nav-label">Stocks</span>
            </button>
          )}
          <button
            className={`nav-item ${currentScreen === 'clients' ? 'active' : ''}`}
            onClick={() => setCurrentScreen('clients')}
          >
            <span className="nav-icon">👤</span>
            <span className="nav-label">Clients</span>
          </button>
          <button
            className={`nav-item ${currentScreen === 'credits' ? 'active' : ''}`}
            onClick={() => setCurrentScreen('credits')}
          >
            <span className="nav-icon">💰</span>
            <span className="nav-label">Crédits</span>
          </button>
          <button
            className={`nav-item ${currentScreen === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentScreen('dashboard')}
          >
            <span className="nav-icon">📈</span>
            <span className="nav-label">Tableau de bord</span>
          </button>
          <button
            className={`nav-item ${currentScreen === 'free-amounts' ? 'active' : ''}`}
            onClick={() => setCurrentScreen('free-amounts')}
          >
            <span className="nav-icon">💵</span>
            <span className="nav-label">Sommes libres</span>
          </button>
          <button
            className={`nav-item ${currentScreen === 'calculator' ? 'active' : ''}`}
            onClick={() => setCurrentScreen('calculator')}
          >
            <span className="nav-icon">🔢</span>
            <span className="nav-label">Calculatrice</span>
          </button>
        </nav>
      </aside>

      <main className="main-content">
        {renderScreen()}
      </main>
    </div>
    </AuthContext.Provider>
  )
}

export default App
