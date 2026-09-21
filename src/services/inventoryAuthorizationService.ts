import { getApiUrl } from './authService'

const API_URL = getApiUrl()

export interface InventoryAuthorization {
  id: string
  hasAccess: boolean
  authorization: {
    id: string
    expiresAt: string
    grantedBy: string
    grantedAt: string
  } | null
}

/**
 * Check if current user has inventory access
 */
export async function checkInventoryAccess(): Promise<InventoryAuthorization | null> {
  try {
    const response = await fetch(`${API_URL}/inventory-authorization/me`, {
      method: 'GET',
      credentials: 'include',
    })

    if (!response.ok) {
      console.error('[INVENTORY AUTH] Check failed:', response.status)
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('[INVENTORY AUTH] Check error:', error)
    return null
  }
}

/**
 * Get all active authorizations (admin only)
 */
export async function getActiveAuthorizations() {
  try {
    const response = await fetch(`${API_URL}/inventory-authorization/active`, {
      method: 'GET',
      credentials: 'include',
    })

    if (!response.ok) {
      console.error('[INVENTORY AUTH] Get active failed:', response.status)
      return null
    }

    const data = await response.json()
    return data.authorizations
  } catch (error) {
    console.error('[INVENTORY AUTH] Get active error:', error)
    return null
  }
}

/**
 * Grant inventory access to a cashier (admin only)
 */
export async function grantInventoryAccess(userId: string) {
  try {
    const response = await fetch(`${API_URL}/inventory-authorization/grant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ userId }),
    })

    if (!response.ok) {
      console.error('[INVENTORY AUTH] Grant failed:', response.status)
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('[INVENTORY AUTH] Grant error:', error)
    return null
  }
}

/**
 * Revoke inventory access (admin only)
 */
export async function revokeInventoryAccess(userId: string) {
  try {
    const response = await fetch(`${API_URL}/inventory-authorization/revoke`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ userId }),
    })

    if (!response.ok) {
      console.error('[INVENTORY AUTH] Revoke failed:', response.status)
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('[INVENTORY AUTH] Revoke error:', error)
    return null
  }
}

export function exportApiUrl() {
  return API_URL
}
