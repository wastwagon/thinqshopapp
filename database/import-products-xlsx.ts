/**
 * Import products from Excel catalog into local Postgres.
 *
 * Env:
 *   DATABASE_URL              — local DB (required)
 *   IMPORT_XLSX_PATH          — default {repoRoot}/thinqapp thinqshopping.xlsx
 *   IMPORT_PLACEHOLDER_PRICE  — default 100 (GHS when Price cell is empty)
 *   IMPORT_ALLOW_PRODUCTION   — set true to override production DB guard
 *
 * Run: npm run db:import-xlsx
 */
import { PrismaClient, Prisma } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const DEFAULT_XLSX = path.join(process.cwd(), 'thinqapp thinqshopping.xlsx');
const PLACEHOLDER_PRICE = Number(process.env.IMPORT_PLACEHOLDER_PRICE) || 100;

type XlsxRow = Record<string, string | number | undefined>;

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
    if (process.env.IMPORT_ALLOW_PRODUCTION === 'true') return;
    if (isProductionDb()) {
        throw new Error(
            'Refusing to import into a production database. Point DATABASE_URL at local Postgres or set IMPORT_ALLOW_PRODUCTION=true to override.',
        );
    }
}

function slugify(name: string): string {
    return (
        name
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '') || `product-${Date.now()}`
    );
}

function categorySlug(name: string): string {
    return name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

function cellStr(row: XlsxRow, key: string): string {
    const v = row[key];
    if (v == null) return '';
    return String(v).trim();
}

function parseYesNo(value: string): boolean {
    return value.trim().toLowerCase() === 'yes';
}

function parseActive(value: string): boolean {
    return value.trim().toLowerCase() === 'active';
}

function parseOptionalNumber(value: string): number | null {
    if (!value.trim()) return null;
    const n = parseFloat(value.replace(/[^0-9.]/g, ''));
    return Number.isFinite(n) ? n : null;
}

function parseOptionalInt(value: string): number | null {
    if (!value.trim()) return null;
    const n = parseInt(value.replace(/[^0-9]/g, ''), 10);
    return Number.isFinite(n) ? n : null;
}

function parsePrice(value: string): Prisma.Decimal {
    const n = parseOptionalNumber(value);
    return new Prisma.Decimal(n != null && n > 0 ? n : PLACEHOLDER_PRICE);
}

function parseSpecifications(raw: string): Record<string, string> | null {
    if (!raw.trim()) return null;
    const obj: Record<string, string> = {};
    for (const line of raw.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        const idx = trimmed.indexOf(':');
        if (idx > 0) {
            const k = trimmed.slice(0, idx).trim();
            const v = trimmed.slice(idx + 1).trim();
            if (k) obj[k] = v;
        }
    }
    return Object.keys(obj).length ? obj : null;
}

function normalizeImagePath(filename: string): string {
    const f = filename.trim();
    if (!f) return '';
    if (/^https?:\/\//i.test(f)) return f;
    if (f.startsWith('/media/')) return f;
    return `/media/files/${f.replace(/^\/+/, '')}`;
}

function parseImages(featured: string, gallery: string): string[] {
    const images: string[] = [];
    const feat = normalizeImagePath(featured);
    if (feat) images.push(feat);
    if (gallery.trim()) {
        const parts = gallery.split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean);
        for (const p of parts) {
            const norm = normalizeImagePath(p);
            if (norm && !images.includes(norm)) images.push(norm);
        }
    }
    return images;
}

async function main() {
    ensureNotProduction();

    const xlsxPath = process.env.IMPORT_XLSX_PATH || DEFAULT_XLSX;
    if (!fs.existsSync(xlsxPath)) {
        throw new Error(`XLSX not found: ${xlsxPath}`);
    }

    console.log(`Reading: ${xlsxPath}`);
    console.log(`Placeholder price (empty cells): ${PLACEHOLDER_PRICE} GHS`);

    const workbook = XLSX.readFile(xlsxPath);
    const sheetName = workbook.SheetNames[0];
    const rows = XLSX.utils.sheet_to_json<XlsxRow>(workbook.Sheets[sheetName], { defval: '' });

    const prisma = new PrismaClient();
    const categorySlugs = new Set<string>();
    let created = 0;
    let updated = 0;
    let skipped = 0;
    let variableWithoutVariants = 0;

    for (const row of rows) {
        const name = cellStr(row, 'Name');
        if (!name) {
            skipped++;
            continue;
        }

        const categoryName = cellStr(row, 'Category') || 'Uncategorized';
        const catSlug = categorySlug(categoryName);
        const category = await prisma.category.upsert({
            where: { slug: catSlug },
            update: { name: categoryName },
            create: { name: categoryName, slug: catSlug },
        });
        categorySlugs.add(catSlug);

        const slug = slugify(name);
        const productType = cellStr(row, 'Product type').toLowerCase();
        const isVariable = productType === 'variable';
        if (isVariable) variableWithoutVariants++;

        const price = parsePrice(cellStr(row, 'Price (GHS)'));
        const compareRaw = parseOptionalNumber(cellStr(row, 'Compare price (GHS)'));
        const specs = parseSpecifications(cellStr(row, 'Specifications'));
        const images = parseImages(cellStr(row, 'Featured image'), cellStr(row, 'Gallery images'));

        const productData = {
            name,
            slug,
            short_description: cellStr(row, 'Short description') || null,
            description: cellStr(row, 'Description') || null,
            price,
            compare_price: compareRaw != null ? new Prisma.Decimal(compareRaw) : null,
            stock_quantity: 100,
            category_id: category.id,
            images: images.length ? images : Prisma.JsonNull,
            specifications: specs ? (specs as Prisma.InputJsonValue) : Prisma.JsonNull,
            is_featured: parseYesNo(cellStr(row, 'Show in Featured')),
            is_active: parseActive(cellStr(row, 'Status')),
            wholesale_min_quantity: parseOptionalInt(cellStr(row, 'Minimum quantity for wholesale')),
            wholesale_discount_pct:
                parseOptionalNumber(cellStr(row, 'Wholesale discount (%)')) != null
                    ? new Prisma.Decimal(parseOptionalNumber(cellStr(row, 'Wholesale discount (%)'))!)
                    : null,
        };

        const existing = await prisma.product.findUnique({ where: { slug }, select: { id: true } });
        const product = await prisma.product.upsert({
            where: { slug },
            update: productData,
            create: productData,
        });

        if (isVariable) {
            await prisma.productVariant.deleteMany({ where: { product_id: product.id } });
        }

        if (existing) updated++;
        else created++;
    }

    console.log(`Categories upserted: ${categorySlugs.size} (${[...categorySlugs].join(', ')})`);
    console.log(`Products: ${rows.length} rows, ${created} created, ${updated} updated, ${skipped} skipped`);
    if (variableWithoutVariants > 0) {
        console.warn(
            `Note: ${variableWithoutVariants} "Variable" product(s) imported without variants — add options in Admin → Products.`,
        );
    }

    const activeTotal = await prisma.product.count({ where: { is_active: true } });
    console.log(`Local active products: ${activeTotal}`);
    console.log('Import completed.');

    await prisma.$disconnect();
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
