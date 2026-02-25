'use client';

import Image from 'next/image';
import { useState } from 'react';
import { ImageIcon } from 'lucide-react';

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

function resolveImageUrl(url: string): string {
    if (!url || typeof url !== 'string') return '';
    if (isExternalUrl(url)) return url;
    const base = process.env.NEXT_PUBLIC_API_URL || '';
    const path = url.startsWith('/') ? url : `/${url}`;
    return base ? `${base.replace(/\/$/, '')}${path}` : path;
}

export default function ProductImage({ src, alt, width = 400, height = 400, className = '', fill }: ProductImageProps) {
    const [error, setError] = useState(false);
    const resolvedSrc = resolveImageUrl(src);
    const unoptimized = isExternalUrl(resolvedSrc);

    if (error || !resolvedSrc) {
        return (
            <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
                <div className="flex flex-col items-center justify-center gap-2 text-gray-400">
                    <ImageIcon className="w-12 h-12" strokeWidth={1.5} />
                    <span className="text-[10px] font-medium uppercase tracking-wider">No image</span>
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
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
    );
}
