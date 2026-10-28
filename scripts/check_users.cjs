const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function main() {
  const users = await db.user.findMany({ select: { email: true, name: true, role: true, password: true } });
  console.log('Users in DB:', users.length);
  for (const u of users) {
    console.log(' -', u.email, '|', u.name, '|', u.role, '| password starts with:', u.password.substring(0, 8));
  }
  const bovins = await db.bovin.count();
  console.log('Bovins count:', bovins);
}
main().catch(console.error).finally(() => db.$disconnect());
