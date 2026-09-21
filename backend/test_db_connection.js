const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const userCount = await prisma.user.count();
    console.log(`✅ PostgreSQL connected: ${userCount} users in database`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Database error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
