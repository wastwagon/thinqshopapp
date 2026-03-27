'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Zap, ArrowRight, ChevronRight, Flame } from 'lucide-react';
import products from '@/lib/data/scraped_products.json';
import api from '@/lib/axios';
import ProductCard from '@/components/ui/ProductCard';
import ShopLayout from '@/components/layout/ShopLayout';
import HomeHero from '@/components/home/HomeHero';
import TrustStrip from '@/components/home/TrustStrip';
import TestimonialsBlock from '@/components/home/TestimonialsBlock';

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

const STATIC_CATEGORIES = ['Photography', 'Computers', 'Pro Video'];

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
            setCategories(STATIC_CATEGORIES.map(name => ({ name, slug: name.toLowerCase().replace(/\s+/g, '-') })));
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
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                            {categories.map((cat) => {
                                const count = allProducts.filter(p => (typeof p.category === 'string' ? p.category : p.category?.name) === cat.name).length;
                                return (
                                    <Link
                                        key={cat.slug}
                                        href={`/shop/${cat.slug}`}
                                        className="block p-6 rounded-2xl bg-white border border-gray-100/90 shadow-sm hover:border-brand/25 hover:shadow-md hover:shadow-brand/5 transition-all group"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{cat.name}</span>
                                            <span className="text-xs font-medium text-gray-400 tabular-nums">{count} products</span>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-gray-300 mt-2 group-hover:text-brand group-hover:translate-x-1 transition-all" />
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
