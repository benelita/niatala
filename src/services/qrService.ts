import type { QRCodeData, PaymentProvider2, PaymentAccountType } from '../types'

// QR CODE SERVICE
// Gère l'affichage et le scanning de QR codes
// Ne prétend jamais que le paiement est confirmé avant une vraie confirmation

export function generateQRData(
  provider: PaymentProvider2,
  type: PaymentAccountType,
  phone?: string,
  businessId?: string,
  businessName?: string,
  amount?: number
): QRCodeData {
  return {
    id: `QR-${provider}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    provider,
    type,
    phone,
    businessId,
    businessName,
    amount,
    timestamp: Date.now(),
  }
}

export function formatPhoneNumber(phone: string): string {
  // Format numéro sénégalais
  const cleaned = phone.replace(/\D/g, '')

  if (cleaned.length === 9) {
    return `+221${cleaned}`
  }
  if (cleaned.length === 12 && cleaned.startsWith('221')) {
    return `+${cleaned}`
  }
  if (cleaned.length === 13 && cleaned.startsWith('+221')) {
    return cleaned
  }

  return phone
}

export function validateSenegalPhoneNumber(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '')

  // Sénégal: 221 + 9 chiffres
  if (cleaned === phone.replace(/\D/g, '') && cleaned.length === 9) {
    return true
  }
  if (cleaned.startsWith('221') && cleaned.length === 12) {
    return true
  }
  if (phone.startsWith('+221') && cleaned.length === 12) {
    return true
  }

  return false
}

export function displayPhoneNumber(phone: string): string {
  // Affiche au format: 77 XXX XX XX
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length >= 9) {
    const last9 = cleaned.slice(-9)
    return `${last9.slice(0, 2)} ${last9.slice(2, 5)} ${last9.slice(5, 7)} ${last9.slice(7, 9)}`
  }
  return phone
}

// Types de QR codes supportés
export type QRType = 'PERSONAL_WAVE' | 'PERSONAL_ORANGE' | 'BUSINESS_WAVE' | 'BUSINESS_ORANGE'

export function getQRType(provider: PaymentProvider2, type: 'PERSONAL' | 'BUSINESS'): QRType {
  if (provider === 'wave') return type === 'PERSONAL' ? 'PERSONAL_WAVE' : 'BUSINESS_WAVE'
  return type === 'PERSONAL' ? 'PERSONAL_ORANGE' : 'BUSINESS_ORANGE'
}

// Simulation de scan QR (en prod: lecteur caméra)
export interface ScannedQRResult {
  success: boolean
  data?: QRCodeData
  error?: string
}

export function simulateQRScan(qrData: QRCodeData): ScannedQRResult {
  // En production: utiliser camera API + qr-code-decoder
  // Pour l'instant: simulation simple
  return {
    success: true,
    data: qrData,
  }
}

// Génère le texte pour un vrai QR code (format standard)
export function generateQRText(
  provider: PaymentProvider2,
  phone: string,
  amount?: number
): string {
  // Format: provider:phone:amount (simplifié pour texte)
  const formattedPhone = formatPhoneNumber(phone)
  if (amount) {
    return `${provider}://${formattedPhone}?amount=${amount}`
  }
  return `${provider}://${formattedPhone}`
}
