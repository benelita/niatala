import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.findFirst({
    where: { username: 'admin' }
  })
  
  if (user) {
  } else {
    const bcryptjs = require('bcryptjs')
    const hash = await bcryptjs.hash('admin123', 10)
    
    const newUser = await prisma.user.create({
      data: {
        username: 'admin',
        passwordHash: hash,
        name: 'Administrator',
        email: 'admin@niatala.local',
        role: 'SUPER_ADMIN',
        tenantId: null,
        status: 'ACTIVE'
      }
    })
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())
