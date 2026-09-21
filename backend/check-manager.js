import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  try {
    const user = await prisma.user.findUnique({
      where: { username: "manager" }
    })
    if (user) {
      console.log("Manager déjà existe:")
      console.log(JSON.stringify(user, null, 2))
    } else {
      console.log("Manager n'existe pas")
    }
  } catch (e) {
    console.error("Error:", e.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()
