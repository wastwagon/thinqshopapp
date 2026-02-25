'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

function HeroImage({ imageUrl, fallbackUrl, alt = '' }: { imageUrl: string; fallbackUrl: string; alt?: string }) {
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
            className="object-contain object-center"
            sizes="(max-width: 768px) 100vw, 55vw"
            priority
            onError={handleError}
            unoptimized={src.startsWith('http') && !src.includes('unsplash.com')}
        />
    );
}
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
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

const HERO_IMAGES = [
    'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=85',
    'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=85',
    'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=800&q=85',
];

const FALLBACK_SLIDES: Slide[] = [
    { id: 1, title: 'Pro gear for creators', subtitle: 'Cameras, computers, and pro video — sourced globally, delivered to Ghana.', cta_text: 'Shop now', cta_url: '/shop' },
    { id: 2, title: 'International shipping to Ghana', subtitle: 'All orders shipped from abroad. Estimated delivery 7–14 days.', cta_text: 'Delivery info', cta_url: '/privacy' },
    { id: 3, title: 'Delivery in 7–14 days', subtitle: 'We ship worldwide to Ghana. Track your order from dispatch to delivery.', cta_text: 'Track order', cta_url: '/track' },
];

const MOBILE_SHORT: Record<number, { title: string }> = {
    1: { title: 'Pro gear for creators' },
    2: { title: 'International shipping · 7–14 days' },
    3: { title: 'Delivery in 7–14 days' },
};

function getMobileTitle(slide: Slide): string {
    return MOBILE_SHORT[slide.id]?.title ?? slide.title?.split('.').shift() ?? slide.title;
}

function getSlideImage(slide: Slide, index: number): string {
    if (slide.image_path && (slide.image_path.startsWith('http') || slide.image_path.startsWith('/')))
        return slide.image_path;
    return HERO_IMAGES[index % HERO_IMAGES.length] ?? HERO_IMAGES[0];
}

