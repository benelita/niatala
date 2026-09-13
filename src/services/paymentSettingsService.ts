import type { UserPaymentSettings, PaymentMethodType } from '../types'

const PAYMENT_SETTINGS_KEY = 'niatala_payment_settings'

function getPaymentSettings(): UserPaymentSettings[] {
  try {
    const data = localStorage.getItem(PAYMENT_SETTINGS_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

function savePaymentSettings(settings: UserPaymentSettings[]) {
  localStorage.setItem(PAYMENT_SETTINGS_KEY, JSON.stringify(settings))
}

function getDefaultSettings(userId: string): UserPaymentSettings {
  return {
    userId,
    enabledMethods: ['cash', 'wave', 'orange_money', 'free', 'card'],
    waveConnected: false,
    orangeMoneyConnected: false,
    freeConnected: false,
    cardEnabled: false,
    updatedAt: Date.now(),
  }
}

export function getPaymentSettingsForUser(userId: string): UserPaymentSettings {
  const settings = getPaymentSettings()
  const userSettings = settings.find(s => s.userId === userId)
  return userSettings || getDefaultSettings(userId)
}

export function updatePaymentSettings(userId: string, settings: Partial<UserPaymentSettings>): UserPaymentSettings {
  const allSettings = getPaymentSettings()
  const index = allSettings.findIndex(s => s.userId === userId)

  let updated: UserPaymentSettings
  if (index >= 0) {
    updated = { ...allSettings[index], ...settings, userId, updatedAt: Date.now() }
    allSettings[index] = updated
  } else {
    updated = { ...getDefaultSettings(userId), ...settings, updatedAt: Date.now() }
    allSettings.push(updated)
  }

  savePaymentSettings(allSettings)
  return updated
}

export function enablePaymentMethod(userId: string, method: PaymentMethodType): UserPaymentSettings {
  const settings = getPaymentSettingsForUser(userId)
  if (!settings.enabledMethods.includes(method)) {
    settings.enabledMethods.push(method)
  }
  return updatePaymentSettings(userId, settings)
}

export function disablePaymentMethod(userId: string, method: PaymentMethodType): UserPaymentSettings {
  const settings = getPaymentSettingsForUser(userId)
  settings.enabledMethods = settings.enabledMethods.filter(m => m !== method)
  return updatePaymentSettings(userId, settings)
}

export function isPaymentMethodEnabled(userId: string, method: PaymentMethodType): boolean {
  const settings = getPaymentSettingsForUser(userId)
  return settings.enabledMethods.includes(method)
}

export function getEnabledPaymentMethods(userId: string): PaymentMethodType[] {
  const settings = getPaymentSettingsForUser(userId)
  return settings.enabledMethods
}

export function setWaveConnected(userId: string, connected: boolean): UserPaymentSettings {
  return updatePaymentSettings(userId, { waveConnected: connected })
}

export function setOrangeMoneyConnected(userId: string, connected: boolean): UserPaymentSettings {
  return updatePaymentSettings(userId, { orangeMoneyConnected: connected })
}

export function setFreeConnected(userId: string, connected: boolean): UserPaymentSettings {
  return updatePaymentSettings(userId, { freeConnected: connected })
}

export function setCardEnabled(userId: string, enabled: boolean): UserPaymentSettings {
  return updatePaymentSettings(userId, { cardEnabled: enabled })
}
