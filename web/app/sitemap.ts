import { MetadataRoute } from 'next';

const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://thinqshopping.app';
const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7000';

const FETCH_TIMEOUT_MS = 5000;
const isCI = process.env.CI === 'true';

async function fetchProductSlugs(): Promise<string[]> {
    if (isCI) return [];
    try {
        const slugs: string[] = [];
        let page = 1;
        const limit = 100;
        let hasMore = true;
        while (hasMore) {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
            const res = await fetch(`${apiBase}/products?page=${page}&limit=${limit}`, {
                next: { revalidate: 3600 },
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            if (!res.ok) break;
            const json = await res.json();
            const data = json?.data ?? [];
            const meta = json?.meta ?? {};
            data.forEach((p: { slug?: string }) => {
                if (p?.slug) slugs.push(p.slug);
            });
            hasMore = data.length === limit && (meta.totalPages ?? 1) > page;
            page += 1;
            if (page > 50) break;
        }
        return slugs;
    } catch {
        return [];
    }
}

async function fetchCategorySlugs(): Promise<string[]> {
    if (isCI) return [];
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
        const res = await fetch(`${apiBase}/products/categories`, {
            next: { revalidate: 3600 },
            signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (!res.ok) return [];
        const data = await res.json();
        if (!Array.isArray(data)) return [];
        return data
            .map((c: { slug?: string }) => c?.slug)
            .filter((slug): slug is string => typeof slug === 'string' && slug.length > 0);
    } catch {
        return [];
    }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const staticEntries: MetadataRoute.Sitemap = [
        { url: base, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
        { url: `${base}/shop`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
        { url: `${base}/track`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
        { url: `${base}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
        { url: `${base}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
        { url: `${base}/terms`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
        { url: `${base}/privacy`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    ];

    const [slugs, categorySlugs] = await Promise.all([fetchProductSlugs(), fetchCategorySlugs()]);
    const productEntries: MetadataRoute.Sitemap = slugs.map((slug) => ({
        url: `${base}/products/${slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
    }));
    const categoryEntries: MetadataRoute.Sitemap = categorySlugs.map((slug) => ({
        url: `${base}/shop/${slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
    }));

    return [...staticEntries, ...categoryEntries, ...productEntries];
}
