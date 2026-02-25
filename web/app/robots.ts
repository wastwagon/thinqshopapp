import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://thinqshopping.app';
    return {
        rules: [
            { userAgent: '*', allow: '/' },
            { userAgent: '*', disallow: ['/admin', '/dashboard', '/checkout', '/account'] },
        ],
        sitemap: `${base}/sitemap.xml`,
    };
}
