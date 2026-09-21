import type { UserRole } from '../types'

export type Permission =
  | 'MANAGE_PRODUCTS'
  | 'CHANGE_PRICES'
  | 'VIEW_ALL_SALES'
  | 'VIEW_AUDIT'
  | 'MANAGE_CASHIERS'
  | 'REFUND_SALE'
  | 'MANAGE_SETTINGS'
  | 'VIEW_DASHBOARD'
  | 'CREATE_SALE'
  | 'CANCEL_SALE'
  | 'VIEW_OWN_SALES'
  | 'MANAGE_CUSTOMER_CREDIT'

const PERMISSIONS: Record<UserRole, Permission[]> = {
  SUPER_ADMIN: [
    'MANAGE_PRODUCTS',
    'CHANGE_PRICES',
    'VIEW_ALL_SALES',
    'VIEW_AUDIT',
    'MANAGE_CASHIERS',
    'REFUND_SALE',
    'MANAGE_SETTINGS',
    'VIEW_DASHBOARD',
    'CREATE_SALE',
    'CANCEL_SALE',
    'VIEW_OWN_SALES',
    'MANAGE_CUSTOMER_CREDIT',
  ],
  ADMIN: [
    'MANAGE_PRODUCTS',
    'CHANGE_PRICES',
    'VIEW_ALL_SALES',
    'VIEW_AUDIT',
    'MANAGE_CASHIERS',
    'REFUND_SALE',
    'MANAGE_SETTINGS',
    'VIEW_DASHBOARD',
    'CREATE_SALE',
    'CANCEL_SALE',
    'VIEW_OWN_SALES',
    'MANAGE_CUSTOMER_CREDIT',
  ],
  CASHIER: [
    'CREATE_SALE',
    'CANCEL_SALE',
    'VIEW_OWN_SALES',
    'MANAGE_CUSTOMER_CREDIT',
  ],
}

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return PERMISSIONS[role]?.includes(permission) ?? false
}

export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some(p => hasPermission(role, p))
}

export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every(p => hasPermission(role, p))
}

export function getPermissions(role: UserRole): Permission[] {
  return PERMISSIONS[role] ?? []
}
