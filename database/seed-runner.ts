/**
 * Seed logic — can be run from CLI (seed.ts) or from NestJS (DatabaseController).
 * Pass a PrismaClient instance. Does not disconnect.
 * Uses bcrypt at runtime so passwords always work.
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const ADMIN_EMAIL = 'admin@thinqshopping.app';
const ADMIN_PASSWORD = 'password';
const USER_EMAIL = 'user@thinqshopping.app';
const USER_PASSWORD = 'password';

export async function runSeed(prisma: PrismaClient) {
    const adminHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    const userHash = await bcrypt.hash(USER_PASSWORD, 10);

    // --- Admin user (admin panel + API) ---
    // update ensures password works after re-seed (fixes bad hashes from old seeds)
    await prisma.user.upsert({
        where: { email: ADMIN_EMAIL },
        update: { password: adminHash, role: 'admin' },
        create: {
            email: ADMIN_EMAIL,
            password: adminHash,
            phone: '+233540000001',
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

    // --- Test user (regular customer) ---
    const testUser = await prisma.user.upsert({
        where: { email: USER_EMAIL },
        update: { password: userHash },
        create: {
            email: USER_EMAIL,
            password: userHash,
            phone: '+233540000002',
            is_verified: true,
            role: 'user',
            profile: {
                create: {
                    first_name: 'Test',
                    last_name: 'User',
                },
            },
            wallet: {
                create: {
                    balance_ghs: 500.00,
                },
            },
        },
    });

    // --- Categories ---
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

    await prisma.category.upsert({
        where: { slug: 'photography' },
        update: {},
        create: { name: 'Photography', slug: 'photography', description: 'Cameras and lenses' },
    });
    await prisma.category.upsert({
        where: { slug: 'computers' },
        update: {},
        create: { name: 'Computers', slug: 'computers', description: 'Laptops and desktops' },
    });

    // Placeholder images (Unsplash - allowed in next.config)
    const IMG_CAMERA = 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800';
    const IMG_HEADPHONES = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800';
    const IMG_TSHIRT = 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800';

    // --- Products (for reviews) ---
    // update: {} — do NOT overwrite images on existing products (production may have real images)
    // create: images only for new products (local/fresh installs get placeholders)
    const product1 = await prisma.product.upsert({
        where: { slug: 'pro-camera-sony-a7' },
        update: {},
        create: {
            name: 'Sony A7 IV Pro Camera',
            slug: 'pro-camera-sony-a7',
            sku: 'SONY-A7-IV',
            short_description: 'Full-frame mirrorless for creators',
            description: 'Professional full-frame mirrorless camera. 33MP sensor, 4K 60p, IBIS.',
            price: 4500.00,
            compare_price: 4999.00,
            stock_quantity: 15,
            category_id: electronics.id,
            is_featured: true,
            is_active: true,
            images: [IMG_CAMERA],
        },
    });

    const product2 = await prisma.product.upsert({
        where: { slug: 'wireless-headphones' },
        update: {},
        create: {
            name: 'Wireless Noise-Cancelling Headphones',
            slug: 'wireless-headphones',
            sku: 'HP-NC-001',
            short_description: 'Premium sound, 30hr battery',
            description: 'Over-ear wireless headphones with active noise cancellation and 30-hour battery life.',
            price: 299.00,
            stock_quantity: 50,
            category_id: electronics.id,
            is_featured: false,
            is_active: true,
            images: [IMG_HEADPHONES],
        },
    });

    const product3 = await prisma.product.upsert({
        where: { slug: 'cotton-tshirt-classic' },
        update: {},
        create: {
            name: 'Classic Cotton T-Shirt',
            slug: 'cotton-tshirt-classic',
            sku: 'FASH-TS-001',
            short_description: 'Soft, breathable everyday wear',
            description: '100% cotton crew neck t-shirt. Available in multiple colors.',
            price: 45.00,
            stock_quantity: 200,
            category_id: fashion.id,
            is_featured: true,
            is_active: true,
            images: [IMG_TSHIRT],
        },
    });

    // --- Product reviews (approved, for display) - only if product has none ---
    const productIds = [product1.id, product2.id, product3.id];
    const hasReviews = await prisma.productReview.count({ where: { product_id: { in: productIds } } });
    if (hasReviews === 0) {
        const reviewData = [
            { product_id: product1.id, user_id: testUser.id, rating: 5, review_text: 'Excellent camera. Delivered on time and exactly as described.', display_name: 'Kofi M.', is_approved: true },
            { product_id: product1.id, user_id: testUser.id, rating: 4, review_text: 'Great quality. Only minor issue was packaging could be sturdier.', display_name: 'Ama S.', is_approved: true },
            { product_id: product2.id, user_id: testUser.id, rating: 5, review_text: 'Best headphones I\'ve bought. Noise cancellation is impressive.', display_name: 'Akua B.', is_approved: true },
            { product_id: product2.id, user_id: testUser.id, rating: 4, review_text: 'Solid build and sound. Battery life as advertised.', display_name: 'Kwame D.', is_approved: true },
            { product_id: product3.id, user_id: testUser.id, rating: 5, review_text: 'Soft fabric, true to size. Will order more colors.', display_name: 'Abena K.', is_approved: true },
        ];
        await prisma.productReview.createMany({ data: reviewData });
    }

    // Update product rating aggregates
    for (const p of [product1, product2, product3]) {
        const agg = await prisma.productReview.aggregate({
            where: { product_id: p.id, is_approved: true },
            _avg: { rating: true },
            _count: true,
        });
        if (agg._count > 0 && agg._avg.rating != null) {
            await prisma.product.update({
                where: { id: p.id },
                data: {
                    rating_aggregate: Math.round(agg._avg.rating * 100) / 100,
                    review_count: agg._count,
                },
            });
        }
    }

    // --- Shipping zones ---
    await prisma.shippingZone.createMany({
        data: [
            { zone_name: 'Accra (Central)', base_price: 25.00, per_kg_price: 5.00, is_active: true },
            { zone_name: 'Kumasi', base_price: 40.00, per_kg_price: 8.00, is_active: true },
            { zone_name: 'Northern Region', base_price: 60.00, per_kg_price: 10.00, is_active: true },
        ],
        skipDuplicates: true,
    });

    // --- Ghana warehouses (Ship for Me) ---
    const ghanaWarehouses = [
        { name: 'Lapaz Hub', code: 'GH-LAPAZ-001', address: 'Lapaz Main Road, Opposite Las Palmas, Accra', city: 'Accra', country: 'Ghana', phone: '+233 24 000 0000', recipient_name: 'ThinQ Lapaz Team', is_active: true },
        { name: 'Kumasi Hub', code: 'GH-KUMASI-001', address: 'Adum Central, Kumasi', city: 'Kumasi', country: 'Ghana', phone: '+233 24 111 1111', recipient_name: 'ThinQ Kumasi Team', is_active: true },
    ];
    for (const w of ghanaWarehouses) {
        await prisma.warehouse.upsert({
            where: { code: w.code },
            update: w,
            create: w,
        });
    }

    // --- Transfer types (lookup) ---
    await prisma.transferType.upsert({
        where: { code: 'send_to_china' },
        update: {},
        create: { type_name: 'Send to China', code: 'send_to_china', description: 'Send money from Ghana to China' },
    });
    await prisma.transferType.upsert({
        where: { code: 'receive_from_china' },
        update: {},
        create: { type_name: 'Receive from China', code: 'receive_from_china', description: 'Receive money from China to Ghana' },
    });

    // --- Exchange rate ---
    const rateCount = await prisma.exchangeRate.count();
    if (rateCount === 0) {
        await prisma.exchangeRate.create({
            data: {
                rate_ghs_to_cny: 0.65,
                is_active: true,
            },
        });
    }

    // --- World-class content ---
    const { seedWorldClassContent } = await import('./seed-world-class-content');
    await seedWorldClassContent(prisma);
}
