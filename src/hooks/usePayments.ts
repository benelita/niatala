import { useState, useCallback } from 'react'
import type { Payment, PaymentMethodType } from '../types'
import * as paymentService from '../services/paymentService'
import * as waveService from '../services/waveService'
import * as orangeMoneyService from '../services/orangeMoneyService'
import * as debtService from '../services/debtService'

export function usePayments() {
  const [payments, setPayments] = useState<Payment[]>(() => paymentService.getPaymentById('') ? [] : [])

  const requestWavePayment = useCallback(
    (saleId: string, amount: number, phoneNumber: string, cashierId?: string): Payment | null => {
      const payment = waveService.requestPayment(saleId, amount, phoneNumber, cashierId)
      if (payment) {
        setPayments(prev => [...prev, payment])
      }
      return payment
    },
    []
  )

  const requestOrangeMoneyPayment = useCallback(
    (saleId: string, amount: number, phoneNumber: string, cashierId?: string): Payment | null => {
      const payment = orangeMoneyService.requestPayment(saleId, amount, phoneNumber, cashierId)
      if (payment) {
        setPayments(prev => [...prev, payment])
      }
      return payment
    },
    []
  )

  const confirmWavePayment = useCallback((paymentId: string): Payment | null => {
    const payment = waveService.simulatePaymentConfirmation(paymentId)
    if (payment) {
      setPayments(prev => prev.map(p => (p.id === paymentId ? payment : p)))
    }
    return payment
  }, [])

  const confirmOrangeMoneyPayment = useCallback((paymentId: string): Payment | null => {
    const payment = orangeMoneyService.simulatePaymentConfirmation(paymentId)
    if (payment) {
      setPayments(prev => prev.map(p => (p.id === paymentId ? payment : p)))
    }
    return payment
  }, [])

  const failWavePayment = useCallback((paymentId: string): Payment | null => {
    const payment = waveService.simulatePaymentFailed(paymentId)
    if (payment) {
      setPayments(prev => prev.map(p => (p.id === paymentId ? payment : p)))
    }
    return payment
  }, [])

  const failOrangeMoneyPayment = useCallback((paymentId: string): Payment | null => {
    const payment = orangeMoneyService.simulatePaymentFailed(paymentId)
    if (payment) {
      setPayments(prev => prev.map(p => (p.id === paymentId ? payment : p)))
    }
    return payment
  }, [])

  const getPaymentBySaleId = useCallback((saleId: string): Payment[] => {
    return paymentService.getPaymentsBySaleId(saleId)
  }, [])

  const recordClientDebtPayment = useCallback(
    (clientId: string, amount: number, method: PaymentMethodType, cashierId?: string) => {
      return debtService.recordDebtPayment(clientId, amount, method as any, cashierId)
    },
    []
  )

  return {
    payments,
    requestWavePayment,
    requestOrangeMoneyPayment,
    confirmWavePayment,
    confirmOrangeMoneyPayment,
    failWavePayment,
    failOrangeMoneyPayment,
    getPaymentBySaleId,
    recordClientDebtPayment,
  }
}
