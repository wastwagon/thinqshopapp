import { MetadataRoute } from 'next';

const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://thinqshopping.app';
const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7000';

async function fetchProductSlugs(): Promise<string[]> {
    try {
        const slugs: string[] = [];
        let page = 1;
        const limit = 100;
        let hasMore = true;
        while (hasMore) {
            const res = await fetch(`${apiBase}/products?page=${page}&limit=${limit}`, { next: { revalidate: 3600 } });
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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const staticEntries: MetadataRoute.Sitemap = [
        { url: base, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
        { url: `${base}/shop`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
        { url: `${base}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
        { url: `${base}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
        { url: `${base}/terms`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
        { url: `${base}/privacy`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    ];

    const slugs = await fetchProductSlugs();
    const productEntries: MetadataRoute.Sitemap = slugs.map((slug) => ({
        url: `${base}/products/${slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
    }));

    return [...staticEntries, ...productEntries];
}
