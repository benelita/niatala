import { createContext, useContext } from 'react'
import type { AuthSession } from '../types'

interface AuthContextType {
  session: AuthSession | null
}

export const AuthContext = createContext<AuthContextType>({ session: null })

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider')
  }
  return context
}
