'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade, Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import {
    FALLBACK_SLIDES,
    HERO_IMAGES,
    HeroSlideCard,
    getSlideImage,
    type Slide,
} from './homeHeroShared';

export default function HomeHeroCarousel({ list }: { list: Slide[] }) {
    const [activeIndex, setActiveIndex] = useState(0);
    const slides = list.length ? list : FALLBACK_SLIDES;
    const slideCount = slides.length;

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
                            priority={idx === 0}
                        />
                    </SwiperSlide>
                ))}
            </Swiper>

            {slideCount > 1 && (
                <div className="absolute bottom-0 left-0 right-0 z-10 h-0.5 bg-white/20 overflow-hidden">
                    <div key={activeIndex} className="h-full bg-white origin-left hero-progress-bar" />
                </div>
            )}

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
