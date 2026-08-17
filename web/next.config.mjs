import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

function loadJwtSecretFromEnvFiles() {
    if (process.env.JWT_SECRET) return;
    for (const file of [resolve(process.cwd(), '.env'), resolve(process.cwd(), '../.env')]) {
        if (!existsSync(file)) continue;
        const line = readFileSync(file, 'utf8')
            .split('\n')
            .find((row) => row.startsWith('JWT_SECRET='));
        if (!line) continue;
        process.env.JWT_SECRET = line.slice('JWT_SECRET='.length).replace(/^["']|["']$/g, '').trim();
        break;
    }
}
loadJwtSecretFromEnvFiles();

/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    poweredByHeader: false,
    staticPageGenerationTimeout: 120,
    compress: true,
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    { key: 'X-Frame-Options', value: 'DENY' },
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
                    { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=()' },
                    { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
                    {
                        key: 'Content-Security-Policy',
                        value: "default-src 'self'; script-src 'self' 'unsafe-inline' https://js.paystack.co https://checkout.paystack.com https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https://api.paystack.co https://checkout.paystack.com https://www.google-analytics.com https://www.googletagmanager.com; frame-src https://checkout.paystack.com https://js.paystack.co; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests",
                    },
                ],
            },
            {
                source: '/thinqshop-logo.webp',
                headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }],
            },
        ];
    },
    images: {
        minimumCacheTTL: 300,
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'www.bhphotovideo.com',
                port: '',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'static.bhphoto.com',
                port: '',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
                port: '',
                pathname: '/**',
            },
            { protocol: 'https', hostname: 'thinqshopping.app', port: '', pathname: '/**' },
            { protocol: 'http', hostname: 'thinqshopping.app', port: '', pathname: '/**' },
            { protocol: 'https', hostname: 'api.thinqshopping.app', port: '', pathname: '/**' },
            { protocol: 'http', hostname: 'localhost', port: '', pathname: '/**' },
        ],
    },
};

export default nextConfig;
