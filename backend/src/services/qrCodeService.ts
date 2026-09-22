/**
 * QR Code Service for NIATALA
 *
 * Handles merchant QR code management and client QR code scanning with safety guarantees.
 *
 * IMPORTANT SECURITY PRINCIPLES:
 * 1. QR scanning NEVER automatically triggers payments
 * 2. QR scanning identifies beneficiary ONLY
 * 3. User must confirm amount and destination
 * 4. All QR operations require explicit confirmation
 * 5. Protect against QR swapping attacks
 */

import crypto from 'crypto'

export interface MerchantQRCode {
  id: string
  merchantId: string
  provider: 'WAVE' | 'ORANGE_MONEY' | 'FREE_MONEY'
  accountNumber: string
  accountName: string
  displayName: string
  qrData: string
  createdAt: number
  isActive: boolean
  checksum: string // For QR integrity verification
}

export interface ClientQRScan {
  id: string
  scannedQRId: string // Which merchant QR was scanned
  scannedAt: number
  expiresAt: number // QR scan valid for 10 minutes
  beneficiary: {
    merchantId: string
    accountName: string
    provider: 'WAVE' | 'ORANGE_MONEY' | 'FREE_MONEY'
  }
  status: 'PENDING_CONFIRMATION' | 'CONFIRMED' | 'EXPIRED' | 'CANCELLED'
  amount?: number
  confirmedBy?: string
  confirmedAt?: number
}

/**
 * Merchant QR Code Management
 *
 * For WAVE, ORANGE_MONEY, and FREE_MONEY
 * Allows merchants to display QR codes for customers to scan
 */
export class QRCodeService {
  private merchantQRCodes = new Map<string, MerchantQRCode>()
  private clientQRScans = new Map<string, ClientQRScan>()
  private QR_SCAN_EXPIRY = 10 * 60 * 1000 // 10 minutes

  /**
   * Generate a merchant QR code
   *
   * The QR encodes:
   * {
   *   type: "merchant",
   *   provider: "WAVE" | "ORANGE_MONEY" | "FREE_MONEY",
   *   merchantId: "xxx",
   *   accountNumber: "yyy",
   *   checksum: "hash"
   * }
   */
  generateMerchantQRCode(
    merchantId: string,
    provider: 'WAVE' | 'ORANGE_MONEY' | 'FREE_MONEY',
    accountNumber: string,
    accountName: string,
    displayName: string
  ): MerchantQRCode {
    const qrId = `QR_${Date.now()}_${Math.random().toString(36).substring(7)}`

    const qrPayload = {
      type: 'merchant',
      provider,
      merchantId,
      accountNumber,
      id: qrId,
    }

    const qrDataString = JSON.stringify(qrPayload)
    const checksum = this.generateChecksum(qrDataString)

    const qrCode: MerchantQRCode = {
      id: qrId,
      merchantId,
      provider,
      accountNumber,
      accountName,
      displayName,
      qrData: `${qrDataString}|${checksum}`,
      createdAt: Date.now(),
      isActive: true,
      checksum,
    }

    this.merchantQRCodes.set(qrId, qrCode)

    return qrCode
  }

  /**
   * Scan a merchant QR code
   *
   * IMPORTANT: This only IDENTIFIES the merchant.
   * It does NOT automatically create a payment.
   *
   * Returns a scan session that must be:
   * 1. Displayed to user for confirmation
   * 2. Confirmed with explicit amount
   * 3. Confirmed with explicit OK from user
   * 4. Only THEN process payment
   */
  scanMerchantQRCode(qrData: string): ClientQRScan | null {
    try {
      // Parse and verify QR data
      const [payload, checksum] = qrData.split('|')
      const payloadObj = JSON.parse(payload)

      // Verify checksum
      if (this.generateChecksum(payload) !== checksum) {
        return null
      }

      const merchantQR = this.merchantQRCodes.get(payloadObj.id)
      if (!merchantQR || !merchantQR.isActive) {
        return null
      }

      // Create scan session
      const scanId = `SCAN_${Date.now()}_${Math.random().toString(36).substring(7)}`
      const now = Date.now()

      const clientScan: ClientQRScan = {
        id: scanId,
        scannedQRId: merchantQR.id,
        scannedAt: now,
        expiresAt: now + this.QR_SCAN_EXPIRY,
        beneficiary: {
          merchantId: merchantQR.merchantId,
          accountName: merchantQR.accountName,
          provider: merchantQR.provider,
        },
        status: 'PENDING_CONFIRMATION',
      }

      this.clientQRScans.set(scanId, clientScan)
      console.log(`[QRCodeService] QR scanned: ${scanId} (expires at ${new Date(clientScan.expiresAt)})`)

      return clientScan
    } catch (error) {
      return null
    }
  }

