/**
 * One-time script: deletes "Google Pixel 8 Pro" and "HP Elite c640 14\" G3 Chromebook" from the database.
 * Run from repo root: npx ts-node -r tsconfig-paths/register database/delete-two-products.ts
 * Or from database/: npx ts-node delete-two-products.ts (with Prisma schema path set)
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const slugs = ['pixel-8-pro', 'hp-elite-c640-14-g3-chromebook'];
  for (const slug of slugs) {
    const deleted = await prisma.product.deleteMany({ where: { slug } });
    console.log(`Deleted ${deleted.count} product(s) with slug: ${slug}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
