import { useState, useEffect } from 'react'
import type { AuthSession } from '../types'
import { login, logout, getCurrentUser } from '../services/authService'

export function useAuth() {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initSession = async () => {
      const current = await getCurrentUser()
      setSession(current)
      setLoading(false)
    }
    initSession()
  }, [])

  const handleLogin = async (username: string, password: string): Promise<boolean> => {
    const newSession = await login(username, password)
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
    isAuthenticated: !!session,
    login: handleLogin,
    logout: handleLogout,
  }
}
