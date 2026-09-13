import type { PaymentAccount, PaymentAccountType, PaymentProvider2 } from '../types'

const PAYMENT_ACCOUNTS_KEY = 'niatala_payment_accounts'

function getPaymentAccounts(): PaymentAccount[] {
  try {
    const data = localStorage.getItem(PAYMENT_ACCOUNTS_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

function savePaymentAccounts(accounts: PaymentAccount[]) {
  localStorage.setItem(PAYMENT_ACCOUNTS_KEY, JSON.stringify(accounts))
}

export function createPaymentAccount(
  provider: PaymentProvider2,
  accountType: PaymentAccountType,
  phone?: string,
  businessId?: string,
  businessName?: string,
  displayName?: string
): PaymentAccount {
  const account: PaymentAccount = {
    id: `ACC-${provider}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    provider,
    accountType,
    phone,
    businessId,
    businessName,
    displayName: displayName || (accountType === 'PERSONAL' ? `${provider} Personnel` : `${provider} Business`),
    status: accountType === 'PERSONAL' ? 'CONFIGURED' : 'DISCONNECTED',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }

  const accounts = getPaymentAccounts()
  accounts.push(account)
  savePaymentAccounts(accounts)

  return account
}

export function getPaymentAccountById(id: string): PaymentAccount | null {
  return getPaymentAccounts().find(a => a.id === id) || null
}

export function getPaymentAccountsByProvider(provider: PaymentProvider2): PaymentAccount[] {
  return getPaymentAccounts().filter(a => a.provider === provider)
}

export function getPersonalPaymentAccount(provider: PaymentProvider2): PaymentAccount | null {
  return getPaymentAccounts().find(a => a.provider === provider && a.accountType === 'PERSONAL') || null
}

export function getBusinessPaymentAccount(provider: PaymentProvider2): PaymentAccount | null {
  return getPaymentAccounts().find(a => a.provider === provider && a.accountType === 'BUSINESS') || null
}

export function updatePaymentAccount(id: string, updates: Partial<PaymentAccount>): PaymentAccount | null {
  const accounts = getPaymentAccounts()
  const index = accounts.findIndex(a => a.id === id)

  if (index === -1) return null

  const updated = {
    ...accounts[index],
    ...updates,
    id: accounts[index].id,
    provider: accounts[index].provider,
    accountType: accounts[index].accountType,
    createdAt: accounts[index].createdAt,
    updatedAt: Date.now(),
  }

  accounts[index] = updated
  savePaymentAccounts(accounts)

  return updated
}

export function updatePaymentAccountStatus(
  id: string,
  status: 'CONFIGURED' | 'CONNECTED' | 'DISCONNECTED'
): PaymentAccount | null {
  return updatePaymentAccount(id, { status, updatedAt: Date.now() })
}

export function deletePaymentAccount(id: string): boolean {
  const accounts = getPaymentAccounts()
  const filtered = accounts.filter(a => a.id !== id)

  if (filtered.length < accounts.length) {
    savePaymentAccounts(filtered)
    return true
  }

  return false
}

export function updatePersonalPhoneNumber(provider: PaymentProvider2, phone: string): PaymentAccount | null {
  const account = getPersonalPaymentAccount(provider)
  if (!account) return null

  return updatePaymentAccount(account.id, {
    phone,
    status: 'CONFIGURED',
  })
}

export function getAllConfiguredAccounts(): PaymentAccount[] {
  return getPaymentAccounts().filter(a => a.status !== 'DISCONNECTED')
}
