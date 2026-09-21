import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  try {
    // Check if manager exists
    const existing = await prisma.user.findUnique({
      where: { username: "manager" }
    })
    
    if (existing) {
      console.log("Manager déjà existe, suppression...")
      await prisma.user.delete({
        where: { username: "manager" }
      })
    }
    
    // Create ADMIN user
    const hashedPassword = await bcrypt.hash("admin123", 10)
    const admin = await prisma.user.create({
      data: {
        username: "manager",
        password: hashedPassword,
        name: "Manager",
        role: "ADMIN",
        status: "ACTIVE"
      }
    })
    
    console.log("? ADMIN créé!")
    console.log("Username: " + admin.username)
    console.log("Role: " + admin.role)
  } catch (e) {
    console.error("? Error:", e.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()
