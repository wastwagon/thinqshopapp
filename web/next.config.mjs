/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    staticPageGenerationTimeout: 120,
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
