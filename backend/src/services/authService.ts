import { PrismaClient } from '@prisma/client'
import { hashPassword, comparePassword } from '../utils/crypto'
import { signToken, hashToken, JwtPayload } from '../utils/jwt'

const prisma = new PrismaClient()

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  user: {
    id: string
    username: string
    name: string
    role: string
    tenantId?: string | null
  }
  token: string
}

export interface AuthUser {
  id: string
  username: string
  name: string
  role: string
  tenantId?: string | null
}

/**
 * Login user with username and password
 * Returns JWT token and user info
 */
export async function login(request: LoginRequest): Promise<LoginResponse | null> {
  try {
    // 1. Find user by username (convert to lowercase for consistency)
    const user = await prisma.user.findFirst({
      where: {
        username: request.username.toLowerCase(),
      },
    })

    if (!user) {
      console.log(`[AUTH] Login failed: user ${request.username} not found`)
      return null
    }

    if (user.status !== 'ACTIVE') {
      console.log(`[AUTH] Login failed: user ${request.username} is ${user.status}`)
      return null
    }

    // 2. Verify password
    const passwordValid = await comparePassword(request.password, user.passwordHash)
    if (!passwordValid) {
      console.log(`[AUTH] Login failed: invalid password for ${request.username}`)
      return null
    }

    // 3. Create JWT token
    const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
      userId: user.id,
      username: user.username,
      role: user.role as 'SUPER_ADMIN' | 'ADMIN' | 'CASHIER',
      tenantId: user.tenantId,
    }

    const token = signToken(payload)
    const tokenHash = hashToken(token)

    // 4. Create session in database
    await prisma.session.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    })

    // 5. Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLogin: new Date(),
      },
    })

    // 6. Log audit
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        tenantId: user.tenantId,
        action: 'LOGIN',
        status: 'SUCCESS',
      },
    })

    console.log(`[AUTH] Login successful: ${request.username}`)

    return {
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
      },
      token,
    }
  } catch (error) {
    console.error('[AUTH] Login error:', error)
    return null
  }
}

/**
 * Logout user by revoking session
 */
export async function logout(userId: string, tokenHash: string, reason?: string): Promise<boolean> {
  try {
    await prisma.session.update({
      where: { tokenHash },
      data: {
        revokedAt: new Date(),
        revokeReason: reason || 'user_logout',
      },
    })

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'LOGOUT',
        status: 'SUCCESS',
      },
    })

    console.log(`[AUTH] Logout successful: user ${userId}`)
    return true
  } catch (error) {
    console.error('[AUTH] Logout error:', error)
    return false
  }
}

/**
 * Get current authenticated user info
 */
export async function getCurrentUser(userId: string): Promise<AuthUser | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return null
    }

    return {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      tenantId: user.tenantId,
    }
  } catch (error) {
    console.error('[AUTH] Get current user error:', error)
    return null
  }
}

/**
 * Verify session is still valid (not expired, not revoked)
 */
export async function verifySession(tokenHash: string): Promise<string | null> {
  try {
    const session = await prisma.session.findUnique({
      where: { tokenHash },
    })

    if (!session) {
      return null
    }

    // Check if expired
    if (session.expiresAt < new Date()) {
      return null
    }

    // Check if revoked
    if (session.revokedAt) {
      return null
    }

    return session.userId
  } catch (error) {
    console.error('[AUTH] Verify session error:', error)
    return null
  }
}

/**
 * Create a new user (for admin user creation)
 * IMPORTANT: Password should be validated and secured before calling this
 */
export async function createUser(data: {
  tenantId?: string | null
  name: string
  username: string
  password: string
  email?: string
  role: 'SUPER_ADMIN' | 'ADMIN' | 'CASHIER'
  createdBy: string
}): Promise<{ id: string; username: string } | null> {
  try {
    // Check if username already exists in this context
    const existingUser = await prisma.user.findFirst({
      where: {
        username: data.username,
        tenantId: data.tenantId,
      },
    })

    if (existingUser) {
      console.log(`[AUTH] User creation failed: username ${data.username} already exists`)
      return null
    }

    // Hash password
    const passwordHash = await hashPassword(data.password)

    // Create user
    const user = await prisma.user.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        username: data.username,
        email: data.email,
        passwordHash,
        role: data.role,
        status: 'ACTIVE',
        createdBy: data.createdBy,
      },
    })

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: data.createdBy,
        tenantId: data.tenantId,
        action: 'USER_CREATE',
        resourceType: 'USER',
        resourceId: user.id,
        details: {
          username: user.username,
          role: user.role,
        },
        status: 'SUCCESS',
      },
    })

    console.log(`[AUTH] User created: ${user.username}`)

    return {
      id: user.id,
      username: user.username,
    }
  } catch (error) {
    console.error('[AUTH] Create user error:', error)
    return null
  }
}

/**
 * List users in a tenant (for ADMIN)
 * ADMIN can only see their own tenant's users
 */
export async function listTenantUsers(tenantId: string): Promise<AuthUser[]> {
  try {
    const users = await prisma.user.findMany({
      where: { tenantId },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        status: true,
        tenantId: true,
        lastLogin: true,
      },
    })

    return users.map(u => ({
      id: u.id,
      username: u.username,
      name: u.name,
      role: u.role,
      tenantId: u.tenantId,
    }))
  } catch (error) {
    console.error('[AUTH] List tenant users error:', error)
    return []
  }
}

/**
 * Update user status (enable/disable)
 */
export async function updateUserStatus(userId: string, status: string, updatedBy: string, tenantId?: string): Promise<boolean> {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        status,
        updatedBy,
        updatedAt: new Date(),
      },
    })

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: updatedBy,
        tenantId,
        action: `USER_${status}`,
        resourceType: 'USER',
        resourceId: userId,
        details: {
          username: user.username,
          newStatus: status,
        },
        status: 'SUCCESS',
      },
    })

    console.log(`[AUTH] User ${userId} status updated to ${status}`)
    return true
  } catch (error) {
    console.error('[AUTH] Update user status error:', error)
    return false
  }
}
