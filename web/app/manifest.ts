import type { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thinqshopping.app';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'ThinQShopping',
        short_name: 'ThinQShop',
        description: 'Shop premium electronics and imaging systems delivered to Ghana. Money transfer, logistics, and procurement.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#f8fafc',
        theme_color: '#2563eb',
        orientation: 'portrait-primary',
        icons: [
            { src: '/thinqshop-logo.webp', sizes: 'any', type: 'image/webp', purpose: 'any' },
            { src: '/favicon.gif', sizes: 'any', type: 'image/gif', purpose: 'any' },
        ],
    };
}
