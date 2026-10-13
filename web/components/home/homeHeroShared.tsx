'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

export type Slide = {
    id: number;
    title: string;
    subtitle?: string | null;
    cta_text?: string | null;
    cta_url?: string | null;
    image_path?: string | null;
};

/** Mobile-first hero assets — ~1280w / q75 keeps LCP lighter than 1920@q90 */
export const HERO_IMAGES = [
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1280&q=75',
    'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1280&q=75',
    'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=1280&q=75',
    'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1280&q=75',
];

export const FALLBACK_SLIDES: Slide[] = [
    {
        id: 1,
        title: 'Shop electronics & pro gear',
        subtitle: 'Cameras, computers, and imaging — sourced globally, delivered to Ghana. Pay in GHS.',
        cta_text: 'Shop now',
        cta_url: '/shop',
        image_path: HERO_IMAGES[0],
    },
    {
        id: 2,
        title: 'International shipping to Ghana',
        subtitle: 'Reliable delivery in 7–14 days. Track your order from dispatch to your door.',
        cta_text: 'View delivery info',
        cta_url: '/terms',
        image_path: HERO_IMAGES[1],
    },
    {
        id: 3,
        title: 'Tech that works where you work',
        subtitle: 'From content creators to professionals — the right gear, transparent pricing.',
        cta_text: 'Browse categories',
        cta_url: '/shop',
        image_path: HERO_IMAGES[2],
    },
    {
        id: 4,
        title: 'Pro cameras & imaging',
        subtitle: 'Mirrorless, cinema, and instant — order online, we handle the rest.',
        cta_text: 'Shop photography',
        cta_url: '/shop',
        image_path: HERO_IMAGES[3],
    },
];

export function getSlideImage(slide: Slide, index: number): string {
    if (slide.image_path && (slide.image_path.startsWith('http') || slide.image_path.startsWith('/'))) {
        return slide.image_path;
    }
    return HERO_IMAGES[index % HERO_IMAGES.length] ?? HERO_IMAGES[0];
}

function HeroSlideImage({
    imageUrl,
    fallbackUrl,
    alt = '',
    priority = false,
}: {
    imageUrl: string;
    fallbackUrl: string;
    alt?: string;
    priority?: boolean;
}) {
    const [src, setSrc] = useState(imageUrl);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        setSrc(imageUrl);
        setFailed(false);
    }, [imageUrl]);

    const handleError = () => {
        if (!failed) {
            setFailed(true);
            setSrc(fallbackUrl);
        }
    };

    return (
        <Image
            src={src}
            alt={alt}
            fill
            className="object-cover object-center"
            sizes="100vw"
            quality={75}
            priority={priority}
            loading={priority ? undefined : 'lazy'}
            onError={handleError}
            unoptimized={src.startsWith('http') && !src.includes('unsplash.com')}
        />
    );
}

export function HeroSlideCard({
    slide,
    imageUrl,
    fallbackImageUrl,
    priority = false,
}: {
    slide: Slide;
    imageUrl: string;
    fallbackImageUrl: string;
    priority?: boolean;
}) {
    const ctaUrl = slide.cta_url || '/shop';
    const ctaText = slide.cta_text || 'Shop now';
    const hasPrice = slide.subtitle && /[\d$€£¢₵GHS]/.test(slide.subtitle);

    return (
        <div className="relative w-full h-full min-h-[420px] sm:min-h-[480px] md:min-h-[520px] lg:min-h-[560px] max-h-[85vh] overflow-hidden bg-slate-950">
            <div className="absolute inset-0">
                <HeroSlideImage
                    imageUrl={imageUrl}
                    fallbackUrl={fallbackImageUrl}
                    alt={slide.title}
                    priority={priority}
                />
            </div>
            <div
                className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/50 to-slate-900/20"
                aria-hidden
            />
            <div
                className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-transparent pointer-events-none"
                aria-hidden
            />
            <div className="absolute inset-0 flex flex-col justify-end">
                <div className="px-5 sm:px-8 md:px-10 lg:px-14 pb-8 sm:pb-10 md:pb-12 lg:pb-14 pt-20">
                    <div className="max-w-xl">
                        <p className="text-xs font-medium text-blue-300 mb-2 drop-shadow-sm">ThinQShop</p>
                        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold text-white tracking-tight leading-tight mb-3">
                            {slide.title}
                        </h2>
                        {slide.subtitle && (
                            <p className={`text-sm sm:text-base mb-5 ${hasPrice ? 'text-white/90 font-medium' : 'text-slate-300'}`}>
                                {slide.subtitle}
                            </p>
                        )}
                        <Link
                            href={ctaUrl}
                            className="inline-flex items-center gap-2 min-h-[44px] sm:min-h-[48px] px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors w-fit focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                        >
                            {ctaText}
                            <ArrowRight className="w-5 h-5 shrink-0" aria-hidden />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
