import jwt from 'jsonwebtoken'
import { createHash } from 'crypto'

export interface JwtPayload {
  userId: string
  username: string
  role: 'SUPER_ADMIN' | 'ADMIN' | 'CASHIER'
  tenantId?: string | null
  iat?: number
  exp?: number
}

const JWT_SECRET: string = process.env.JWT_SECRET || 'default_secret_change_in_production'
const JWT_EXPIRY: string = process.env.JWT_EXPIRY || '24h'

/**
 * Sign a JWT token
 */
export function signToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRY as any,
  })
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
    return decoded
  } catch (error) {
    return null
  }
}

/**
 * Hash a token for storage in database
 * We don't store the full JWT, only its hash
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

/**
 * Decode without verification (for reading expired tokens in logout)
 */
export function decodeToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.decode(token) as JwtPayload | null
    return decoded
  } catch (error) {
    return null
  }
}
