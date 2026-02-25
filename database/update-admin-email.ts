/**
 * One-off: update existing admin email from admin@thinqshop.com to admin@thinqshopping.app
 * Run: DATABASE_URL="your_url" npx ts-node database/update-admin-email.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const updated = await prisma.user.updateMany({
    where: { email: 'admin@thinqshop.com' },
    data: { email: 'admin@thinqshopping.app' },
  });
  console.log('Updated admin email:', updated.count, 'user(s)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