  /**
   * Confirm a QR scan with amount
   *
   * User must explicitly confirm:
   * 1. The beneficiary name
   * 2. The provider (Wave/Orange/Free)
   * 3. The amount to send
   * 4. They want to proceed
   *
   * Only THEN should payment be initiated
   */
  confirmQRScan(scanId: string, amount: number, confirmedBy: string): ClientQRScan | null {
    const scan = this.clientQRScans.get(scanId)
    if (!scan) {
      return null
    }

    // Verify scan is not expired
    if (Date.now() > scan.expiresAt) {
      scan.status = 'EXPIRED'
      return null
    }

    // Verify scan is still pending
    if (scan.status !== 'PENDING_CONFIRMATION') {
      return null
    }

    // Validate amount
    if (amount <= 0) {
      return null
    }

    // Update scan with confirmation
    scan.status = 'CONFIRMED'
    scan.amount = amount
    scan.confirmedBy = confirmedBy
    scan.confirmedAt = Date.now()

    this.clientQRScans.set(scanId, scan)

    return scan
  }

  /**
   * Cancel a QR scan
   *
   * If user changes their mind before confirming payment
   */
  cancelQRScan(scanId: string): boolean {
    const scan = this.clientQRScans.get(scanId)
    if (!scan) {
      return false
    }

    if (scan.status === 'PENDING_CONFIRMATION') {
      scan.status = 'CANCELLED'
      return true
    }

    return false
  }

  /**
   * Deactivate a merchant QR code
   *
   * Use when:
   * - Merchant account changes
   * - QR code is compromised
   * - Merchant requests it
   */
  deactivateMerchantQRCode(qrId: string): boolean {
    const qr = this.merchantQRCodes.get(qrId)
    if (!qr) {
      return false
    }

    qr.isActive = false
    this.merchantQRCodes.set(qrId, qr)
    return true
  }

  /**
   * Get QR scan details for payment processing
   *
   * Used by payment processor to verify QR scan before creating payment
   */
  getConfirmedQRScan(scanId: string): ClientQRScan | null {
    const scan = this.clientQRScans.get(scanId)

    if (!scan) {
      return null
    }

    // Must be confirmed and not expired
    if (scan.status !== 'CONFIRMED') {
      return null
    }

    if (Date.now() > scan.expiresAt) {
      scan.status = 'EXPIRED'
      return null
    }

    return scan
  }

  /**
   * Verify QR belongs to correct merchant
   *
   * Safety check to prevent QR swapping attacks
   */
  verifyQRMerchant(qrId: string, expectedMerchantId: string): boolean {
    const qr = this.merchantQRCodes.get(qrId)
    if (!qr) {
      return false
    }

    const isValid = qr.merchantId === expectedMerchantId && qr.isActive
    if (!isValid) {
      console.warn('[QRCodeService] QR merchant verification failed', {
        qrMerchant: qr.merchantId,
        expectedMerchant: expectedMerchantId,
        isActive: qr.isActive,
      })
    }

    return isValid
  }

  // ============ HELPERS ============

  /**
   * Generate checksum for QR data integrity
   *
   * Prevents QR tampering/swapping
   */
  private generateChecksum(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16)
  }

  /**
   * Clean up expired scans
   *
   * Should be called periodically to free memory
   */
  cleanupExpiredScans(): number {
    let cleaned = 0
    const now = Date.now()

    for (const [scanId, scan] of this.clientQRScans.entries()) {
      if (now > scan.expiresAt) {
        this.clientQRScans.delete(scanId)
        cleaned++
      }
    }

    if (cleaned > 0) {
    }

    return cleaned
  }

  /**
   * Get all active merchant QR codes for a provider
   */
  getActiveMerchantQRCodes(provider: 'WAVE' | 'ORANGE_MONEY' | 'FREE_MONEY'): MerchantQRCode[] {
    const codes: MerchantQRCode[] = []
    for (const qr of this.merchantQRCodes.values()) {
      if (qr.provider === provider && qr.isActive) {
        codes.push(qr)
      }
    }
    return codes
  }

  /**
   * Debug: Get statistics
   */
  getStatistics(): { activeMerchantQRs: number; pendingScans: number; totalScans: number } {
    let activeMerchantQRs = 0
    for (const qr of this.merchantQRCodes.values()) {
      if (qr.isActive) {
        activeMerchantQRs++
      }
    }

    let pendingScans = 0
    for (const scan of this.clientQRScans.values()) {
      if (scan.status === 'PENDING_CONFIRMATION') {
        pendingScans++
      }
    }

    return {
      activeMerchantQRs,
      pendingScans,
      totalScans: this.clientQRScans.size,
    }
  }
}

// Export singleton instance
export const qrCodeService = new QRCodeService()
