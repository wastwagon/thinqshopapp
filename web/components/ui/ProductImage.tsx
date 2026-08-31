'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { ImageIcon } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';

interface ProductImageProps {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    className?: string;
    fill?: boolean;
}

function isExternalUrl(url: string): boolean {
    return typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://'));
}

const OPTIMIZABLE_HOSTS = new Set([
    'images.unsplash.com',
    'www.bhphotovideo.com',
    'static.bhphoto.com',
    'thinqshopping.app',
    'www.thinqshopping.app',
    'api.thinqshopping.app',
]);

function shouldUnoptimize(url: string): boolean {
    if (!url) return true;
    if (!isExternalUrl(url)) return false;
    try {
        return !OPTIMIZABLE_HOSTS.has(new URL(url).hostname);
    } catch {
        return true;
    }
}

function resolveImageUrl(url: string): string {
    if (!url || typeof url !== 'string') return '';
    if (isExternalUrl(url)) return url;
    // Same-origin /api proxy avoids Cross-Origin-Resource-Policy issues with direct API host URLs.
    return getMediaUrl(url);
}

export function shouldUnoptimizeProductImage(url: string): boolean {
    return shouldUnoptimize(url);
}

export default function ProductImage({ src, alt, width = 400, height = 400, className = '', fill }: ProductImageProps) {
    const [error, setError] = useState(false);
    const resolvedSrc = resolveImageUrl(src);
    const unoptimized = shouldUnoptimize(resolvedSrc);

    useEffect(() => {
        setError(false);
    }, [resolvedSrc]);

    if (error || !resolvedSrc) {
        return (
            <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
                <div className="flex flex-col items-center justify-center gap-2 text-gray-400">
                    <ImageIcon className="w-12 h-12" strokeWidth={1.5} />
                    <span className="text-xs font-medium uppercase tracking-wider">No image</span>
                </div>
            </div>
        );
    }

    return (
        <Image
            src={resolvedSrc}
            alt={alt}
            width={fill ? undefined : width}
            height={fill ? undefined : height}
            fill={fill}
            className={className}
            unoptimized={unoptimized}
            onError={() => setError(true)}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1536px) 20vw, 16vw"
        />
    );
}
