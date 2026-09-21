/**
 * Authentication and Authorization Types
 */

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'CASHIER'
export type UserStatus = 'ACTIVE' | 'DISABLED' | 'SUSPENDED'
export type TenantStatus = 'ACTIVE' | 'SUSPENDED' | 'DELETED'

export interface AuthPayload {
  userId: string
  username: string
  role: UserRole
  tenantId?: string | null
}

export interface AuthenticatedUser {
  id: string
  username: string
  name: string
  role: UserRole
  tenantId?: string | null
}

export interface TenantContext {
  id: string
  readonly: boolean
}
