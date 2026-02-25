/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    staticPageGenerationTimeout: 120,
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
