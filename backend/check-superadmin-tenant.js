import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  try {
    const superadmin = await prisma.user.findUnique({
      where: { 
        unique_username_per_tenant: {
          username: "admin",
          tenantId: null
        }
      }
    })
    
    console.log("Super Admin:")
    console.log("Username: " + superadmin.username)
    console.log("TenantId: " + superadmin.tenantId)
    console.log("Role: " + superadmin.role)
  } catch (e) {
    console.error("Error:", e.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()
