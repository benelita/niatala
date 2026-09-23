import express, { Request, Response, NextFunction } from 'express'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'
import { PaymentTransactionService } from './services/paymentTransactionService'
import { waveService } from './services/waveBusinessService'
import paymentsRouter from './routes/payments'
import webhooksRouter from './routes/webhooks'
import authRouter from './routes/auth'
import passwordResetRouter from './routes/passwordReset'
import superAdminRouter from './routes/superAdmin'
import adminRegistrationRouter from './routes/adminRegistration'
import adminRouter from './routes/admin'
import inventoryAuthorizationRouter from './routes/inventoryAuthorization'
import externalVendorsRouter from './routes/externalVendors'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001
const NODE_ENV = process.env.NODE_ENV || 'development'

// Middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser()) // Parse cookies for JWT auth

// CORS setup
app.use((req: Request, res: Response, next: NextFunction): void => {
  const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:5174',
    'http://localhost:5174',
    'http://localhost:3000',
    'http://192.168.1.224:5174',  // Ajouter IP locale
    'http://172.17.48.1:5174',    // WSL alternative
  ]

  const origin = req.headers.origin as string
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin)
  }

  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Wave-Signature')
  res.header('Access-Control-Allow-Credentials', 'true')

  if (req.method === 'OPTIONS') {
    res.sendStatus(200)
    return
  }

  next()
})

// Request logging
app.use((req: Request, _res: Response, next: NextFunction): void => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`)
  next()
})

// ============ ROUTES ============

/**
 * Authentication routes (Phase 1)
 */
app.use('/api/auth', authRouter)

/**
 * Password reset routes
 */
app.use('/api/auth', passwordResetRouter)

/**
 * Super Admin routes
 */
app.use('/api/super-admin', superAdminRouter)

/**
 * Admin Registration routes
 */
app.use('/api/admin-registration', adminRegistrationRouter)

/**
 * Admin routes (ADMIN & SUPER_ADMIN)
 */
app.use('/api/admin', adminRouter)

/**
 * Inventory authorization routes (ADMIN & SUPER_ADMIN)
 */
app.use('/api/inventory-authorization', inventoryAuthorizationRouter)

/**
 * External vendors routes
 */
app.use('/api/external-vendors', externalVendorsRouter)

/**
 * Health check endpoint
 */
app.get('/api/health', (_req: Request, res: Response): void => {
  const waveStatus = waveService.getConfigStatus()

  res.json({
    status: 'ok',
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
    services: {
      wave: waveStatus,
    },
  })
})

/**
 * Get server status and configuration
 */
app.get('/api/status', (_req: Request, res: Response): void => {
  const transactions = PaymentTransactionService.getAllTransactions()

  res.json({
    uptime: process.uptime(),
    environment: NODE_ENV,
    transactions: {
      active: transactions.length,
      total: transactions.length,
    },
    wave: waveService.getConfigStatus(),
  })
})

/**
 * Payment routes
 */
app.use('/api/payments', paymentsRouter)

/**
 * Webhook routes
 */
app.use('/api/webhooks', webhooksRouter)

/**
 * Clear expired transactions (run periodically)
 */
app.post('/api/admin/cleanup', (_req: Request, res: Response): void => {
  const cleared = PaymentTransactionService.clearExpiredTransactions()
  res.json({
    cleared,
    message: `Cleared ${cleared} expired transactions`,
  })
})

// ============ ERROR HANDLING ============

/**
 * 404 handler
 */
app.use((req: Request, res: Response): void => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
    method: req.method,
  })
})

/**
 * Global error handler
 */
app.use((err: any, _req: Request, res: Response): void => {
  res.status(500).json({
    error: 'Internal server error',
    message: NODE_ENV === 'development' ? err.message : undefined,
  })
})

// ============ START SERVER ============

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════╗
║  NIATALA Payment Backend                       ║
║  Listening on http://localhost:${PORT}          ║
║  Environment: ${NODE_ENV}                          ║
╚════════════════════════════════════════════════╝
  `)

  console.log(`   POST /api/auth/login              - Login (username + password)`)
  console.log(`   POST /api/auth/logout             - Logout (revoke session)`)
  console.log(`   POST /api/payments/:id/confirm    - Confirm payment (manual)`)
  console.log(`   POST /api/webhooks/test/wave      - Test webhook (dev only)`)
})
