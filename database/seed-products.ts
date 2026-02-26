import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
    const productsPath = path.join(process.cwd(), 'database', 'scraped_products.json');
    if (!fs.existsSync(productsPath)) {
        console.log('scraped_products.json not found, skipping product seed.');
        return;
    }
    const productsData = JSON.parse(fs.readFileSync(productsPath, 'utf8'));

    console.log(`Found ${productsData.length} products in JSON.`);

    for (const item of productsData) {
        // 1. Ensure category exists
        const categorySlug = item.category.toLowerCase().replace(/ /g, '-');
        const category = await prisma.category.upsert({
            where: { slug: categorySlug },
            update: {},
            create: {
                name: item.category,
                slug: categorySlug,
            },
        });

        // 2. Create product
        const productSlug = item.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]/g, '');

        // Clean price string to number
        const price = parseFloat(item.price.replace(/[^0-9.]/g, ''));

        await prisma.product.upsert({
            where: { slug: productSlug },
            update: {
                description: item.description,
                price: price,
                images: item.gallery_images,
                specifications: item.specs,
            },
            create: {
                name: item.name,
                slug: productSlug,
                description: item.description,
                price: price,
                stock_quantity: 100,
                category_id: category.id,
                images: item.gallery_images,
                specifications: item.specs,
                is_active: true,
            },
        });

        console.log(`Seeded/Updated: ${item.name}`);
    }

    console.log('Seeding completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