// ——— Premium split: text left, image right (full product visible, no stretch) ———
function HeroSlideSplit({
    slide,
    imageUrl,
    fallbackImageUrl,
    isMobile,
}: {
    slide: Slide;
    imageUrl: string;
    fallbackImageUrl: string;
    isMobile?: boolean;
}) {
    const ctaUrl = slide.cta_url || '/shop';
    const ctaText = slide.cta_text || 'Shop now';
    const title = isMobile ? getMobileTitle(slide) : slide.title;

    return (
        <div className="flex flex-col md:flex-row min-h-[420px] md:h-[480px] lg:h-[520px] max-h-[90vh] bg-slate-900">
            {/* Left: copy */}
            <div className="flex flex-col justify-center px-6 sm:px-8 lg:px-12 py-10 md:py-12 w-full md:w-[48%] md:max-w-[580px] order-2 md:order-1 shrink-0">
                <p className="text-[11px] md:text-xs font-semibold text-white uppercase tracking-widest mb-2">
                    ThinQShop
                </p>
                <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-white leading-tight mb-3">
                    {title}
                </h2>
                {!isMobile && slide.subtitle && (
                    <p className="text-sm md:text-base text-slate-300 leading-relaxed mb-6 max-w-md">
                        {slide.subtitle}
                    </p>
                )}
                <Link
                    href={ctaUrl}
                    className="inline-flex items-center gap-2 min-h-[44px] md:min-h-[48px] px-5 md:px-6 py-2.5 md:py-3 rounded-xl bg-white text-slate-900 text-sm font-semibold hover:bg-slate-100 transition-colors w-fit focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                >
                    {ctaText}
                    <ArrowRight className="w-5 h-5" aria-hidden />
                </Link>
            </div>

            {/* Right: circular frame — white bg, premium 3D styling */}
            <div className="relative w-full md:w-[52%] min-h-[240px] md:h-full flex items-center justify-center bg-slate-800/50 order-1 md:order-2">
                <div className="relative w-full h-full min-h-[240px] flex items-center justify-center p-6 md:p-8 lg:p-10">
                    <div
                        className="hero-circle-animate relative w-[min(100%,280px)] aspect-square md:w-[min(100%,320px)] md:aspect-square lg:w-[min(100%,380px)] rounded-full overflow-hidden bg-white flex items-center justify-center border border-slate-200/80"
                        style={{
                            boxShadow:
                                'inset 0 1px 2px rgba(255,255,255,0.9), inset 0 -1px 1px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06), 0 4px 6px -1px rgba(0,0,0,0.08), 0 10px 20px -5px rgba(0,0,0,0.12), 0 20px 40px -10px rgba(0,0,0,0.1)',
                        }}
                    >
                        <HeroImage
                            imageUrl={imageUrl}
                            fallbackUrl={fallbackImageUrl}
                            alt=""
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

// ——— Mobile slider ———
function HeroMobileSlider({ list }: { list: Slide[] }) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const slides = list.length ? list : FALLBACK_SLIDES;

    if (!mounted) {
        const s = slides[0];
        return (
            <section className="block md:hidden bg-slate-900" aria-label="Hero">
                <HeroSlideSplit slide={s} imageUrl={getSlideImage(s, 0)} fallbackImageUrl={HERO_IMAGES[0]} isMobile />
            </section>
        );
    }

    return (
        <section className="block md:hidden bg-slate-900" aria-label="Hero carousel">
            <Swiper
                modules={[Autoplay, Pagination]}
                spaceBetween={0}
                slidesPerView={1}
                loop
                autoplay={{ delay: 5500, disableOnInteraction: false }}
                pagination={{
                    clickable: true,
                    bulletClass: 'swiper-pagination-bullet !bg-white/50 !w-2 !h-2 !opacity-100 !transition-all',
                    bulletActiveClass: '!bg-white !w-5 !rounded-full',
                }}
                className="!overflow-hidden hero-mobile-swiper"
                touchRatio={1}
                resistanceRatio={0.85}
            >
                {slides.map((slide, idx) => (
                    <SwiperSlide key={slide.id}>
                        <HeroSlideSplit
                            slide={slide}
                            imageUrl={getSlideImage(slide, idx)}
                            fallbackImageUrl={HERO_IMAGES[idx % HERO_IMAGES.length]}
                            isMobile
                        />
                    </SwiperSlide>
                ))}
            </Swiper>
        </section>
    );
}

// ——— Desktop slider ———
function HeroDesktopSlider({ list }: { list: Slide[] }) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const slides = list.length ? list : FALLBACK_SLIDES;

    if (!mounted || slides.length <= 1) {
        const s = slides[0] ?? FALLBACK_SLIDES[0];
        return (
            <section
                className="hidden md:block bg-slate-900 border-b border-white/5"
                aria-label="Hero"
            >
                <HeroSlideSplit slide={s} imageUrl={getSlideImage(s, 0)} fallbackImageUrl={HERO_IMAGES[0]} />
            </section>
        );
    }

    return (
        <section
            className="hidden md:block bg-slate-900 border-b border-white/5"
            aria-label="Hero carousel"
        >
            <Swiper
                modules={[Autoplay, Navigation, Pagination]}
                spaceBetween={0}
                slidesPerView={1}
                loop
                autoplay={{ delay: 5000, disableOnInteraction: false }}
                pagination={{
                    clickable: true,
                    bulletClass: 'swiper-pagination-bullet !bg-white/50 !w-2.5 !h-2.5 !opacity-100',
                    bulletActiveClass: '!bg-white !w-7 !rounded-full',
                }}
                navigation={{ prevEl: '.hero-prev', nextEl: '.hero-next' }}
                className="!overflow-hidden"
            >
                {slides.map((s, idx) => (
                    <SwiperSlide key={s.id}>
                        <HeroSlideSplit slide={s} imageUrl={getSlideImage(s, idx)} fallbackImageUrl={HERO_IMAGES[idx % HERO_IMAGES.length]} />
                    </SwiperSlide>
                ))}
            </Swiper>
            <button
                type="button"
                className="hero-prev absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-slate-800/80 hover:bg-slate-700 border border-white/10 flex items-center justify-center text-white transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                aria-label="Previous slide"
            >
                <ChevronLeft className="w-5 h-5" />
            </button>
            <button
                type="button"
                className="hero-next absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-slate-800/80 hover:bg-slate-700 border border-white/10 flex items-center justify-center text-white transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                aria-label="Next slide"
            >
                <ChevronRight className="w-5 h-5" />
            </button>
        </section>
    );
}

export default function HomeHero({ slides }: { slides: Slide[] }) {
    const list = slides?.length ? slides : FALLBACK_SLIDES;

    return (
        <>
            <HeroMobileSlider list={list} />
            <HeroDesktopSlider list={list} />
        </>
    );
}
