import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Seed Users
    const user1 = await prisma.user.upsert({
        where: { email: 'admin@thinqshopping.app' },
        update: {},
        create: {
            email: 'admin@thinqshopping.app',
            password: '$2b$10$EpRnTzVlqHNP0AM25jEpyeCNiF.LN.W.lG.mC32.r0J.d8I.b2.C', // "password" hash by default (bcrypt)
            phone: '+233540000000',
            is_verified: true,
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

    console.log({ user1 });

    // Seed Categories
    const electronics = await prisma.category.upsert({
        where: { slug: 'electronics' },
        update: {},
        create: {
            name: 'Electronics',
            slug: 'electronics',
            description: 'Gadgets and devices',
        },
    });

    const fashion = await prisma.category.upsert({
        where: { slug: 'fashion' },
        update: {},
        create: {
            name: 'Fashion',
            slug: 'fashion',
            description: 'Clothing and accessories',
        },
    });

    console.log({ electronics, fashion });

    // Seed Shipping Zones
    await prisma.shippingZone.createMany({
        data: [
            { zone_name: 'Accra (Central)', base_price: 25.00, per_kg_price: 5.00, is_active: true },
            { zone_name: 'Kumasi', base_price: 40.00, per_kg_price: 8.00, is_active: true },
            { zone_name: 'Northern Region', base_price: 60.00, per_kg_price: 10.00, is_active: true },
        ],
        skipDuplicates: true,
    });

    // Seed Exchange Rate
    await prisma.exchangeRate.create({
        data: {
            rate_ghs_to_cny: 0.65, // 1 GHS = 0.65 CNY (approx)
            is_active: true,
        },
    });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
