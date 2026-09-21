import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  try {
    // Create a tenant with slug
    const slug = "commerce-" + Date.now()
    const tenant = await prisma.tenant.create({
      data: {
        name: "Commerce Admin",
        slug: slug
      }
    })
    console.log("? Tenant créé: " + tenant.id)
    
    // Create ADMIN user under this tenant
    const hashedPassword = await bcrypt.hash("admin123", 10)
    const admin = await prisma.user.create({
      data: {
        username: "manager",
        passwordHash: hashedPassword,
        name: "Manager",
        role: "ADMIN",
        status: "ACTIVE",
        tenantId: tenant.id
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
