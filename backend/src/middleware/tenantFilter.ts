import { Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'

export interface AuthRequest extends Request {
  userId?: string
  tenantId?: string
  role?: string
}

export async function tenantFilterMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    // Get user from session (assuming you have user info in req)
    const userId = req.body.userId || (req as any).user?.id

    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { tenantId: true, role: true },
      })

      if (user) {
        req.tenantId = user.tenantId || undefined
        req.role = user.role
      }
    }

    next()
  } catch (err) {
    console.error('Tenant filter middleware error:', err)
    next()
  }
}

export function getTenantFilter(tenantId?: string) {
  if (!tenantId) {
    return {} // Super admin - no filter
  }
  return { tenantId }
}
