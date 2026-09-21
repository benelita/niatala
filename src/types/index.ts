export interface Product {
  id: string
  name: string
  price: number
  costPrice?: number
  category: string
  emoji?: string
  stock: number
  useDefaultThresholds: boolean
  customThresholdOrange?: number
  customThresholdRed?: number
  createdAt?: number
  updatedAt?: number
  tenantId?: string | null
}

export type StockStatus = 'NORMAL' | 'LOW' | 'CRITICAL' | 'OUTOFSTOCK'

export interface StockThreshold {
  thresholdOrange: number
  thresholdRed: number
}

export interface StockMovement {
  id: string
  productId: string
  type: 'SALE' | 'RETURN' | 'ADJUSTMENT' | 'CANCELLATION' | 'REFUND' | 'LOSS' | 'ENTRY'
  quantity: number
  before: number
  after: number
  date: number
  userId?: string
  username?: string
  reference?: string
  motif?: string
}

export interface CartItem extends Product {
  quantity: number
}

export interface Client {
  id: string
  name: string
  phone: string
  address?: string
  createdAt: number
  totalDebt: number
  tenantId?: string | null
}

export type PaymentMethod = 'cash' | 'wave' | 'orange_money' | 'free' | 'card' | 'credit'

export interface SaleItem {
  id: string
  name: string
  price: number
  quantity: number
}

export type SaleStatus = 'PAID' | 'CREDIT' | 'PARTIAL_CREDIT' | 'SETTLED' | 'CANCELLED'

export interface Sale {
  id: string
  saleNumber: string
  date: number
  items: SaleItem[]
  total: number
  paymentMethod: PaymentMethod
  clientId?: string
  paidAmount: number
  remainingAmount: number
  status: SaleStatus
  cashierId?: string
  cancelledAt?: number
  cancellationReason?: string
  tenantId?: string | null
}

export interface DebtOperation {
  id: string
  date: number
  type: 'PURCHASE' | 'PAYMENT'
  amount: number
  balance: number
  saleId?: string
}

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'CASHIER'

export interface User {
  id: string
  name: string
  username: string
  passwordHash: string
  role: UserRole
  status: 'ACTIVE' | 'DISABLED'
  createdAt: number
  lastLogin?: number
}

export interface AuthSession {
  userId: string
  username: string
  name: string
  firstName?: string
  lastName?: string
  whatsapp?: string
  role: UserRole
  tenantId?: string | null
  loginTime: number
}

export type AuditActionType =
  | 'LOGIN'
  | 'LOGOUT'
  | 'CREATE_SALE'
  | 'CANCEL_SALE'
  | 'REFUND_SALE'
  | 'CHANGE_PRICE'
  | 'CREATE_CASHIER'
  | 'DISABLE_CASHIER'
  | 'PAYMENT_DEBT'
  | 'CREATE_CLIENT'
  | 'RESTORE_STOCK'
  | 'PAYMENT_CONFIGURATION_CHANGED'
  | 'PAYMENT_REQUESTED'
  | 'PAYMENT_SUCCESS'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_CANCELLED'

export interface AuditLog {
  id: string
  timestamp: number
  date: string
  time: string
  userId: string
  username: string
  userRole: UserRole
  action: AuditActionType
  reference?: string
  amount?: number
  details?: Record<string, unknown>
  motif?: string
}

export interface Refund {
  id: string
  saleId: string
  amount: number
  date: number
  adminId: string
  motif: string
  itemsReturned?: Array<{ itemId: string; quantity: number }>
  status: 'PARTIAL' | 'FULL'
}

export type PaymentMethodType = 'cash' | 'wave' | 'orange_money' | 'free' | 'card'
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'REFUNDED'

export interface UserPaymentSettings {
  userId: string
  enabledMethods: PaymentMethodType[]
  waveConnected: boolean
  orangeMoneyConnected: boolean
  freeConnected: boolean
  cardEnabled: boolean
  updatedAt: number
}

export interface Payment {
  id: string
  saleId: string
  amount: number
  method: PaymentMethodType
  status: PaymentStatus
  reference?: string // Référence du prestataire
  date: number
  cashierId?: string
  phoneNumber?: string
  metadata?: Record<string, unknown>
}

export interface DebtPayment {
  id: string
  clientId: string
  amount: number
  method: PaymentMethodType
  status: PaymentStatus
  reference?: string
  date: number
  cashierId?: string
}

export interface PaymentProvider {
  id: 'wave' | 'orange_money'
  name: string
  status: 'CONNECTED' | 'DISCONNECTED'
  merchantNumber?: string
  merchantName?: string
  connectedAt?: number
  lastSyncAt?: number
}

export interface Payout {
  id: string
  provider: 'wave' | 'orange_money'
  amount: number
  recipientName: string
  recipientPhone: string
  reason: string
  status: PaymentStatus
  reference?: string
  date: number
  adminId: string
}

export interface ClientDebt extends Client {
  operations: DebtOperation[]
}

export type FreeAmountType = 'INTERNAL' | 'EXTERNAL'

export interface FreeAmount {
  id: string
  saleId: string
  amount: number
  date: number
  type?: FreeAmountType
  objectName?: string
  vendorName?: string
  status: 'PENDING' | 'IDENTIFIED'
  identifiedAt?: number
  identifiedBy?: string
}

// ===== PAYMENT ACCOUNTS (FLEXIBLE) =====

export type PaymentAccountType = 'PERSONAL' | 'BUSINESS'
export type PaymentProvider2 = 'wave' | 'orange_money'

export interface PaymentAccount {
  id: string
  provider: PaymentProvider2
  accountType: PaymentAccountType
  phone?: string
  businessId?: string
  businessName?: string
  displayName: string
  status: 'CONFIGURED' | 'CONNECTED' | 'DISCONNECTED'
  createdAt: number
  updatedAt: number
}

// ===== PAYMENT STATUS (ENHANCED) =====

export type EnhancedPaymentStatus =
  | 'PENDING'
  | 'SUCCESS'
  | 'FAILED'
  | 'CANCELLED'
  | 'MANUAL_CONFIRMATION'
  | 'REFUNDED'

// ===== QR CODE =====

export interface QRCodeData {
  id: string
  provider: PaymentProvider2
  type: PaymentAccountType
  phone?: string
  businessId?: string
  businessName?: string
  amount?: number
  timestamp: number
}

// ===== TRANSACTION (UNIFIED) =====

export type TransactionType = 'SALE_PAYMENT' | 'DEBT_PAYMENT' | 'REFUND' | 'PAYOUT'

export interface Transaction {
  id: string
  type: TransactionType
  date: number
  amount: number
  method: PaymentMethod
  status: EnhancedPaymentStatus
  saleId?: string
  clientId?: string
  userId: string
  username: string
  reference?: string
  motif?: string
  details?: Record<string, unknown>
}
