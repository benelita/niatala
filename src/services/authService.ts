import type { User, AuthSession } from '../types'

// Simple hash function for demo (NOT secure for production)
function hashPassword(password: string): string {
  let hash = 0
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36)
}

function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash
}

const USERS_KEY = 'niatala_users'
const SESSION_KEY = 'niatala_session'

// Initialize with default admin user
function initializeDefaultUsers() {
  const stored = localStorage.getItem(USERS_KEY)
  if (!stored) {
    const defaultUsers: User[] = [
      {
        id: 'admin_001',
        name: 'Administrateur',
        username: 'admin',
        passwordHash: hashPassword('admin123'),
        role: 'ADMIN',
        status: 'ACTIVE',
        createdAt: Date.now(),
      },
    ]
    localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers))
  }
}

export function getUsers(): User[] {
  initializeDefaultUsers()
  const stored = localStorage.getItem(USERS_KEY)
  return stored ? JSON.parse(stored) : []
}

export function createUser(name: string, username: string, password: string, role: 'ADMIN' | 'CASHIER'): User {
  const users = getUsers()

  if (users.some(u => u.username === username)) {
    throw new Error('Username already exists')
  }

  const newUser: User = {
    id: `user_${Date.now()}`,
    name,
    username,
    passwordHash: hashPassword(password),
    role,
    status: 'ACTIVE',
    createdAt: Date.now(),
  }

  users.push(newUser)
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
  return newUser
}

export function login(username: string, password: string): AuthSession | null {
  const users = getUsers()
  const user = users.find(u => u.username === username)

  if (!user || user.status === 'DISABLED') {
    return null
  }

  if (!verifyPassword(password, user.passwordHash)) {
    return null
  }

  // Update last login
  user.lastLogin = Date.now()
  localStorage.setItem(USERS_KEY, JSON.stringify(users))

  const session: AuthSession = {
    userId: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    loginTime: Date.now(),
  }

  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  return session
}

export function logout(): void {
  localStorage.removeItem(SESSION_KEY)
}

export function getCurrentSession(): AuthSession | null {
  const stored = localStorage.getItem(SESSION_KEY)
  return stored ? JSON.parse(stored) : null
}

export function isAuthenticated(): boolean {
  return getCurrentSession() !== null
}

export function updateUserStatus(userId: string, status: 'ACTIVE' | 'DISABLED'): void {
  const users = getUsers()
  const user = users.find(u => u.id === userId)
  if (user) {
    user.status = status
    localStorage.setItem(USERS_KEY, JSON.stringify(users))
  }
}

export function changePassword(userId: string, oldPassword: string, newPassword: string): boolean {
  const users = getUsers()
  const user = users.find(u => u.id === userId)

  if (!user || !verifyPassword(oldPassword, user.passwordHash)) {
    return false
  }

  user.passwordHash = hashPassword(newPassword)
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
  return true
}
