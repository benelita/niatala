import { useState, useEffect } from 'react'
import { checkInventoryAccess, getActiveAuthorizations } from '../services/inventoryAuthorizationService'

export interface InventoryAuth {
  expiresAt: string
  grantedAt: string
}

export function useInventoryAuthorization() {
  const [hasAccess, setHasAccess] = useState(false)
  const [authorization, setAuthorization] = useState<InventoryAuth | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAccess = async () => {
      const result = await checkInventoryAccess()
      if (result) {
        setHasAccess(result.hasAccess)
        if (result.authorization) {
          setAuthorization({
            expiresAt: result.authorization.expiresAt,
            grantedAt: result.authorization.grantedAt,
          })
        }
      }
      setLoading(false)
    }

    checkAccess()
  }, [])

  const getTimeRemaining = () => {
    if (!authorization) return null
    const expiry = new Date(authorization.expiresAt).getTime()
    const now = Date.now()
    const remaining = expiry - now

    if (remaining <= 0) return null

    const hours = Math.floor(remaining / (1000 * 60 * 60))
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))

    return { hours, minutes }
  }

  return {
    hasAccess,
    authorization,
    loading,
    getTimeRemaining,
  }
}

export function useActiveAuthorizations() {
  const [authorizations, setAuthorizations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAuthorizations = async () => {
      const result = await getActiveAuthorizations()
      setAuthorizations(result || [])
      setLoading(false)
    }

    fetchAuthorizations()
  }, [])

  const refresh = async () => {
    setLoading(true)
    const result = await getActiveAuthorizations()
    setAuthorizations(result || [])
    setLoading(false)
  }

  return {
    authorizations,
    loading,
    refresh,
  }
}
