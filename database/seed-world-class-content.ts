/**
 * World-class ecommerce content seed.
 * Run after migration 20260225160000_world_class_content.
 * Idempotent: safe to run multiple times (uses upsert / count check).
 */
import { PrismaClient } from '@prisma/client';

const now = new Date();

export async function seedWorldClassContent(prisma: PrismaClient) {
    // --- Hero slides (seed only if empty) ---
    const heroCount = await prisma.heroSlide.count();
    if (heroCount === 0) {
        await prisma.heroSlide.createMany({
            data: [
                { title: 'Pro gear for creators', subtitle: 'Cameras, computers, and pro video — sourced globally, delivered to Ghana.', cta_text: 'Shop now', cta_url: '/shop', sort_order: 0, is_active: true, updated_at: now },
                { title: 'International shipping to Ghana', subtitle: 'All orders shipped from abroad. Estimated delivery 7–14 days.', cta_text: 'Delivery info', cta_url: '/privacy', sort_order: 1, is_active: true, updated_at: now },
                { title: 'Delivery in 7–14 days', subtitle: 'We ship worldwide to Ghana. Track your order from dispatch to delivery.', cta_text: 'Track order', cta_url: '/track', sort_order: 2, is_active: true, updated_at: now },
            ],
        });
        console.log('Seeded hero_slides');
    }

    // --- Trust badges (seed only if empty, or update labels for shorter text) ---
    const trustCount = await prisma.trustBadge.count();
    if (trustCount === 0) {
        await prisma.trustBadge.createMany({
            data: [
                { icon: 'shield', label: 'Secure checkout', optional_link: null, sort_order: 0, is_active: true, updated_at: now },
                { icon: 'truck', label: 'Global shipping 7–14 days', optional_link: '/privacy', sort_order: 1, is_active: true, updated_at: now },
                { icon: 'rotate-ccw', label: 'Easy returns', optional_link: '/terms', sort_order: 2, is_active: true, updated_at: now },
                { icon: 'star', label: 'Rated 4.8 by customers', optional_link: null, sort_order: 3, is_active: true, updated_at: now },
                { icon: 'lock', label: 'Paystack protected', optional_link: 'https://paystack.com', sort_order: 4, is_active: true, updated_at: now },
                { icon: 'check-circle', label: 'Warranty available', optional_link: '/shop', sort_order: 5, is_active: true, updated_at: now },
            ],
        });
        console.log('Seeded trust_badges');
    } else {
        // Update labels for card-fit (shorter text)
        await prisma.trustBadge.updateMany({ where: { icon: 'truck' }, data: { label: 'Global shipping 7–14 days', updated_at: now } });
        await prisma.trustBadge.updateMany({ where: { icon: 'check-circle' }, data: { label: 'Warranty available', updated_at: now } });
    }

    // --- Testimonials (seed only if empty) ---
    const testimonialCount = await prisma.testimonial.count();
    if (testimonialCount === 0) {
        await prisma.testimonial.createMany({
            data: [
                { quote: 'ThinQShop delivered my camera within the estimated window. Packaging was perfect and the team answered every question.', author_name: 'Akua B.', author_role: 'Videographer', sort_order: 0, is_active: true, updated_at: now },
                { quote: 'Finally a place that stocks pro gear for Ghana. Prices are fair and international shipping is reliable.', author_name: 'Kofi M.', author_role: 'Content Creator', sort_order: 1, is_active: true, updated_at: now },
                { quote: "I've ordered twice — laptops and accessories. Both times smooth delivery from abroad.", author_name: 'Ama S.', author_role: 'Photographer', sort_order: 2, is_active: true, updated_at: now },
            ],
        });
        console.log('Seeded testimonials');
    }

    // --- Site policies (upsert by type) ---
    const deliveryShort = 'All orders are shipped from abroad. Estimated delivery to Ghana: 7–14 days.';
    const deliveryFull = `All orders are shipped from abroad and delivered to Ghana. Estimated delivery time is 7–14 days from dispatch. Delivery fees are calculated at checkout based on your location. You can track your order anytime from your account or the Track page.`;
    const returnsShort = '14-day returns on unused items. Contact support to start a return.';
    const returnsFull = `You may return most unused items within 14 days of delivery for a refund or exchange. Items must be in original packaging and condition. To start a return, contact our support team with your order number. Refunds are processed within 5–7 business days after we receive the item.`;
    await prisma.sitePolicy.upsert({ where: { type: 'delivery' }, update: { short_text: deliveryShort, full_text: deliveryFull, updated_at: now }, create: { type: 'delivery', short_text: deliveryShort, full_text: deliveryFull, updated_at: now } });
    await prisma.sitePolicy.upsert({ where: { type: 'returns' }, update: { short_text: returnsShort, full_text: returnsFull, updated_at: now }, create: { type: 'returns', short_text: returnsShort, full_text: returnsFull, updated_at: now } });
    console.log('Seeded site_policies');

    // --- Homepage sections (upsert by section_key) ---
    const sectionKeys = ['hero', 'trust_strip', 'flash_sales', 'featured', 'categories', 'testimonials', 'all_products'];
    for (let i = 0; i < sectionKeys.length; i++) {
        await prisma.homepageSection.upsert({
            where: { section_key: sectionKeys[i] },
            update: { sort_order: i, is_enabled: true, updated_at: now },
            create: { section_key: sectionKeys[i], sort_order: i, is_enabled: true, updated_at: now },
        });
    }
    console.log('Seeded homepage_sections');

    // --- Settings (storefront copy) ---
    const settings = [
        { setting_key: 'free_shipping_threshold_ghs', setting_value: '500', description: 'Free delivery threshold (GHS)' },
        { setting_key: 'site_orders_delivered_text', setting_value: '10,000+ orders delivered', description: 'Social proof line' },
        { setting_key: 'support_phone', setting_value: '+86 183 2070 9024', description: 'Support phone' },
        { setting_key: 'support_email', setting_value: 'info@thinqshopping.app', description: 'Support email' },
    ];
    for (const s of settings) {
        await prisma.setting.upsert({
            where: { setting_key: s.setting_key },
            update: { setting_value: s.setting_value, description: s.description ?? undefined, updated_at: now },
            create: { setting_key: s.setting_key, setting_value: s.setting_value, description: s.description ?? undefined, updated_at: now },
        });
    }
    console.log('Seeded storefront settings');
}

// Run standalone when this file is executed directly
async function main() {
    const prisma = new PrismaClient();
    try {
        await seedWorldClassContent(prisma);
    } finally {
        await prisma.$disconnect();
    }
}

if (require.main === module) {
    main().catch((e) => {
        console.error(e);
        process.exit(1);
    });
}
