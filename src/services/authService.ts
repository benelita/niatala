/**
 * Frontend Auth Service
 * Communicates with backend API for authentication
 * Uses httpOnly cookies for session persistence
 */

import type { AuthSession } from '../types'

// Auto-detect API URL based on current host
export const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }
  // Use current hostname (works for localhost AND IP addresses)
  const host = window.location.hostname
  const port = 3001
  return `http://${host}:${port}/api`
}

const API_URL = getApiUrl()

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  user: {
    id: string
    username: string
    name: string
    role: string
    tenantId?: string | null
  }
  message: string
}

export interface CurrentUserResponse {
  user: {
    id: string
    username: string
    name: string
    role: string
    tenantId?: string | null
  }
}

/**
 * Login user via backend API
 * Backend returns httpOnly cookie with session
 */
export async function login(username: string, password: string): Promise<AuthSession | null> {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies
      body: JSON.stringify({ username, password }),
    })

    if (!response.ok) {
      return null
    }

    const data: LoginResponse = await response.json()

    // Backend sets httpOnly cookie automatically
    // We just need to return the session info
    const session: AuthSession = {
      userId: data.user.id,
      username: data.user.username,
      name: data.user.name,
      role: data.user.role as 'SUPER_ADMIN' | 'ADMIN' | 'CASHIER',
      tenantId: data.user.tenantId,
      loginTime: Date.now(),
    }

    // Store in localStorage for quick access (NOT source of truth)
    localStorage.setItem('niatala_session', JSON.stringify(session))

    return session
  } catch (error) {
    return null
  }
}

/**
 * Logout user via backend API
 * Revokes session on server
 */
export async function logout(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include', // Include cookies
    })

    // Clear local session regardless of response
    localStorage.removeItem('niatala_session')

    if (!response.ok) {
    }

    return true
  } catch (error) {
    // Still clear local session
    localStorage.removeItem('niatala_session')
    return false
  }
}

/**
 * Get current authenticated user from backend
 * Verifies session is still valid
 */
export async function getCurrentUser(): Promise<AuthSession | null> {
  try {
    const response = await fetch(`${API_URL}/auth/me`, {
      method: 'GET',
      credentials: 'include', // Include cookies
    })

    if (response.status === 401) {
      // Session expired or invalid
      localStorage.removeItem('niatala_session')
      return null
    }

    if (!response.ok) {
      return null
    }

    const data: CurrentUserResponse = await response.json()

    const session: AuthSession = {
      userId: data.user.id,
      username: data.user.username,
      name: data.user.name,
      role: data.user.role as 'SUPER_ADMIN' | 'ADMIN' | 'CASHIER',
      tenantId: data.user.tenantId,
      loginTime: Date.now(),
    }

    // Update localStorage cache
    localStorage.setItem('niatala_session', JSON.stringify(session))

    return session
  } catch (error) {
    return null
  }
}

/**
 * Get cached session from localStorage
 * Use getCurrentUser() to verify with server
 */
export function getCachedSession(): AuthSession | null {
  try {
    const stored = localStorage.getItem('niatala_session')
    return stored ? JSON.parse(stored) : null
  } catch (error) {
    return null
  }
}

/**
 * Check if user is authenticated (cached check)
 * Does NOT verify with server - use getCurrentUser() for that
 */
export function isAuthenticated(): boolean {
  return !!getCachedSession()
}

export interface User {
  id: string
  username: string
  name: string
  role: 'SUPER_ADMIN' | 'ADMIN' | 'CASHIER'
  status: 'ACTIVE' | 'DISABLED'
  tenantId?: string | null
  createdAt?: string
}

/**
 * Get all users
 */
export function getUsers(): User[] {
  try {
    const stored = localStorage.getItem('niatala_users')
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    return []
  }
}

/**
 * Create a new user via backend API
 */
export async function createUser(
  name: string,
  username: string,
  password: string,
  role: 'SUPER_ADMIN' | 'ADMIN' | 'CASHIER'
): Promise<User | null> {
  try {
    const response = await fetch(`${API_URL}/auth/create-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ name, username, password, role }),
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    const newUser = data.user

    // Add new user to localStorage
    const users = getUsers()
    const userWithStatus: User = {
      ...newUser,
      status: 'ACTIVE',
    }
    users.push(userWithStatus)
    localStorage.setItem('niatala_users', JSON.stringify(users))

    return newUser
  } catch (error) {
    throw error
  }
}

/**
 * Update user status
 */
export function updateUserStatus(userId: string, status: 'ACTIVE' | 'DISABLED'): boolean {
  try {
    const users = getUsers()
    const userIndex = users.findIndex(u => u.id === userId)

    if (userIndex !== -1) {
      users[userIndex].status = status
      localStorage.setItem('niatala_users', JSON.stringify(users))
      return true
    }
    return false
  } catch (error) {
    return false
  }
}
