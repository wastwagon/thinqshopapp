import type { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thinqshopping.app';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'ThinQShopping',
        short_name: 'ThinQShop',
        description: 'Shop electronics and imaging systems delivered to Ghana. Money transfer, logistics, and procurement.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#f8fafc',
        theme_color: '#02274f',
        orientation: 'portrait-primary',
        icons: [
            { src: '/thinqshop-icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: '/thinqshop-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        ],
    };
}
