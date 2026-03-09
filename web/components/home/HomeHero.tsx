'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade, Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

export type Slide = {
    id: number;
    title: string;
    subtitle?: string | null;
    cta_text?: string | null;
    cta_url?: string | null;
    image_path?: string | null;
};

// Premium e-commerce hero imagery — consistent 16:9 hero size (1920×1080) for no layout shift
const HERO_IMAGES = [
    'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1920&q=90', // electronics / tech products
    'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1920&q=90',   // delivery / shipping
    'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=1920&q=90', // laptop / tech workspace
    'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=1920&q=90', // camera / pro gear
];

const FALLBACK_SLIDES: Slide[] = [
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
        cta_url: '/privacy',
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

function getSlideImage(slide: Slide, index: number): string {
    if (slide.image_path && (slide.image_path.startsWith('http') || slide.image_path.startsWith('/')))
        return slide.image_path;
    return HERO_IMAGES[index % HERO_IMAGES.length] ?? HERO_IMAGES[0];
}

function HeroSlideImage({ imageUrl, fallbackUrl, alt = '' }: { imageUrl: string; fallbackUrl: string; alt?: string }) {
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
            priority
            onError={handleError}
            unoptimized={src.startsWith('http') && !src.includes('unsplash.com')}
        />
    );
}

// ——— Single slide: full-bleed image + gradient overlay + content ———
function HeroSlideCard({
    slide,
    imageUrl,
    fallbackImageUrl,
    index,
}: {
    slide: Slide;
    imageUrl: string;
    fallbackImageUrl: string;
    index: number;
}) {
    const ctaUrl = slide.cta_url || '/shop';
    const ctaText = slide.cta_text || 'Shop now';
    const hasPrice = slide.subtitle && /[\d$€£¢₵GHS]/.test(slide.subtitle);

    return (
        <div className="relative w-full h-full min-h-[420px] sm:min-h-[480px] md:min-h-[520px] lg:min-h-[560px] max-h-[85vh] overflow-hidden bg-slate-900">
            {/* Full-bleed image */}
            <div className="absolute inset-0">
                <HeroSlideImage
                    imageUrl={imageUrl}
                    fallbackUrl={fallbackImageUrl}
                    alt={slide.title}
                />
            </div>
            {/* Gradient overlay for readability */}
            <div
                className="absolute inset-0 bg-gradient-to-t from-slate-900/95 via-slate-900/40 to-transparent"
                aria-hidden
            />
            {/* Content */}
            <div className="absolute inset-0 flex flex-col justify-end">
                <div className="px-5 sm:px-8 md:px-10 lg:px-14 pb-8 sm:pb-10 md:pb-12 lg:pb-14 pt-20">
                    <div className="max-w-xl">
                        <p className="text-[11px] sm:text-xs font-semibold text-white/80 uppercase tracking-[0.2em] mb-2">
                            ThinQShop
                        </p>
                        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight mb-3">
                            {slide.title}
                        </h2>
                        {slide.subtitle && (
                            <p className={`text-sm sm:text-base mb-5 ${hasPrice ? 'text-white/90 font-medium' : 'text-slate-300'}`}>
                                {slide.subtitle}
                            </p>
                        )}
                        <Link
                            href={ctaUrl}
                            className="inline-flex items-center gap-2 min-h-[44px] sm:min-h-[48px] px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-white text-slate-900 text-sm font-semibold hover:bg-slate-100 transition-colors w-fit focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
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

// ——— Mobile & desktop: one carousel with fade, progress-style pagination ———
function HeroCarousel({ list }: { list: Slide[] }) {
    const [mounted, setMounted] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => setMounted(true), []);

    const slides = list.length ? list : FALLBACK_SLIDES;
    const slideCount = slides.length;

    if (!mounted) {
        const s = slides[0];
        return (
            <section className="relative bg-slate-900" aria-label="Hero">
                <HeroSlideCard
                    slide={s}
                    imageUrl={getSlideImage(s, 0)}
                    fallbackImageUrl={HERO_IMAGES[0]}
                    index={0}
                />
            </section>
        );
    }

    return (
        <section className="relative bg-slate-900" aria-label="Hero carousel">
            <Swiper
                onSlideChange={(s) => setActiveIndex(s.realIndex)}
                modules={[Autoplay, EffectFade, Navigation, Pagination]}
                effect="fade"
                fadeEffect={{ crossFade: true }}
                spaceBetween={0}
                slidesPerView={1}
                loop
                autoplay={{ delay: 5000, disableOnInteraction: false }}
                pagination={{
                    clickable: true,
                    bulletClass: 'hero-bullet',
                    bulletActiveClass: 'hero-bullet-active',
                }}
                navigation={{ prevEl: '.hero-prev', nextEl: '.hero-next' }}
                className="hero-swiper !overflow-hidden"
            >
                {slides.map((slide, idx) => (
                    <SwiperSlide key={slide.id}>
                        <HeroSlideCard
                            slide={slide}
                            imageUrl={getSlideImage(slide, idx)}
                            fallbackImageUrl={HERO_IMAGES[idx % HERO_IMAGES.length]}
                            index={idx}
                        />
                    </SwiperSlide>
                ))}
            </Swiper>

            {/* Progress bar (fills over autoplay interval, resets per slide) */}
            {slideCount > 1 && (
                <div className="absolute bottom-0 left-0 right-0 z-10 h-0.5 bg-white/20 overflow-hidden">
                    <div
                        key={activeIndex}
                        className="h-full bg-white origin-left hero-progress-bar"
                    />
                </div>
            )}

            {/* Arrows - desktop only, minimal */}
            {slideCount > 1 && (
                <>
                    <button
                        type="button"
                        className="hero-prev absolute left-3 md:left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-11 md:h-11 rounded-full bg-black/30 hover:bg-black/50 border border-white/10 flex items-center justify-center text-white transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 hidden sm:flex"
                        aria-label="Previous slide"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                        type="button"
                        className="hero-next absolute right-3 md:right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-11 md:h-11 rounded-full bg-black/30 hover:bg-black/50 border border-white/10 flex items-center justify-center text-white transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 hidden sm:flex"
                        aria-label="Next slide"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </>
            )}
        </section>
    );
}

export default function HomeHero({ slides }: { slides: Slide[] }) {
    const list = slides?.length ? slides : FALLBACK_SLIDES;

    return (
        <>
            <HeroCarousel list={list} />
        </>
    );
}
