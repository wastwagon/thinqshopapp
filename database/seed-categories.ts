/**
 * Idempotent two-level category trees (New/Used under all mains except Fashion).
 * Photography / audio-studio stay as legacy aliases (no New/Used trees).
 */
import { PrismaClient } from '@prisma/client';

type CategorySeed = { name: string; slug: string; sort_order?: number; children?: CategorySeed[] };

/** Roots that must remain flat (no New/Used children). */
const FLAT_ONLY_SLUGS = new Set(['fashion']);

/** Legacy mirror sources — must not become New/Used trees. */
const SKIP_AS_TREE_ROOT = new Set(['photography', 'audio-studio']);

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

async function upsertChild(
    prisma: PrismaClient,
    parentId: number,
    child: { name: string; slug: string; sort_order: number },
): Promise<void> {
    await prisma.category.upsert({
        where: { slug: child.slug },
        update: {
            name: child.name,
            sort_order: child.sort_order,
            parent_id: parentId,
        },
        create: {
            name: child.name,
            slug: child.slug,
            sort_order: child.sort_order,
            parent_id: parentId,
            is_active: true,
        },
    });
}

/** Attach New/Used under every root except Fashion and legacy mirror sources. */
async function ensureNewUsedForAllRoots(prisma: PrismaClient): Promise<void> {
    const roots = await prisma.category.findMany({
        where: { parent_id: null },
        select: { id: true, name: true, slug: true },
    });

    for (const root of roots) {
        if (FLAT_ONLY_SLUGS.has(root.slug) || SKIP_AS_TREE_ROOT.has(root.slug)) {
            continue;
        }
        await upsertChild(prisma, root.id, {
            name: `New ${root.name}`,
            slug: `new-${root.slug}`,
            sort_order: 1,
        });
        await upsertChild(prisma, root.id, {
            name: `Used ${root.name}`,
            slug: `used-${root.slug}`,
            sort_order: 2,
        });
    }
}

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
            await upsertChild(prisma, parent.id, {
                name: child.name,
                slug: child.slug,
                sort_order: child.sort_order ?? 0,
            });
        }
    }
    await ensureNewUsedForAllRoots(prisma);
}

async function main() {
    const prisma = new PrismaClient();
    try {
        await seedCategoryTree(prisma);
        console.log(
            'Seeded category trees: New/Used under all mains except Fashion (legacy photography / audio-studio unchanged)',
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
