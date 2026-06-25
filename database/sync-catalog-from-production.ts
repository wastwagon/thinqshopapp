/**
 * Sync active products + categories from production public API into local Postgres.
 *
 * Env:
 *   DATABASE_URL          — local DB (required)
 *   PROD_API_BASE         — default https://thinqshopping.app/api
 *   PROD_SITE_BASE        — default https://thinqshopping.app (for image downloads)
 *   SYNC_DOWNLOAD_IMAGES  — default true
 *
 * Run: npm run db:sync-catalog
 */
import { PrismaClient, Prisma } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as fs from 'fs/promises';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const PROD_API_BASE = (process.env.PROD_API_BASE || 'https://thinqshopping.app/api').replace(/\/$/, '');
const PROD_SITE_BASE = (process.env.PROD_SITE_BASE || 'https://thinqshopping.app').replace(/\/$/, '');
const SYNC_DOWNLOAD_IMAGES = process.env.SYNC_DOWNLOAD_IMAGES !== 'false';
const PAGE_LIMIT = 100;
const IMAGE_CONCURRENCY = 5;

/** Matches Nest static: app.use('/media', express.static('uploads')) → /media/files/x → uploads/files/x */
const UPLOAD_FILES_DIR = path.join(process.cwd(), 'backend', 'uploads', 'files');

function isProductionDb(): boolean {
    const dbUrl = process.env.DATABASE_URL || '';
    return (
        process.env.NODE_ENV === 'production' ||
        /\.railway\.app|\.render\.com|\.herokuapp|amazonaws\.com|supabase\.co|planetscale\.com|\.neon\.tech|coolify/i.test(
            dbUrl,
        )
    );
}

function ensureNotProduction(): void {
    if (process.env.SYNC_ALLOW_PRODUCTION === 'true') return;
    if (isProductionDb()) {
        throw new Error(
            'Refusing to sync into a production database. Point DATABASE_URL at local Postgres or set SYNC_ALLOW_PRODUCTION=true to override.',
        );
    }
}

