import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.findFirst({
    where: { username: 'admin' }
  })
  
  if (user) {
    console.log('✅ User admin EXISTS')
    console.log('ID:', user.id)
    console.log('Username:', user.username)
    console.log('Role:', user.role)
    console.log('Status:', user.status)
    console.log('TenantId:', user.tenantId)
  } else {
    console.log('❌ User admin NOT FOUND - recreating...')
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
    console.log('✅ New user created:', newUser.id)
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())
