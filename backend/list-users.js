import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  try {
    const users = await prisma.user.findMany({
      select: {
        username: true,
        name: true,
        role: true,
        status: true
      }
    })
    console.log(JSON.stringify(users, null, 2))
  } catch (e) {
    console.error("Error:", e.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()
