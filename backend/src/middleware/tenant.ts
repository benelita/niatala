import { Response, NextFunction } from 'express'
import { AuthenticatedRequest } from './auth'

/**
 * Extended request with tenant context
 */
export interface TenantRequest extends AuthenticatedRequest {
  tenant?: {
    id: string
    readonly: boolean
  }
}

/**
 * Middleware to validate tenant access
 *
 * CRITICAL RULE: Tenant ID is determined from JWT token ONLY,
 * never from URL parameters or request body.
 *
 * - SUPER_ADMIN: Can access any tenant (read-only unless specified)
 * - ADMIN/CAISSIER: Can only access their own tenant
 */
export function tenantValidationMiddleware(
  req: TenantRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' })
    return
  }

  try {
    // Get requested tenant ID from URL parameter
    const requestedTenantId = req.params.tenantId

    if (!requestedTenantId) {
      // Some routes don't require tenant (like /auth/login)
      next()
      return
    }

    // SUPER_ADMIN: Can access any tenant
    if (req.user.role === 'SUPER_ADMIN') {
      req.tenant = {
        id: requestedTenantId,
        readonly: true, // SUPER_ADMIN is read-only by default
      }
      console.log(
        `[TENANT] SUPER_ADMIN ${req.user.username} accessing tenant ${requestedTenantId}`
      )
      next()
      return
    }

    // ADMIN/CAISSIER: Must match their own tenant
    if (req.user.tenantId !== requestedTenantId) {
      console.log(
        `[TENANT] Access denied: User ${req.user.username} tried to access tenant ${requestedTenantId} but belongs to ${req.user.tenantId}`
      )
      res.status(403).json({
        error: 'Cannot access other tenant',
        userTenant: req.user.tenantId,
        requestedTenant: requestedTenantId,
      })
      return
    }

    // User can access their own tenant
    req.tenant = {
      id: req.user.tenantId || '',
      readonly: false,
    }
    console.log(
      `[TENANT] User ${req.user.username} accessing own tenant ${requestedTenantId}`
    )
    next()
  } catch (error) {
    res.status(500).json({ error: 'Tenant validation failed' })
  }
}

/**
 * Middleware to check if user can modify tenant data
 * (SUPER_ADMIN is read-only by default)
 */
export function requireTenantWrite(
  req: TenantRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.tenant) {
    res.status(400).json({ error: 'Tenant context required' })
    return
  }

  if (req.tenant.readonly) {
    res.status(403).json({
      error: 'Cannot modify data for other tenants',
    })
    return
  }

  next()
}
