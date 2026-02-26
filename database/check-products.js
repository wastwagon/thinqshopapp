#!/usr/bin/env node
/**
 * Check products and categories in the database.
 * Run from backend container: node database/check-products.js
 * Or locally: DATABASE_URL="postgresql://..." node database/check-products.js
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const [products, categories, productCount] = await Promise.all([
    prisma.product.findMany({
      select: { id: true, name: true, slug: true, is_active: true, category_id: true },
      orderBy: { id: 'asc' },
    }),
    prisma.category.findMany({
      select: { id: true, name: true, slug: true },
      orderBy: { id: 'asc' },
    }),
    prisma.product.count(),
  ]);

  console.log('\n=== CATEGORIES (' + categories.length + ') ===');
  categories.forEach((c) => console.log(`  ${c.id}. ${c.name} (${c.slug})`));

  console.log('\n=== PRODUCTS (' + productCount + ') ===');
  products.forEach((p) => {
    const cat = categories.find((c) => c.id === p.category_id);
    const catName = cat ? cat.name : '?';
    const status = p.is_active ? 'active' : 'inactive';
    console.log(`  ${p.id}. ${p.name} | slug: ${p.slug} | category: ${catName} | ${status}`);
  });

  console.log('\n--- Summary ---');
  console.log(`Categories: ${categories.length}`);
  console.log(`Products: ${productCount} (active: ${products.filter((p) => p.is_active).length})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
