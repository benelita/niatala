import { Router, Response } from 'express'
import { login, logout, getCurrentUser } from '../services/authService'
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth'
import { prisma } from '../lib/prisma'
import { hashPassword } from '../utils/crypto'

const router = Router()

/**
 * POST /auth/login
 * Login with username and password
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      res.status(400).json({
        error: 'Username and password required',
      })
      return
    }

    const result = await login({ username, password })

    if (!result) {
      res.status(401).json({
        error: 'Invalid credentials',
      })
      return
    }

    // Set httpOnly cookie (secure in production)
    res.cookie('auth_token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'lax',  // Allow cross-site in development
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    })

    res.status(200).json({
      user: result.user,
      message: 'Login successful',
    })
  } catch (error) {
    console.error('[AUTH ROUTE] Login error:', error)
    res.status(500).json({
      error: 'Login failed',
    })
  }
})

/**
 * POST /auth/logout
 * Logout user by revoking session
 */
router.post('/logout', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || !req.tokenHash) {
      res.status(400).json({
        error: 'Missing user or token information',
      })
      return
    }

    const success = await logout(req.user.id, req.tokenHash, 'user_logout')

    if (!success) {
      res.status(500).json({
        error: 'Logout failed',
      })
      return
    }

    // Clear cookie
    res.clearCookie('auth_token')

    res.status(200).json({
      message: 'Logout successful',
    })
  } catch (error) {
    console.error('[AUTH ROUTE] Logout error:', error)
    res.status(500).json({
      error: 'Logout failed',
    })
  }
})

/**
 * GET /auth/me
 * Get current authenticated user info
 */
router.get('/me', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Not authenticated',
      })
      return
    }

    const user = await getCurrentUser(req.user.id)

    if (!user) {
      res.status(404).json({
        error: 'User not found',
      })
      return
    }

    res.status(200).json({
      user,
    })
  } catch (error) {
    console.error('[AUTH ROUTE] Get current user error:', error)
    res.status(500).json({
      error: 'Failed to get user info',
    })
  }
})

/**
 * PUT /auth/profile
 * Update admin profile (firstName, lastName, whatsapp)
 */
router.put('/profile', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Not authenticated',
      })
      return
    }

    const { firstName, lastName, whatsapp } = req.body

    // TODO: Update user profile with new fields
    // Waiting for Prisma client to be regenerated with new schema

    res.status(200).json({
      message: 'Profile update feature coming soon',
    })
  } catch (error) {
    console.error('[AUTH ROUTE] Profile update error:', error)
    res.status(500).json({
      error: 'Failed to update profile',
    })
  }
})

/**
 * POST /auth/create-user
 * Create a new caissier with admin's tenantId
 */
router.post('/create-user', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('[AUTH ROUTE] Create user request:', { name: req.body?.name, username: req.body?.username, user: req.user?.username })

    if (!req.user) {
      res.status(401).json({
        error: 'Not authenticated',
      })
      return
    }

    const { name, username, password, role } = req.body
    const trimmedUsername = username?.trim()

    if (!name || !trimmedUsername || !password || !role) {
      console.log('[AUTH ROUTE] Missing fields:', { name: !!name, username: !!username, password: !!password, role: !!role })
      res.status(400).json({
        error: 'Missing required fields',
      })
      return
    }

    // Only ADMIN and SUPER_ADMIN can create users
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      console.log('[AUTH ROUTE] Not admin, role:', req.user.role)
      res.status(403).json({
        error: 'Only admins can create users',
      })
      return
    }

    // Hash password
    const hashedPassword = await hashPassword(password)
    console.log('[AUTH ROUTE] Password hashed')

    // Create user with admin's tenantId
    const newUser = await prisma.user.create({
      data: {
        name,
        username: trimmedUsername.toLowerCase(),
        passwordHash: hashedPassword,
        role,
        status: 'ACTIVE',
        tenantId: req.user.tenantId, // Use admin's tenant!
      },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        tenantId: true,
      },
    })

    console.log('[AUTH ROUTE] User created successfully:', newUser.username)
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: newUser,
    })
  } catch (err: any) {
    console.error('[AUTH ROUTE] Create user error:', err.message, err.code)
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Username already exists' })
    }
    res.status(500).json({
      error: 'Failed to create user',
    })
  }
})

/**
 * GET /auth/users
 * Get all users (caissiers) for the authenticated user's tenant
 */
