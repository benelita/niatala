import { PrismaClient } from '@prisma/client'
import bcryptjs from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.findFirst({
    where: { username: 'admin' }
  })
  
  if (!user) {
    return
  }
  
  
  // Test comparison
  const isValid = await bcryptjs.compare('admin123', user.passwordHash)
  
  // Try to hash "admin123" again and compare
  const newHash = await bcryptjs.hash('admin123', 10)
  const isNewHashValid = await bcryptjs.compare('admin123', newHash)
  
  // If old hash is invalid, update it
  if (!isValid) {
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash }
    })
  } else {
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())
