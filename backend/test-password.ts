import { PrismaClient } from '@prisma/client'
import bcryptjs from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.findFirst({
    where: { username: 'admin' }
  })
  
  if (!user) {
    console.log('❌ User not found')
    return
  }
  
  console.log('Testing password for user:', user.username)
  console.log('Stored hash:', user.passwordHash)
  
  // Test comparison
  const isValid = await bcryptjs.compare('admin123', user.passwordHash)
  console.log('Password "admin123" is valid?', isValid)
  
  // Try to hash "admin123" again and compare
  const newHash = await bcryptjs.hash('admin123', 10)
  const isNewHashValid = await bcryptjs.compare('admin123', newHash)
  console.log('New hash is valid?', isNewHashValid)
  
  // If old hash is invalid, update it
  if (!isValid) {
    console.log('❌ Hash is invalid! Updating...')
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash }
    })
    console.log('✅ User password updated')
  } else {
    console.log('✅ Hash is valid - problem elsewhere')
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())
