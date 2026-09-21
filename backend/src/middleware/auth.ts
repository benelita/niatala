import { Request, Response, NextFunction } from 'express'
import { verifyToken, hashToken } from '../utils/jwt'
import { verifySession } from '../services/authService'

/**
 * Extended Express Request with auth user info
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    username: string
    role: 'SUPER_ADMIN' | 'ADMIN' | 'CASHIER'
    tenantId?: string | null
  }
  tokenHash?: string
}

/**
 * Middleware to validate JWT token from httpOnly cookie
 */
export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Get token from httpOnly cookie (set by server)
    const token = req.cookies?.auth_token

    if (!token) {
      console.log('[AUTH MIDDLEWARE] No token found in cookies')
      res.status(401).json({ error: 'No authentication token' })
      return
    }

    // Verify token signature
    const decoded = verifyToken(token)
    if (!decoded) {
      console.log('[AUTH MIDDLEWARE] Token verification failed')
      res.status(401).json({ error: 'Invalid or expired token' })
      return
    }

    // Verify session exists and is not revoked
    const tokenHash = hashToken(token)
    const userId = await verifySession(tokenHash)
    if (!userId) {
      console.log('[AUTH MIDDLEWARE] Session verification failed')
      res.status(401).json({ error: 'Session invalid or revoked' })
      return
    }

    // Attach user to request
    req.user = {
      id: decoded.userId,
      username: decoded.username,
      role: decoded.role,
      tenantId: decoded.tenantId,
    }
    req.tokenHash = tokenHash

    console.log(`[AUTH MIDDLEWARE] User authenticated: ${decoded.username}`)
    next()
  } catch (error) {
    console.error('[AUTH MIDDLEWARE] Error:', error)
    res.status(401).json({ error: 'Authentication failed' })
  }
}

/**
 * Middleware to check if user is SUPER_ADMIN
 */
export function requireSuperAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' })
    return
  }

  if (req.user.role !== 'SUPER_ADMIN') {
    console.log(`[AUTH] Access denied: ${req.user.username} is not SUPER_ADMIN`)
    res.status(403).json({ error: 'SUPER_ADMIN role required' })
    return
  }

  next()
}

/**
 * Middleware to check if user is ADMIN or above
 */
export function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' })
    return
  }

  if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
    console.log(`[AUTH] Access denied: ${req.user.username} is not ADMIN`)
    res.status(403).json({ error: 'ADMIN role required' })
    return
  }

  next()
}
