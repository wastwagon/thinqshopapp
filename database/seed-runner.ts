/**
 * Seed logic — can be run from CLI (seed.ts) or from NestJS (DatabaseController).
 * Pass a PrismaClient instance. Does not disconnect.
 */
import { PrismaClient } from '@prisma/client';

export async function runSeed(prisma: PrismaClient) {
    // Seed Users
    await prisma.user.upsert({
        where: { email: 'admin@thinqshopping.app' },
        update: {},
        create: {
            email: 'admin@thinqshopping.app',
            password: '$2b$10$EpRnTzVlqHNP0AM25jEpyeCNiF.LN.W.lG.mC32.r0J.d8I.b2.C', // "password" hash
            phone: '+233540000000',
            is_verified: true,
            role: 'admin',
            profile: {
                create: {
                    first_name: 'Admin',
                    last_name: 'User',
                },
            },
            wallet: {
                create: {
                    balance_ghs: 1000.00,
                },
            },
        },
    });

    // Seed Categories
    await prisma.category.upsert({
        where: { slug: 'electronics' },
        update: {},
        create: {
            name: 'Electronics',
            slug: 'electronics',
            description: 'Gadgets and devices',
        },
    });

    await prisma.category.upsert({
        where: { slug: 'fashion' },
        update: {},
        create: {
            name: 'Fashion',
            slug: 'fashion',
            description: 'Clothing and accessories',
        },
    });

    // Seed Shipping Zones
    await prisma.shippingZone.createMany({
        data: [
            { zone_name: 'Accra (Central)', base_price: 25.00, per_kg_price: 5.00, is_active: true },
            { zone_name: 'Kumasi', base_price: 40.00, per_kg_price: 8.00, is_active: true },
            { zone_name: 'Northern Region', base_price: 60.00, per_kg_price: 10.00, is_active: true },
        ],
        skipDuplicates: true,
    });

    // Seed Exchange Rate (only if none exists)
    const rateCount = await prisma.exchangeRate.count();
    if (rateCount === 0) {
        await prisma.exchangeRate.create({
            data: {
                rate_ghs_to_cny: 0.65,
                is_active: true,
            },
        });
    }

    // World-class content
    const { seedWorldClassContent } = await import('./seed-world-class-content');
    await seedWorldClassContent(prisma);
}
