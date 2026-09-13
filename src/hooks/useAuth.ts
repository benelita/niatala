import { useState, useEffect } from 'react'
import type { AuthSession } from '../types'
import { login, logout, getCurrentSession, isAuthenticated } from '../services/authService'

export function useAuth() {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const current = getCurrentSession()
    setSession(current)
    setLoading(false)
  }, [])

  const handleLogin = (username: string, password: string): boolean => {
    const newSession = login(username, password)
    if (newSession) {
      setSession(newSession)
      return true
    }
    return false
  }

  const handleLogout = () => {
    logout()
    setSession(null)
  }

  return {
    session,
    loading,
    isAuthenticated: isAuthenticated(),
    login: handleLogin,
    logout: handleLogout,
  }
}