async function fetchJson<T>(url: string): Promise<T> {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status} ${url}: ${text.slice(0, 200)}`);
    }
    return res.json() as Promise<T>;
}

type ProdCategory = {
    name: string;
    slug: string;
    description?: string | null;
    sort_order?: number;
    is_active?: boolean;
};

type ProdVariant = {
    variant_type: string;
    variant_value: string;
    sku?: string | null;
    price_adjust?: string | number;
    stock_quantity?: number;
    image?: string | null;
};

type ProdProduct = {
    name: string;
    slug: string;
    sku?: string | null;
    description?: string | null;
    short_description?: string | null;
    price: string | number;
    compare_price?: string | number | null;
    stock_quantity?: number;
    wholesale_min_quantity?: number | null;
    wholesale_discount_pct?: string | number | null;
    is_featured?: boolean;
    is_active?: boolean;
    images?: unknown;
    specifications?: unknown;
    rating_aggregate?: string | number | null;
    review_count?: number;
    category?: { slug: string; name?: string };
    variants?: ProdVariant[];
};

type ProductsPage = {
    data: ProdProduct[];
    meta: { total: number; page: number; limit: number; totalPages: number };
};

function toDecimal(value: string | number | null | undefined): Prisma.Decimal | null {
    if (value == null || value === '') return null;
    return new Prisma.Decimal(value);
}

function normalizeImages(images: unknown): string[] {
    if (!images) return [];
    if (Array.isArray(images)) return images.filter((x): x is string => typeof x === 'string' && x.length > 0);
    return [];
}

function isExternalImageRef(ref: string): boolean {
    const raw = ref.trim();
    if (/^https?:\/\//i.test(raw)) return true;
    return /\/media\/files\/https?:\/\//i.test(raw);
}

function mediaPathToFilename(mediaPath: string): string {
    const clean = mediaPath.replace(/^\/+/, '');
    const base = path.basename(clean);
    return base || clean;
}

function mediaPathToLocalFile(mediaPath: string): string {
    return path.join(UPLOAD_FILES_DIR, mediaPathToFilename(mediaPath));
}

function mediaPathToFetchUrl(mediaPath: string): string {
    const p = mediaPath.startsWith('/') ? mediaPath : `/media/files/${mediaPath}`;
    return `${PROD_SITE_BASE}/api${p}`;
}

async function downloadImage(mediaPath: string, stats: { downloaded: number; skipped: number; failed: number }): Promise<void> {
    if (isExternalImageRef(mediaPath)) {
        stats.skipped++;
        return;
    }
    const localFile = mediaPathToLocalFile(mediaPath);
    try {
        await fs.access(localFile);
        stats.skipped++;
        return;
    } catch {
        /* download */
    }
    const url = mediaPathToFetchUrl(mediaPath);
    try {
        const res = await fetch(url);
        if (!res.ok) {
            console.warn(`  image failed ${res.status}: ${url}`);
            stats.failed++;
            return;
        }
        const buf = Buffer.from(await res.arrayBuffer());
        await fs.mkdir(UPLOAD_FILES_DIR, { recursive: true });
        await fs.writeFile(localFile, buf);
        stats.downloaded++;
    } catch (err: unknown) {
        console.warn(`  image error ${url}:`, err instanceof Error ? err.message : err);
        stats.failed++;
    }
}

async function runPool<T>(items: T[], concurrency: number, fn: (item: T) => Promise<void>): Promise<void> {
    let i = 0;
    const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
        while (i < items.length) {
            const idx = i++;
            await fn(items[idx]);
        }
    });
    await Promise.all(workers);
}

async function main() {
    ensureNotProduction();
    const prisma = new PrismaClient();

    console.log(`Production API: ${PROD_API_BASE}`);
    console.log(`Local uploads:  ${UPLOAD_FILES_DIR}`);
    console.log(`Download images: ${SYNC_DOWNLOAD_IMAGES}`);

    const categories = await fetchJson<ProdCategory[]>(`${PROD_API_BASE}/products/categories`);
    const categoryBySlug = new Map<string, number>();
    let categoriesUpserted = 0;

    for (const cat of categories) {
        if (!cat.slug) continue;
        const row = await prisma.category.upsert({
            where: { slug: cat.slug },
            update: {
                name: cat.name,
                description: cat.description ?? undefined,
                sort_order: cat.sort_order ?? 0,
                is_active: cat.is_active !== false,
            },
            create: {
                name: cat.name,
                slug: cat.slug,
                description: cat.description ?? undefined,
                sort_order: cat.sort_order ?? 0,
                is_active: cat.is_active !== false,
            },
        });
        categoryBySlug.set(cat.slug, row.id);
        categoriesUpserted++;
    }
    console.log(`Categories upserted: ${categoriesUpserted}`);

    const allProducts: ProdProduct[] = [];
    let page = 1;
    let totalPages = 1;

    do {
        const res = await fetchJson<ProductsPage>(
            `${PROD_API_BASE}/products?page=${page}&limit=${PAGE_LIMIT}`,
        );
        allProducts.push(...(res.data ?? []));
        totalPages = res.meta?.totalPages ?? 1;
        console.log(`Fetched products page ${page}/${totalPages} (${res.data?.length ?? 0} items)`);
        page++;
    } while (page <= totalPages);

    let productsCreated = 0;
    let productsUpdated = 0;
    let productsSkipped = 0;
    const imagePaths = new Set<string>();

    for (const p of allProducts) {
        const categorySlug = p.category?.slug;
        if (!categorySlug) {
            console.warn(`Skip (no category): ${p.slug}`);
            productsSkipped++;
            continue;
        }
        const categoryId = categoryBySlug.get(categorySlug);
        if (!categoryId) {
            console.warn(`Skip (unknown category ${categorySlug}): ${p.slug}`);
            productsSkipped++;
            continue;
        }

        const images = normalizeImages(p.images);
        for (const img of images) imagePaths.add(img);

        const existing = await prisma.product.findUnique({ where: { slug: p.slug }, select: { id: true } });
        const productData = {
            name: p.name,
            slug: p.slug,
            sku: p.sku ?? null,
            description: p.description ?? null,
            short_description: p.short_description ?? null,
            price: toDecimal(p.price) ?? new Prisma.Decimal(0),
            compare_price: toDecimal(p.compare_price ?? null),
            stock_quantity: p.stock_quantity ?? 0,
            wholesale_min_quantity: p.wholesale_min_quantity ?? null,
            wholesale_discount_pct: toDecimal(p.wholesale_discount_pct ?? null),
            category_id: categoryId,
            images: images.length ? images : Prisma.JsonNull,
            specifications:
                p.specifications && typeof p.specifications === 'object'
                    ? (p.specifications as Prisma.InputJsonValue)
                    : Prisma.JsonNull,
            is_featured: p.is_featured ?? false,
            is_active: p.is_active !== false,
            rating_aggregate: toDecimal(p.rating_aggregate ?? null),
            review_count: p.review_count ?? 0,
        };

        const product = await prisma.product.upsert({
            where: { slug: p.slug },
            update: productData,
            create: productData,
        });

        if (existing) productsUpdated++;
        else productsCreated++;

        await prisma.productVariant.deleteMany({ where: { product_id: product.id } });
        const variants = p.variants ?? [];
        if (variants.length) {
            await prisma.productVariant.createMany({
                data: variants
                    .filter((v) => v.variant_type && v.variant_value)
                    .map((v) => ({
                        product_id: product.id,
                        variant_type: v.variant_type,
                        variant_value: v.variant_value,
                        sku: v.sku ?? null,
                        price_adjust: toDecimal(v.price_adjust) ?? new Prisma.Decimal(0),
                        stock_quantity: v.stock_quantity ?? 0,
                        image: v.image ?? null,
                    })),
            });
        }
    }

    console.log(
        `Products: ${allProducts.length} fetched, ${productsCreated} created, ${productsUpdated} updated, ${productsSkipped} skipped`,
    );

    const prodSlugs = allProducts.map((p) => p.slug);
    const deactivated = await prisma.product.updateMany({
        where: { slug: { notIn: prodSlugs }, is_active: true },
        data: { is_active: false },
    });
    if (deactivated.count > 0) {
        console.log(`Deactivated ${deactivated.count} local-only product(s) not on production.`);
    }

    const imageStats = { downloaded: 0, skipped: 0, failed: 0 };
    if (SYNC_DOWNLOAD_IMAGES && imagePaths.size > 0) {
        const paths = [...imagePaths];
        console.log(`Downloading ${paths.length} unique image paths...`);
        await runPool(paths, IMAGE_CONCURRENCY, async (mediaPath) => {
            await downloadImage(mediaPath, imageStats);
        });
        console.log(
            `Images: ${imageStats.downloaded} downloaded, ${imageStats.skipped} skipped (exists), ${imageStats.failed} failed`,
        );
    }

    const localTotal = await prisma.product.count({ where: { is_active: true } });
    console.log(`Local active products: ${localTotal}`);
    console.log('Sync completed.');

    await prisma.$disconnect();
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
