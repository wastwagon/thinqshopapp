/**
 * Idempotent two-level category trees (high-ticket New/Used subcategories).
 */
import { PrismaClient } from '@prisma/client';

type CategorySeed = { name: string; slug: string; sort_order?: number; children?: CategorySeed[] };

const CATEGORY_TREE: CategorySeed[] = [
    {
        name: 'Cameras',
        slug: 'cameras',
        sort_order: 10,
        children: [
            { name: 'New Cameras', slug: 'new-cameras', sort_order: 1 },
            { name: 'Used Cameras', slug: 'used-cameras', sort_order: 2 },
        ],
    },
    {
        name: 'Drones',
        slug: 'drones',
        sort_order: 20,
        children: [
            { name: 'New Drones', slug: 'new-drones', sort_order: 1 },
            { name: 'Used Drones', slug: 'used-drones', sort_order: 2 },
        ],
    },
    {
        name: 'Computers',
        slug: 'computers',
        sort_order: 30,
        children: [
            { name: 'New Computers', slug: 'new-computers', sort_order: 1 },
            { name: 'Used Computers', slug: 'used-computers', sort_order: 2 },
        ],
    },
    {
        name: 'Gaming',
        slug: 'gaming',
        sort_order: 40,
        children: [
            { name: 'New Gaming', slug: 'new-gaming', sort_order: 1 },
            { name: 'Used Gaming', slug: 'used-gaming', sort_order: 2 },
        ],
    },
    {
        name: 'Pro Audio',
        slug: 'pro-audio',
        sort_order: 50,
        children: [
            { name: 'New Pro Audio', slug: 'new-pro-audio', sort_order: 1 },
            { name: 'Used Pro Audio', slug: 'used-pro-audio', sort_order: 2 },
        ],
    },
    {
        name: 'Electronics',
        slug: 'electronics',
        sort_order: 60,
        children: [
            { name: 'New Electronics', slug: 'new-electronics', sort_order: 1 },
            { name: 'Used Electronics', slug: 'used-electronics', sort_order: 2 },
        ],
    },
    {
        name: 'Lighting',
        slug: 'lighting',
        sort_order: 70,
        children: [
            { name: 'New Lighting', slug: 'new-lighting', sort_order: 1 },
            { name: 'Used Lighting', slug: 'used-lighting', sort_order: 2 },
        ],
    },
    {
        name: 'Pro Video',
        slug: 'pro-video',
        sort_order: 80,
        children: [
            { name: 'New Pro Video', slug: 'new-pro-video', sort_order: 1 },
            { name: 'Used Pro Video', slug: 'used-pro-video', sort_order: 2 },
        ],
    },
];

export async function seedCategoryTree(prisma: PrismaClient): Promise<void> {
    for (const root of CATEGORY_TREE) {
        const parent = await prisma.category.upsert({
            where: { slug: root.slug },
            update: { name: root.name, sort_order: root.sort_order ?? 0, parent_id: null },
            create: {
                name: root.name,
                slug: root.slug,
                sort_order: root.sort_order ?? 0,
                is_active: true,
            },
        });
        for (const child of root.children ?? []) {
            await prisma.category.upsert({
                where: { slug: child.slug },
                update: {
                    name: child.name,
                    sort_order: child.sort_order ?? 0,
                    parent_id: parent.id,
                },
                create: {
                    name: child.name,
                    slug: child.slug,
                    sort_order: child.sort_order ?? 0,
                    parent_id: parent.id,
                    is_active: true,
                },
            });
        }
    }
}

async function main() {
    const prisma = new PrismaClient();
    try {
        await seedCategoryTree(prisma);
        console.log(
            'Seeded category tree (Cameras, Drones, Computers, Gaming, Pro Audio, Electronics, Lighting, Pro Video + New/Used)',
        );
    } finally {
        await prisma.$disconnect();
    }
}

const isCliEntry = process.argv.some((arg) =>
    arg.replace(/\\/g, '/').endsWith('database/seed-categories.ts'),
);

if (require.main === module || isCliEntry) {
    main().catch((e) => {
        console.error(e);
        process.exit(1);
    });
}
