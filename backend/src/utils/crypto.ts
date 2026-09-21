import bcrypt from 'bcryptjs'

/**
 * Hash a password using bcrypt
 * IMPORTANT: Never use plaintext passwords
 */
export async function hashPassword(password: string): Promise<string> {
  // Salt rounds = 10 (default, good balance between security and performance)
  const saltRounds = 10
  return await bcrypt.hash(password, saltRounds)
}

/**
 * Compare a plaintext password with a bcrypt hash
 */
export async function comparePassword(
  plaintext: string,
  hash: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(plaintext, hash)
  } catch (error) {
    // If comparison fails, return false
    return false
  }
}

/**
 * Check if a string is a valid bcrypt hash
 * Bcrypt hashes start with $2a$, $2b$, or $2y$
 */
export function isBcryptHash(hash: string): boolean {
  return /^\$2[aby]\$\d{2}\$.{53}$/.test(hash)
}
