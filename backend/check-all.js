import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  try {
    const allUsers = await prisma.user.findMany()
    console.log("All users:")
    allUsers.forEach(u => {
      console.log(`  - ${u.username} (${u.role}) - TenantId: ${u.tenantId}`)
    })
    
    const allTenants = await prisma.tenant.findMany()
    console.log("All tenants:")
    allTenants.forEach(t => {
      console.log(`  - ${t.id} (${t.name})`)
    })
  } catch (e) {
    console.error("Error:", e.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()
