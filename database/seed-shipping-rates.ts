/**
 * Seed default Air and Sea shipping rates (ShippingMethodRate).
 * Run after migrations if the table is empty or you want to reset defaults:
 *   cd database && npx ts-node seed-shipping-rates.ts
 * Or: npx ts-node database/seed-shipping-rates.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const defaultRates = [
  { rate_id: 'air_express', method: 'air_freight', name: 'Express (3-5 days)', price: 17.00, type: 'KG', duration: '3-5 days', currency: 'USD', sort_order: 0 },
  { rate_id: 'air_normal', method: 'air_freight', name: 'Normal (7-14 days)', price: 13.00, type: 'KG', duration: '7-14 days', currency: 'USD', sort_order: 1 },
  { rate_id: 'air_special', method: 'air_freight', name: 'Special/Battery goods', price: 20.00, type: 'KG', duration: null, currency: 'USD', sort_order: 2 },
  { rate_id: 'air_phone', method: 'air_freight', name: 'Phone', price: 150.00, type: 'UNIT', duration: null, currency: 'RMB', sort_order: 3 },
  { rate_id: 'air_laptop', method: 'air_freight', name: 'Laptop', price: 200.00, type: 'KG', duration: null, currency: 'RMB', sort_order: 4 },
  { rate_id: 'sea_standard', method: 'sea_freight', name: 'Sea', price: 245.00, type: 'CBM', duration: '45-60 days', currency: 'USD', sort_order: 0 },
];

async function main() {
  for (const r of defaultRates) {
    await prisma.shippingMethodRate.upsert({
      where: { rate_id: r.rate_id },
      update: {
        method: r.method,
        name: r.name,
        price: r.price,
        type: r.type,
        duration: r.duration,
        currency: (r as any).currency || 'USD',
        sort_order: r.sort_order,
        is_active: true,
      },
      create: {
        rate_id: r.rate_id,
        method: r.method,
        name: r.name,
        price: r.price,
        type: r.type,
        duration: r.duration,
        currency: (r as any).currency || 'USD',
        sort_order: r.sort_order,
        is_active: true,
      },
    });
  }
  console.log('Shipping rates (Air + Sea) seeded successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
