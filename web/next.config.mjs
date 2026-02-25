/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    staticPageGenerationTimeout: 120,
    // Removed rewrites: they used NEXT_PUBLIC_API_URL (localhost) at build time, failing in Docker.
    // API route app/api/[...path]/route.ts proxies using BACKEND_URL at runtime (http://backend:7000 in Docker).
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
                ],
            },
        ];
    },
    images: {
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
            { protocol: 'http', hostname: 'localhost', port: '', pathname: '/**' },
        ],
    },
};

export default nextConfig;
