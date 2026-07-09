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
            { src: '/thinqshop-logo.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
            { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
    };
}
