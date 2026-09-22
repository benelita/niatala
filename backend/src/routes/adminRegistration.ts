import { Router } from 'express'
import { prisma } from '../lib/prisma'
import twilio from 'twilio'

const router = Router()

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER || ''

// Generate random 6-digit code
const generateAuthCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// POST /api/admin-registration/register - Admin registration with WhatsApp
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, whatsapp } = req.body

    if (!firstName || !lastName || !whatsapp) {
      return res.status(400).json({ error: 'All fields required' })
    }

    // Check if admin already exists with this WhatsApp
    const existing = await prisma.user.findFirst({
      where: {
        whatsapp,
        role: 'ADMIN',
      },
    })

    if (existing) {
      return res.status(409).json({ error: 'Admin already registered with this WhatsApp' })
    }

    // Generate auth code
    const authCode = generateAuthCode()
    const codeExpiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Create temporary tenant for this admin
    const tenant = await prisma.tenant.create({
      data: {
        name: `${firstName} ${lastName}`,
        slug: `admin-${Date.now()}`,
        businessName: `${firstName} ${lastName}`,
        status: 'ACTIVE',
      },
    })

    // Create admin user (without password yet - inactive)
    const admin = await prisma.user.create({
      data: {
        name: `${firstName} ${lastName}`,
        firstName,
        lastName,
        username: whatsapp.replace(/\D/g, ''), // username = digits only from WhatsApp
        whatsapp,
        passwordHash: '', // Empty until password is set
        role: 'ADMIN',
        status: 'DISABLED', // Will be enabled after password setup
        tenantId: tenant.id,
        resetCode: authCode,
        resetCodeExpiresAt: codeExpiresAt,
      },
    })

    // Send authentication code (via WhatsApp or console in demo mode)
    console.log(`\n🔐 ADMIN REGISTRATION CODE (DEMO MODE)`)
    console.log(`Expires: ${codeExpiresAt.toLocaleString()}`)

    if (TWILIO_WHATSAPP_NUMBER && process.env.TWILIO_ACCOUNT_SID) {
      // Try to send WhatsApp if configured
      try {
        await twilioClient.messages.create({
          from: `whatsapp:${TWILIO_WHATSAPP_NUMBER}`,
          to: `whatsapp:${whatsapp}`,
          body: `🔐 Code d'authentification NIATALA:\n\n${authCode}\n\nCode valide 10 minutes.\nNe partage pas ce code!`,
        })
      } catch (twilioErr) {
      }
    }

    res.status(201).json({
      success: true,
      message: 'Code d\'authentification généré (voir console pour le code)',
      adminId: admin.id,
      tenantId: tenant.id,
      authCode: process.env.NODE_ENV === 'development' ? authCode : undefined, // Show code only in dev mode
    })
  } catch (err) {
    res.status(500).json({ error: 'Registration failed' })
  }
})

// POST /api/admin-registration/verify-code - Verify auth code
router.post('/verify-code', async (req, res) => {
  try {
    const { adminId, authCode, password } = req.body

    if (!adminId || !authCode || !password) {
      return res.status(400).json({ error: 'All fields required' })
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' })
    }

    // Find admin
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
    })

    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' })
    }

    // Verify code
    if (admin.resetCode !== authCode) {
      return res.status(401).json({ error: 'Invalid code' })
    }

    // Check code expiration
    if (!admin.resetCodeExpiresAt || admin.resetCodeExpiresAt < new Date()) {
      return res.status(401).json({ error: 'Code expired' })
    }

    // Hash password
    const bcrypt = require('bcryptjs')
    const hashedPassword = await bcrypt.hash(password, 10)

    // Update admin: set password and activate
    const updated = await prisma.user.update({
      where: { id: adminId },
      data: {
        passwordHash: hashedPassword,
        status: 'ACTIVE',
        resetCode: null,
        resetCodeExpiresAt: null,
      },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        tenantId: true,
      },
    })

    res.json({
      success: true,
      message: 'Admin account activated successfully',
      admin: updated,
    })
  } catch (err) {
    res.status(500).json({ error: 'Verification failed' })
  }
})

// GET /api/admin-registration/status/:adminId - Check registration status
router.get('/status/:adminId', async (req, res) => {
  try {
    const admin = await prisma.user.findUnique({
      where: { id: req.params.adminId },
      select: {
        id: true,
        name: true,
        status: true,
        resetCodeExpiresAt: true,
      },
    })

    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' })
    }

    res.json({
      admin,
      isActive: admin.status === 'ACTIVE',
      codeExpired: admin.resetCodeExpiresAt ? admin.resetCodeExpiresAt < new Date() : true,
    })
  } catch (err) {
    res.status(500).json({ error: 'Status check failed' })
  }
})

export default router
