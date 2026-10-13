'use client';

import { useEffect, useState, type ComponentType } from 'react';
import {
    FALLBACK_SLIDES,
    HERO_IMAGES,
    HeroSlideCard,
    getSlideImage,
    type Slide,
} from './homeHeroShared';

export type { Slide };

function HeroStaticFirst({ list }: { list: Slide[] }) {
    const s = list[0] ?? FALLBACK_SLIDES[0];
    return (
        <section className="relative bg-slate-900" aria-label="Hero">
            <HeroSlideCard
                slide={s}
                imageUrl={getSlideImage(s, 0)}
                fallbackImageUrl={HERO_IMAGES[0]}
                priority
            />
        </section>
    );
}

export default function HomeHero({ slides }: { slides: Slide[] }) {
    const list = slides?.length ? slides : FALLBACK_SLIDES;
    const [Carousel, setCarousel] = useState<ComponentType<{ list: Slide[] }> | null>(null);

    useEffect(() => {
        if (list.length <= 1) return;
        let cancelled = false;

        const load = () => {
            import('./HomeHeroCarousel')
                .then((mod) => {
                    if (!cancelled) setCarousel(() => mod.default);
                })
                .catch(() => {
                    /* keep static hero */
                });
        };

        // Prefer idle so LCP/JS execution aren't competing with Swiper download+parse.
        const w = window as Window & {
            requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
            cancelIdleCallback?: (id: number) => void;
        };
        if (typeof w.requestIdleCallback === 'function') {
            const id = w.requestIdleCallback(load, { timeout: 1500 });
            return () => {
                cancelled = true;
                w.cancelIdleCallback?.(id);
            };
        }
        const t = window.setTimeout(load, 250);
        return () => {
            cancelled = true;
            window.clearTimeout(t);
        };
    }, [list.length]);

    if (list.length <= 1 || !Carousel) {
        return <HeroStaticFirst list={list} />;
    }

    return <Carousel list={list} />;
}
