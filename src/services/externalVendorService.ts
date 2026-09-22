import { getApiUrl } from './authService'

const API_URL = getApiUrl()

export interface ExternalVendor {
  id: string
  name: string
  phone: string
  totalSales: number
  totalPaid: number
  balance: number
  status: string
}

export interface VendorSale {
  id: string
  saleNumber: string
  amount: number
  description?: string
  recordedAt: string
}

export interface VendorPayment {
  id: string
  amount: number
  paymentMethod: string
  paymentReference?: string
  createdAt: string
}

/**
 * Get all vendors for current tenant
 */
export async function getVendors() {
  try {
    const response = await fetch(`${API_URL}/external-vendors`, {
      method: 'GET',
      credentials: 'include',
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return data.vendors
  } catch (error) {
    return null
  }
}

/**
 * Get vendor statistics
 */
export async function getStats() {
  try {
    const response = await fetch(`${API_URL}/external-vendors/stats`, {
      method: 'GET',
      credentials: 'include',
    })

    if (!response.ok) {
      return null
    }

    return await response.json()
  } catch (error) {
    return null
  }
}

/**
 * Get vendor details
 */
export async function getVendor(vendorId: string) {
  try {
    const response = await fetch(`${API_URL}/external-vendors/${vendorId}`, {
      method: 'GET',
      credentials: 'include',
    })

    if (!response.ok) {
      return null
    }

    return await response.json()
  } catch (error) {
    return null
  }
}

/**
 * Record a sale from external vendor
 */
export async function recordSale(vendorName: string, vendorPhone: string, amount: number, description?: string) {
  try {
    const response = await fetch(`${API_URL}/external-vendors/sales`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        vendorName,
        vendorPhone,
        amount,
        description,
      }),
    })

    if (!response.ok) {
      return null
    }

    return await response.json()
  } catch (error) {
    return null
  }
}

/**
 * Record payment to vendor
 */
export async function recordPayment(
  vendorId: string,
  amount: number,
  paymentMethod: string,
  paymentReference?: string,
  notes?: string
) {
  try {
    const response = await fetch(`${API_URL}/external-vendors/${vendorId}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        amount,
        paymentMethod,
        paymentReference,
        notes,
      }),
    })

    if (!response.ok) {
      return null
    }

    return await response.json()
  } catch (error) {
    return null
  }
}

/**
 * Get vendor sales
 */
export async function getVendorSales(vendorId: string) {
  try {
    const response = await fetch(`${API_URL}/external-vendors/${vendorId}/sales`, {
      method: 'GET',
      credentials: 'include',
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return data.sales
  } catch (error) {
    return null
  }
}

/**
 * Get vendor payments
 */
export async function getVendorPayments(vendorId: string) {
  try {
    const response = await fetch(`${API_URL}/external-vendors/${vendorId}/payments`, {
      method: 'GET',
      credentials: 'include',
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return data.payments
  } catch (error) {
    return null
  }
}
