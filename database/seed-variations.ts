/**
 * Default variation options and values (Size: Small–XXL).
 * Idempotent: safe to run multiple times; adds missing values without deleting existing data.
 * Safe on production (catalog-only).
 */
import { PrismaClient } from '@prisma/client';

const DEFAULT_OPTIONS: Array<{
    name: string;
    slug: string;
    sort_order: number;
    values: Array<{ value: string; sort_order: number }>;
}> = [
    {
        name: 'Size',
        slug: 'size',
        sort_order: 0,
        values: [
            { value: 'Small', sort_order: 0 },
            { value: 'Medium', sort_order: 1 },
            { value: 'Large', sort_order: 2 },
            { value: 'XL', sort_order: 3 },
            { value: 'XXL', sort_order: 4 },
        ],
    },
];

export async function seedVariations(prisma: PrismaClient) {
    for (const opt of DEFAULT_OPTIONS) {
        const option = await prisma.variationOption.upsert({
            where: { slug: opt.slug },
            update: { name: opt.name, sort_order: opt.sort_order },
            create: { name: opt.name, slug: opt.slug, sort_order: opt.sort_order },
        });

        for (const val of opt.values) {
            await prisma.variationValue.upsert({
                where: {
                    variation_option_id_value: {
                        variation_option_id: option.id,
                        value: val.value,
                    },
                },
                update: { sort_order: val.sort_order },
                create: {
                    variation_option_id: option.id,
                    value: val.value,
                    sort_order: val.sort_order,
                },
            });
        }
    }

    console.log('Seeded variation options (Size: Small, Medium, Large, XL, XXL)');
}

async function main() {
    const prisma = new PrismaClient();
    try {
        await seedVariations(prisma);
    } finally {
        await prisma.$disconnect();
    }
}

const isCliEntry = process.argv.some((arg) =>
    arg.replace(/\\/g, '/').endsWith('database/seed-variations.ts'),
);

if (require.main === module || isCliEntry) {
    main().catch((e) => {
        console.error(e);
        process.exit(1);
    });
}
