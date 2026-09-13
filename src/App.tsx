import { useState, useEffect } from 'react'
import { CashierScreen } from './screens/CashierScreen'
import { SalesScreen } from './screens/SalesScreen'
import { ClientsScreen } from './screens/ClientsScreen'
import { CreditsScreen } from './screens/CreditsScreen'
import { DashboardScreen } from './screens/DashboardScreen'
import { ProductsScreen } from './screens/ProductsScreen'
import { CalculatorScreen } from './screens/CalculatorScreen'
import { LoginScreen } from './screens/LoginScreen'
import { AdminScreen } from './screens/AdminScreen'
import { InventoryScreen } from './screens/InventoryScreen'
import { FreeAmountsScreen } from './screens/FreeAmountsScreen'
import { getCurrentSession, logout as authLogout } from './services/authService'
import { logAction } from './services/auditService'
import { AuthContext } from './context/AuthContext'
import type { AuthSession } from './types'
import './App.css'

type Screen = 'cashier' | 'sales' | 'clients' | 'credits' | 'dashboard' | 'products' | 'calculator' | 'admin' | 'inventory' | 'free-amounts'

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('cashier')
  const [session, setSession] = useState<AuthSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const current = getCurrentSession()
    setSession(current)
    setLoading(false)
  }, [])

  const handleLogout = () => {
    if (session) {
      logAction(session.userId, session.username, session.role, 'LOGOUT')
    }
    authLogout()
    setSession(null)
    setCurrentScreen('cashier')
  }

  const handleLoginSuccess = () => {
    const current = getCurrentSession()
    setSession(current)
    setCurrentScreen(current?.role === 'ADMIN' ? 'admin' : 'cashier')
  }

  if (loading) {
    return <div className="loading-screen">⏳ Chargement...</div>
  }

  if (!session) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />
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
        return session.role === 'ADMIN' ? <AdminScreen session={session} /> : <CashierScreen />
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
            <div className="user-role">{menuOpen ? (session.role === 'ADMIN' ? '⚙️ Admin' : '💳 Caissier') : '📋 Menu'}</div>
            <div className="user-time">{new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Déconnexion">
            🚪
          </button>
        </div>

        <nav className="nav-menu">
          {session.role === 'ADMIN' && (
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
            <span className="nav-label">{session.role === 'ADMIN' ? 'Caisse (Admin)' : 'Caisse'}</span>
          </button>
          <button
            className={`nav-item ${currentScreen === 'sales' ? 'active' : ''}`}
            onClick={() => setCurrentScreen('sales')}
          >
            <span className="nav-icon">📋</span>
            <span className="nav-label">Ventes</span>
          </button>
          {session.role === 'ADMIN' && (
            <button
              className={`nav-item ${currentScreen === 'products' ? 'active' : ''}`}
              onClick={() => setCurrentScreen('products')}
            >
              <span className="nav-icon">🛍️</span>
              <span className="nav-label">Produits</span>
            </button>
          )}
          {session.role === 'ADMIN' && (
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
            <span className="nav-icon">📋</span>
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
