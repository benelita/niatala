import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import twilio from 'twilio'

const router = Router()
const prisma = new PrismaClient()

// Initialize Twilio client
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER || ''

// Generate random 6-digit code
const generateResetCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// POST /api/auth/forgot-password - Request password reset code via WhatsApp
router.post('/forgot-password', async (req, res) => {
  try {
    const { username, whatsapp } = req.body

    if (!username || !whatsapp) {
      return res.status(400).json({ error: 'Username and WhatsApp number required' })
    }

    // Find admin user
    const user = await prisma.user.findFirst({
      where: {
        username: username.toLowerCase(),
        role: { in: ['ADMIN', 'SUPER_ADMIN'] },
      },
    })

    if (!user) {
      return res.status(404).json({ error: 'Admin user not found' })
    }

    // Verify WhatsApp number matches
    if (user.whatsapp !== whatsapp) {
      return res.status(403).json({ error: 'WhatsApp number does not match' })
    }

    // Generate reset code (valid for 15 minutes)
    const resetCode = generateResetCode()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

    // Update user with reset code
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetCode,
        resetCodeExpiresAt: expiresAt,
      },
    })

    // Send WhatsApp message via Twilio
    try {
      const message = await twilioClient.messages.create({
        from: `whatsapp:${TWILIO_WHATSAPP_NUMBER}`,
        to: `whatsapp:${whatsapp}`,
        body: `🔐 Code de réinitialisation NIATALA:\n\n${resetCode}\n\nCode valide 15 minutes.\nNe partage pas ce code!`,
      })


      res.json({
        success: true,
        message: 'Reset code sent via WhatsApp',
      })
    } catch (twilioErr) {
      res.status(500).json({ error: 'Failed to send WhatsApp message' })
    }
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// POST /api/auth/reset-password - Reset password with code
router.post('/reset-password', async (req, res) => {
  try {
    const { username, resetCode, newPassword } = req.body

    if (!username || !resetCode || !newPassword) {
      return res.status(400).json({ error: 'All fields required' })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' })
    }

    // Find user and verify reset code
    const user = await prisma.user.findFirst({
      where: {
        username: username.toLowerCase(),
        resetCode,
      },
    })

    if (!user) {
      return res.status(404).json({ error: 'Invalid reset code or user not found' })
    }

    // Check if code is expired
    if (!user.resetCodeExpiresAt || user.resetCodeExpiresAt < new Date()) {
      return res.status(401).json({ error: 'Reset code has expired' })
    }

    // Hash new password
    const bcrypt = require('bcryptjs')
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Update password and clear reset code
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword,
        passwordChangedAt: new Date(),
        resetCode: null,
        resetCodeExpiresAt: null,
      },
    })

    res.json({ success: true, message: 'Password reset successfully' })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// PUT /api/auth/admin-profile - Update admin profile info
router.put('/admin-profile', async (req, res) => {
  try {
    const { userId, firstName, lastName, whatsapp } = req.body

    if (!userId) {
      return res.status(400).json({ error: 'User ID required' })
    }

    // Update user profile
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        whatsapp: whatsapp || undefined,
      },
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        username: true,
        whatsapp: true,
        email: true,
        phone: true,
      },
    })

    res.json({ success: true, user })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

export default router
