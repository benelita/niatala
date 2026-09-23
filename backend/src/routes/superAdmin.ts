import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { hashPassword } from '../utils/crypto'

const router = Router()

// POST /api/super-admin/create - Create super admin (one-time setup)
router.post('/create', async (req, res) => {
  try {
    const { username, password, whatsapp } = req.body

    if (!username || !password || !whatsapp) {
      res.status(400).json({ error: 'All fields required' })
      return
    }

    // Check if super admin already exists
    const existingSuper = await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' },
    })

    if (existingSuper) {
      res.status(409).json({ error: 'Super admin already exists' })
      return
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create super admin
    const superAdmin = await prisma.user.create({
      data: {
        name: 'Super Administrateur',
        username: username.toLowerCase(),
        passwordHash: hashedPassword,
        whatsapp,
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
      },
    })

    res.status(201).json({
      success: true,
      message: 'Super admin créé avec succès',
      user: {
        id: superAdmin.id,
        username: superAdmin.username,
        role: superAdmin.role,
      },
    })
  } catch (err) {
    res.status(500).json({ error: 'Failed to create super admin' })
  }
})

// PUT /api/super-admin/update-whatsapp - Update super admin WhatsApp
router.put('/update-whatsapp', async (req, res) => {
  try {
    const { whatsapp } = req.body

    if (!whatsapp) {
      res.status(400).json({ error: 'WhatsApp number required' })
      return
    }

    // Update first super admin found
    const updated = await prisma.user.updateMany({
      where: { role: 'SUPER_ADMIN' },
      data: { whatsapp },
    })

    res.json({
      success: true,
      message: 'Super admin WhatsApp updated',
      updated: updated.count,
    })
  } catch (err) {
    res.status(500).json({ error: 'Failed to update super admin' })
  }
})

// GET /api/super-admin/all-admins - Get all admins (super admin only)
router.get('/all-admins', async (_req, res) => {
  try {
    const admins = await prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'SUPER_ADMIN'] },
      },
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        username: true,
        email: true,
        phone: true,
        whatsapp: true,
        role: true,
        status: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    res.json({
      success: true,
      admins,
      total: admins.length,
    })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch admins' })
  }
})

// POST /api/super-admin/create-admin - Create new ADMIN with tenant
router.post('/create-admin', async (req, res) => {
  try {
    const { firstName, lastName, whatsapp, username, businessName } = req.body

    if (!firstName || !lastName || !whatsapp || !username) {
      res.status(400).json({ error: 'firstName, lastName, whatsapp, username required' })
      return
    }

    // Create tenant for this admin
    const slug = `tenant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const tenant = await prisma.tenant.create({
      data: {
        name: businessName || `${firstName} ${lastName}`,
        slug: slug,
      },
    })

    // Generate temporary password
    const tempPassword = Math.random().toString(36).substr(2, 10)
    const hashedPassword = await hashPassword(tempPassword)

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        username: username.toLowerCase(),
        passwordHash: hashedPassword,
        name: `${firstName} ${lastName}`,
        firstName,
        lastName,
        whatsapp,
        role: 'ADMIN',
        status: 'ACTIVE',
        tenantId: tenant.id,
      },
    })

    res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      admin: {
        id: admin.id,
        username: admin.username,
        firstName: admin.firstName,
        lastName: admin.lastName,
        whatsapp: admin.whatsapp,
        tenantId: tenant.id,
        temporaryPassword: tempPassword,
      },
      note: 'Share username and temporary password with the admin to login',
    })
  } catch (err: any) {
    if (err.code === 'P2002') {
      res.status(409).json({ error: 'Username already exists' })
      return
    }
    res.status(500).json({ error: 'Failed to create admin' })
  }
})

// PUT /api/super-admin/update-admin-credentials - Update admin username and password
router.put('/update-admin-credentials', async (req, res) => {
  try {
    const { adminId, username, password } = req.body

    if (!adminId || !username) {
      res.status(400).json({ error: 'Admin ID and username required' })
      return
    }

    // Prepare update data
    const updateData: any = {
      username: username.toLowerCase(),
    }

    // If password provided, hash it
    if (password) {
      if (password.length < 6) {
        res.status(400).json({ error: 'Password must be at least 6 characters' })
        return
      }
      updateData.passwordHash = await hashPassword(password)
      updateData.passwordChangedAt = new Date()
    }

    // Update admin
    const updated = await prisma.user.update({
      where: { id: adminId },
      data: updateData,
      select: {
        id: true,
        username: true,
        role: true,
        name: true,
      },
    })

    res.json({
      success: true,
      message: 'Admin credentials updated successfully',
      admin: updated,
    })
  } catch (err: any) {
    if (err.code === 'P2002') {
      res.status(409).json({ error: 'Username already exists' })
      return
    }
    res.status(500).json({ error: 'Failed to update admin credentials' })
  }
})

// DELETE /api/super-admin/delete-admin - Delete an admin
router.delete('/delete-admin', async (req, res) => {
  try {
    const { adminId } = req.body

    if (!adminId) {
      res.status(400).json({ error: 'Admin ID required' })
      return
    }

    // Don't allow deleting SUPER_ADMIN
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      select: { role: true },
    })

    if (admin?.role === 'SUPER_ADMIN') {
      res.status(403).json({ error: 'Cannot delete SUPER_ADMIN' })
      return
    }

    // Delete the admin (and cascade delete their tenant and related data)
    await prisma.user.delete({
      where: { id: adminId },
    })

    res.json({
      success: true,
      message: 'Admin deleted successfully',
    })
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete admin' })
  }
})

// POST /api/super-admin/reset-admin-password - Reset admin password
router.post('/reset-admin-password', async (req, res) => {
  try {
    const { adminId } = req.body

    if (!adminId) {
      res.status(400).json({ error: 'Admin ID required' })
      return
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).substr(2, 10)
    const hashedPassword = await hashPassword(tempPassword)

    // Update admin password
    const updated = await prisma.user.update({
      where: { id: adminId },
      data: {
        passwordHash: hashedPassword,
        passwordChangedAt: new Date(),
      },
      select: {
        id: true,
        username: true,
        name: true,
      },
    })

    res.json({
      success: true,
      message: 'Password reset successfully',
      admin: updated,
      tempPassword: tempPassword,
    })
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to reset password' })
  }
})

export default router
