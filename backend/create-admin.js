import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  try {
    // Hash password for admin
    const hashedPassword = await bcrypt.hash("admin123", 10)
    
    // Create ADMIN user
    const admin = await prisma.user.create({
      data: {
        username: "manager",
        password: hashedPassword,
        name: "Manager Admin",
        role: "ADMIN",
        status: "ACTIVE",
        firstName: "Manager",
        lastName: "Admin",
        whatsapp: "+221781234567"
      }
    })
    
    console.log("? ADMIN créé avec succès!")
    console.log(JSON.stringify(admin, null, 2))
  } catch (e) {
    console.error("? Error:", e.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()
