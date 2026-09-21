import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        role: true,
        firstName: true,
        lastName: true,
        whatsapp: true
      }
    })
    console.log("Users in database:")
    console.log(JSON.stringify(users, null, 2))
  } catch (e) {
    console.error("Error:", e.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()
