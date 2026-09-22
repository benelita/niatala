import { PrismaClient } from '@prisma/client'
import bcryptjs from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcryptjs.hash('admin123', 10)

  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      passwordHash: hashedPassword,
      name: 'Administrator',
      email: 'admin@niatala.local',
      role: 'SUPER_ADMIN',
      tenantId: null,
      status: 'ACTIVE',
    },
  })

}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())
