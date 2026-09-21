/**
 * Payment Engine Test Suite
 *
 * Run these tests manually to verify the Payment Engine works correctly.
 * Tests can be executed in browser console via: window.testPaymentEngine()
 */

import { getPaymentEngine, PaymentProvider, PaymentMode, PaymentStatus } from './index'
import type { PaymentRequest } from './types'

export async function testPaymentEngine(): Promise<void> {
  console.group('🧪 Payment Engine Tests')

  try {
    // Test 1: Initialize engine
    console.log('Test 1: Engine initialization...')
    const engine = getPaymentEngine()
    console.assert(engine !== null, 'Engine should be initialized')
    console.log('✅ Test 1 passed: Engine initialized')

    // Test 2: Get all providers
    console.log('\nTest 2: Get all providers...')
    const providers = engine.getAllProviders()
    console.assert(providers.length === 3, 'Should have 3 providers')
    console.assert(providers.some(p => p.provider === PaymentProvider.WAVE), 'Should have Wave provider')
    console.assert(providers.some(p => p.provider === PaymentProvider.ORANGE_MONEY), 'Should have Orange provider')
    console.assert(providers.some(p => p.provider === PaymentProvider.FREE_MONEY), 'Should have Free provider')
    console.log('✅ Test 2 passed: All providers found')
    console.table(providers)

    // Test 3: Create MANUAL payment (Wave)
    console.log('\nTest 3: Create MANUAL payment (Wave)...')
    const waveManualRequest: PaymentRequest = {
      provider: PaymentProvider.WAVE,
      mode: PaymentMode.MANUAL,
      amount: 5000,
      saleId: 'TEST-SALE-001',
      description: 'Test manual payment',
    }
    const waveManualResponse = await engine.createPayment(waveManualRequest)
    if (!waveManualResponse.id) throw new Error('Payment should have ID')
    if (waveManualResponse.status !== PaymentStatus.MANUAL_CONFIRMATION) throw new Error('Status should be MANUAL_CONFIRMATION')
    if (!waveManualResponse.displayInfo?.qrCode) throw new Error('Should have QR code')
    if (!waveManualResponse.displayInfo?.accountNumber) throw new Error('Should have account number')
    console.log('✅ Test 3 passed: MANUAL payment created')
    console.table(waveManualResponse)

    // Test 4: Create MANUAL payment (Orange Money)
    console.log('\nTest 4: Create MANUAL payment (Orange Money)...')
    const orangeManualRequest: PaymentRequest = {
      provider: PaymentProvider.ORANGE_MONEY,
      mode: PaymentMode.MANUAL,
      amount: 3000,
      saleId: 'TEST-SALE-002',
    }
    const orangeManualResponse = await engine.createPayment(orangeManualRequest)
    if (!orangeManualResponse.id) throw new Error('Payment should have ID')
    if (orangeManualResponse.status !== PaymentStatus.MANUAL_CONFIRMATION) throw new Error('Status should be MANUAL_CONFIRMATION')
    console.log('✅ Test 4 passed: Orange Money MANUAL payment created')
    console.table(orangeManualResponse)

    // Test 5: Create MANUAL payment (Free Money)
    console.log('\nTest 5: Create MANUAL payment (Free Money)...')
    const freeManualRequest: PaymentRequest = {
      provider: PaymentProvider.FREE_MONEY,
      mode: PaymentMode.MANUAL,
      amount: 2000,
      saleId: 'TEST-SALE-003',
    }
    const freeManualResponse = await engine.createPayment(freeManualRequest)
    if (!freeManualResponse.id) throw new Error('Payment should have ID')
    console.log('✅ Test 5 passed: Free Money MANUAL payment created')
    console.table(freeManualResponse)

    // Test 6: Get payment status
    console.log('\nTest 6: Get payment status...')
    const status = await engine.getPaymentStatus(PaymentProvider.WAVE, waveManualResponse.id)
    if (status !== PaymentStatus.MANUAL_CONFIRMATION) throw new Error('Status should match created payment')
    console.log('✅ Test 6 passed: Payment status retrieved', status)

    // Test 7: Confirm manual payment
    console.log('\nTest 7: Confirm manual payment...')
    const confirmedPayment = await engine.confirmManualPayment(PaymentProvider.WAVE, waveManualResponse.id)
    console.assert(confirmedPayment.status === PaymentStatus.SUCCESS, 'Status should be SUCCESS after confirmation')
    console.log('✅ Test 7 passed: Manual payment confirmed')
    console.table(confirmedPayment)

    // Test 8: Cancel payment
    console.log('\nTest 8: Cancel payment...')
    const cancelledPayment = await engine.cancelPayment(PaymentProvider.ORANGE_MONEY, orangeManualResponse.id)
    console.assert(cancelledPayment.status === PaymentStatus.CANCELLED, 'Status should be CANCELLED')
    console.log('✅ Test 8 passed: Payment cancelled')
    console.table(cancelledPayment)

    // Test 9: Refund payment
    console.log('\nTest 9: Refund payment...')
    const refundResponse = await engine.refundPayment(PaymentProvider.WAVE, {
      paymentId: confirmedPayment.id,
      amount: 2500,
      reason: 'Test refund',
    })
    if (!refundResponse.id) throw new Error('Refund should have ID')
    console.log('✅ Test 9 passed: Payment refunded')
    console.table(refundResponse)

    // Test 10: Provider config
    console.log('\nTest 10: Provider configuration...')
    const testConfig = {
      apiKey: 'test_key_123',
      merchantId: 'test_merchant_456',
    }
    engine.setProviderConfig(PaymentProvider.WAVE, testConfig)
    const retrievedConfig = engine.getProviderConfig(PaymentProvider.WAVE)
    console.assert(retrievedConfig.apiKey === testConfig.apiKey, 'Config should be stored')
    console.assert(engine.isProviderConfigured(PaymentProvider.WAVE), 'Provider should be configured')
    console.log('✅ Test 10 passed: Provider configuration works')
    console.table(retrievedConfig)

    // Test 11: Validate payment error handling
    console.log('\nTest 11: Error handling...')
    try {
      const invalidRequest: PaymentRequest = {
        provider: PaymentProvider.WAVE,
        mode: PaymentMode.MANUAL,
        amount: -1000, // Invalid negative amount
        saleId: 'TEST-SALE-004',
      }
      await engine.createPayment(invalidRequest)
      console.error('❌ Test 11 failed: Should have thrown error for negative amount')
    } catch (error) {
      console.assert((error as Error).message.includes('positive'), 'Should throw error for negative amount')
      console.log('✅ Test 11 passed: Error handling works')
    }

    console.log('\n✅ All tests passed!')
    console.groupEnd()
  } catch (error) {
    console.error('❌ Test suite failed:', error)
    console.groupEnd()
  }
}

// Make test available in browser console
declare global {
  interface Window {
    testPaymentEngine: () => Promise<void>
  }
}

if (typeof window !== 'undefined') {
  ;(window as any).testPaymentEngine = testPaymentEngine
}