router.get('/users', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Not authenticated',
      })
      return
    }

    const users = await prisma.user.findMany({
      where: {
        tenantId: req.user.tenantId,
        role: 'CASHIER',
      },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
        lastLogin: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    res.json({
      success: true,
      users,
    })
  } catch (error) {
    console.error('[AUTH ROUTE] Get users error:', error)
    res.status(500).json({
      error: 'Failed to fetch users',
    })
  }
})

/**
 * PUT /auth/update-user-status
 * Update user status (ACTIVE/DISABLED)
 */
router.put('/update-user-status', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Not authenticated',
      })
      return
    }

    const { userId, status } = req.body

    if (!userId || !status) {
      res.status(400).json({
        error: 'User ID and status required',
      })
      return
    }

    if (status !== 'ACTIVE' && status !== 'DISABLED') {
      res.status(400).json({
        error: 'Invalid status',
      })
      return
    }

    // Only ADMIN can update user status
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      res.status(403).json({
        error: 'Only admins can update user status',
      })
      return
    }

    // Verify the user being updated belongs to the same tenant
    const userToUpdate = await prisma.user.findUnique({
      where: { id: userId },
      select: { tenantId: true },
    })

    if (!userToUpdate) {
      res.status(404).json({
        error: 'User not found',
      })
      return
    }

    if (req.user.role === 'ADMIN' && userToUpdate.tenantId !== req.user.tenantId) {
      res.status(403).json({
        error: 'Cannot update users from other tenants',
      })
      return
    }

    // Update user status
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { status },
      select: {
        id: true,
        username: true,
        status: true,
      },
    })

    res.json({
      success: true,
      message: 'User status updated successfully',
      user: updated,
    })
  } catch (error) {
    console.error('[AUTH ROUTE] Update user status error:', error)
    res.status(500).json({
      error: 'Failed to update user status',
    })
  }
})

/**
 * DELETE /auth/delete-user
 * Delete a user (caissier) - only ADMIN can delete their own caissiers
 */
router.delete('/delete-user', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('[AUTH ROUTE] Delete user request:', { userId: req.body?.userId, user: req.user?.username })

    if (!req.user) {
      res.status(401).json({
        error: 'Not authenticated',
      })
      return
    }

    const { userId } = req.body
    console.log('[AUTH ROUTE] Step 1: userId extracted:', userId)

    if (!userId) {
      console.log('[AUTH ROUTE] Step 2: No userId, returning 400')
      res.status(400).json({
        error: 'User ID required',
      })
      return
    }

    // Only ADMIN can delete users
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      console.log('[AUTH ROUTE] Step 3: Not ADMIN, role is:', req.user.role)
      res.status(403).json({
        error: 'Only admins can delete users',
      })
      return
    }

    console.log('[AUTH ROUTE] Step 4: Finding user to delete...')
    // Check that the user being deleted belongs to the same tenant
    const userToDelete = await prisma.user.findUnique({
      where: { id: userId },
      select: { tenantId: true, role: true },
    })
    console.log('[AUTH ROUTE] Step 5: Found user:', userToDelete)

    if (!userToDelete) {
      console.log('[AUTH ROUTE] Step 6: User not found, returning 404')
      res.status(404).json({
        error: 'User not found',
      })
      return
    }

    // Verify tenant isolation - ADMIN can only delete users in their tenant
    if (req.user.role === 'ADMIN' && userToDelete.tenantId !== req.user.tenantId) {
      console.log('[AUTH ROUTE] Step 7: Tenant mismatch')
      res.status(403).json({
        error: 'Cannot delete users from other tenants',
      })
      return
    }

    // Don't allow deleting ADMIN or SUPER_ADMIN
    if (userToDelete.role === 'ADMIN' || userToDelete.role === 'SUPER_ADMIN') {
      console.log('[AUTH ROUTE] Step 8: Cannot delete admin/super admin')
      res.status(403).json({
        error: 'Cannot delete admin or super admin users',
      })
      return
    }

    console.log('[AUTH ROUTE] Step 9: Deleting user...')
    // Delete the user
    await prisma.user.delete({
      where: { id: userId },
    })
    console.log('[AUTH ROUTE] Step 10: User deleted successfully')

    res.json({
      success: true,
      message: 'User deleted successfully',
    })
  } catch (err: any) {
    console.error('[AUTH ROUTE] Delete user error:', err)
    res.status(500).json({
      error: 'Failed to delete user',
    })
  }
})

export default router
