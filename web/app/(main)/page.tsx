'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    Zap,
    ArrowRight,
    ChevronRight,
    Flame,
    Camera,
    Monitor,
    Video,
    Mic2,
    Gamepad2,
    Cpu,
    Package,
    Lightbulb,
    Plane,
    Home as HomeIconLucide,
    type LucideIcon,
} from 'lucide-react';
import products from '@/lib/data/scraped_products.json';
import api from '@/lib/axios';
import ProductCard from '@/components/ui/ProductCard';
import ShopLayout from '@/components/layout/ShopLayout';
import HomeHero from '@/components/home/HomeHero';
import TrustStrip from '@/components/home/TrustStrip';
import TestimonialsBlock from '@/components/home/TestimonialsBlock';
import { STATIC_CATEGORIES as CATEGORY_CATALOG } from '@/lib/product-utils';

type Product = {
    category: string | { name: string; slug: string };
    name: string;
    price: string | number;
    gallery_images?: string[];
    images?: string[];
    image?: string;
    compare_price?: string | number;
    id?: number;
    slug?: string;
    [k: string]: unknown;
};

function normalizeProduct(p: any, index: number): Product {
    const categoryName = typeof p.category === 'object' ? p.category?.name : p.category;
    const price = typeof p.price === 'string' ? p.price : String(p.price ?? 0);
    let imgArr: string[] = [];
    if (Array.isArray(p.gallery_images) && p.gallery_images.length) imgArr = p.gallery_images.filter(Boolean);
    else if (Array.isArray(p.images) && p.images.length) imgArr = p.images.filter(Boolean);
    else if (p.images && typeof p.images === 'string') imgArr = [p.images];
    else if (p.image) imgArr = [p.image];
    return {
        ...p,
        id: p.id ?? index + 1,
        slug: p.slug ?? (typeof p.name === 'string' ? p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') : String(index)),
        category: categoryName ?? 'Uncategorized',
        gallery_images: imgArr.length ? imgArr : p.gallery_images,
        images: imgArr.length ? imgArr : p.images,
        price,
    };
}

const CATEGORY_ICONS: Record<string, LucideIcon> = {
    Camera,
    Monitor,
    Video,
    Mic2,
    Gamepad2,
    Cpu,
    Package,
    Lightbulb,
    Plane,
    Home: HomeIconLucide,
};

/** Six distinct gradient themes (orange-led + complementary) for category tiles */
const CATEGORY_CARD_THEMES = [
    {
        gradient: 'bg-gradient-to-br from-orange-400 via-orange-500 to-amber-600',
        ring: 'ring-orange-200/60 hover:ring-orange-300/80',
        orb: 'bg-amber-300/30',
    },
    {
        gradient: 'bg-gradient-to-br from-blue-500 via-indigo-600 to-violet-700',
        ring: 'ring-blue-200/50 hover:ring-blue-300/70',
        orb: 'bg-sky-300/25',
    },
    {
        gradient: 'bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-700',
        ring: 'ring-emerald-200/50 hover:ring-emerald-300/70',
        orb: 'bg-emerald-200/25',
    },
    {
        gradient: 'bg-gradient-to-br from-rose-400 via-fuchsia-500 to-purple-700',
        ring: 'ring-rose-200/50 hover:ring-rose-300/70',
        orb: 'bg-pink-300/25',
    },
    {
        gradient: 'bg-gradient-to-br from-amber-400 via-orange-500 to-red-600',
        ring: 'ring-amber-200/60 hover:ring-amber-300/80',
        orb: 'bg-orange-300/25',
    },
    {
        gradient: 'bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-700',
        ring: 'ring-sky-200/50 hover:ring-sky-300/70',
        orb: 'bg-blue-300/20',
    },
] as const;

function buildSixCategories(apiList: { name: string; slug: string }[]): { name: string; slug: string }[] {
    const seen = new Set<string>();
    const out: { name: string; slug: string }[] = [];
    for (const c of apiList) {
        if (out.length >= 6) break;
        const slug = (c.slug || '').trim() || c.name.toLowerCase().replace(/\s+/g, '-');
        if (seen.has(slug)) continue;
        out.push({ name: c.name, slug });
        seen.add(slug);
    }
    for (const def of CATEGORY_CATALOG) {
        if (out.length >= 6) break;
        if (!seen.has(def.slug)) {
            out.push({ name: def.name, slug: def.slug });
            seen.add(def.slug);
        }
    }
    return out.slice(0, 6);
}

function categoryIconForSlug(slug: string): LucideIcon {
    const def = CATEGORY_CATALOG.find((c) => c.slug === slug);
    const key = def?.icon ?? 'Package';
    return CATEGORY_ICONS[key] ?? Package;
}

type HeroSlide = { id: number; title: string; subtitle?: string | null; cta_text?: string | null; cta_url?: string | null; image_path?: string | null };
type TrustBadge = { id: number; icon: string; label: string; optional_link?: string | null };
type Testimonial = { id: number; quote: string; author_name: string; author_role?: string | null };

export default function Home() {
    const [mounted, setMounted] = useState(false);
    const [productsList, setProductsList] = useState<Product[]>([]);
    const [categories, setCategories] = useState<{ name: string; slug: string }[]>([]);
    const [source, setSource] = useState<'api' | 'static'>('static');
    const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
    const [trustBadges, setTrustBadges] = useState<TrustBadge[]>([]);
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;
        const load = async () => {
            try {
                const [productsRes, categoriesRes, heroRes, trustRes, testimonialRes] = await Promise.all([
                    api.get('/products', { params: { limit: 100 } }),
                    api.get('/products/categories'),
                    api.get('/content/hero-slides').catch(() => ({ data: [] })),
                    api.get('/content/trust-badges').catch(() => ({ data: [] })),
                    api.get('/content/testimonials').catch(() => ({ data: [] })),
                ]);
                const apiProducts = productsRes.data?.data ?? productsRes.data ?? [];
                const apiCategories = categoriesRes.data ?? [];
                const contentHeroSlides = Array.isArray(heroRes.data) ? heroRes.data : [];
                setTrustBadges(Array.isArray(trustRes.data) ? trustRes.data : []);
                setTestimonials(Array.isArray(testimonialRes.data) ? testimonialRes.data : []);
                if (apiProducts.length > 0 && Array.isArray(apiProducts)) {
                    const list = apiProducts.map((p: any, i: number) => normalizeProduct(p, i));
                    setProductsList(list);
                    setCategories(apiCategories.map((c: any) => ({ name: c.name, slug: c.slug })));
                    setSource('api');
                    setHeroSlides(contentHeroSlides);
                    return;
                }
            } catch (_) {
                // Fall through to static
            }
            const staticProducts = (products as Product[]).map((p, i) => normalizeProduct({ ...p, id: p.id ?? i + 1 }, i));
            setProductsList(staticProducts);
            setCategories(CATEGORY_CATALOG.map((c) => ({ name: c.name, slug: c.slug })));
            setSource('static');
            setHeroSlides([]);
        };
        load();
    }, [mounted]);

    const productsWithIds = productsList;

    const featured = productsWithIds.filter((p: Product) => (source === 'api' && (p as any).is_featured) || source === 'static').slice(0, 8);
    const fallbackFeatured = featured.length ? featured : productsWithIds.slice(0, 8);
    const flashSales = productsWithIds.filter(p => p.compare_price || Number(String(p.price).replace(/[^0-9.]/g, '')) < 1000).slice(0, 6);
    const fallbackFlash = flashSales.length ? flashSales : productsWithIds.slice(0, 6);
    const allProducts = productsWithIds;

    const categoryCards = useMemo(() => buildSixCategories(categories), [categories]);

    if (!mounted) return null;

    return (
        <ShopLayout>
            <div className="min-h-screen bg-app">
                {/* Hero (API or fallback) — mobile-first */}
                <HomeHero slides={heroSlides} />
                {/* Trust strip (API) */}
                <TrustStrip badges={trustBadges} />

                {productsWithIds.length === 0 ? (
                    <div className="min-h-[40vh] flex items-center justify-center px-4">
                        <div className="animate-pulse text-sm text-gray-500">Loading products…</div>
                    </div>
                ) : (
                    <>
                {/* Featured Deals */}
                <section className="py-8 sm:py-12 relative">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand/15 ring-1 ring-brand/20 shadow-sm">
                                    <Zap className="w-5 h-5 text-brand" />
                                </span>
                                <div>
                                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">Featured Deals</h2>
                                    <p className="text-xs text-gray-500">Hand-picked offers</p>
                                </div>
                            </div>
                            <Link
                                href="/shop"
                                className="text-xs font-semibold text-brand hover:text-brand/90 flex items-center gap-1 transition-colors"
                            >
                                View all
                                <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-6">
                            {fallbackFlash.map((product, idx) => (
                                <motion.div
                                    key={product.slug || idx}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                >
                                    <ProductCard product={product as any} />
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Featured Products */}
                <section className="py-8 sm:py-12 bg-white/90 backdrop-blur-sm border-y border-gray-100/80 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6)]">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600/10 ring-1 ring-blue-600/15">
                                    <Flame className="w-5 h-5 text-blue-600" />
                                </span>
                                <div>
                                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">Featured</h2>
                                    <p className="text-xs text-gray-500">Hand-picked favorites</p>
                                </div>
                            </div>
                            <Link
                                href="/shop"
                                className="text-xs font-semibold text-brand hover:text-brand/90 flex items-center gap-1 transition-colors"
                            >
                                View all
                                <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                            {fallbackFeatured.map((product, idx) => (
                                <motion.div
                                    key={product.slug || idx}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                >
                                    <ProductCard product={product as any} />
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Shop All Categories */}
                <section className="py-8 sm:py-12">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6">
                        <div className="mb-6">
                            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 tracking-tight">Shop by category</h2>
                            <p className="text-xs text-gray-500">Browse our curated collection</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                            {categoryCards.map((cat, idx) => {
                                const count = allProducts.filter(
                                    (p) => (typeof p.category === 'string' ? p.category : p.category?.name) === cat.name
                                ).length;
                                const theme = CATEGORY_CARD_THEMES[idx % CATEGORY_CARD_THEMES.length];
                                const Icon = categoryIconForSlug(cat.slug);
                                return (
                                    <Link
                                        key={`${cat.slug}-${idx}`}
                                        href={`/shop/${cat.slug}`}
                                        className={`group relative block overflow-hidden rounded-2xl p-5 sm:p-6 shadow-lg ring-2 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl ${theme.gradient} ${theme.ring}`}
                                    >
                                        <span
                                            className={`pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full blur-2xl ${theme.orb}`}
                                            aria-hidden
                                        />
                                        <span
                                            className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/25 to-transparent"
                                            aria-hidden
                                        />
                                        <div className="relative flex items-start justify-between gap-3">
                                            <div className="min-w-0 pr-2">
                                                <h3 className="font-bold text-lg text-white drop-shadow-sm tracking-tight leading-snug">
                                                    {cat.name}
                                                </h3>
                                                <p className="mt-1.5 text-sm font-medium tabular-nums text-white/90">
                                                    {count} {count === 1 ? 'product' : 'products'}
                                                </p>
                                            </div>
                                            <span
                                                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20 text-white shadow-inner backdrop-blur-sm ring-1 ring-white/30"
                                                aria-hidden
                                            >
                                                <Icon className="h-6 w-6" strokeWidth={2} />
                                            </span>
                                        </div>
                                        <ChevronRight className="relative mt-4 h-5 w-5 text-white/95 transition-transform duration-300 group-hover:translate-x-1.5" aria-hidden />
                                    </Link>
                                );
                            })}
                        </div>
                        <div className="flex justify-center">
                            <Link
                                href="/shop"
                                className="inline-flex items-center gap-2 min-h-[44px] px-6 py-3 bg-gradient-to-r from-slate-900 to-slate-800 text-white text-sm font-semibold rounded-xl hover:from-brand hover:to-brand/95 shadow-lg shadow-slate-900/20 transition-all touch-manipulation"
                            >
                                Shop all products
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Testimonials (API) — mobile-first */}
                <TestimonialsBlock testimonials={testimonials} />

                {/* All Products - compact grid */}
                <section className="py-8 sm:py-12 bg-white/90 backdrop-blur-sm border-t border-gray-100/80">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">All products</h2>
                            <span className="text-xs text-gray-500 font-medium">{allProducts.length} items</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                            {allProducts.map((product, idx) => (
                                <motion.div
                                    key={product.slug || idx}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: Math.min(idx * 0.03, 0.3) }}
                                >
                                    <ProductCard product={product as any} />
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>
                    </>
                )}
            </div>
        </ShopLayout>
    );
}
