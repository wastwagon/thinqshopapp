'use client';

import { Fragment, useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
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

const CATEGORY_CARD_COUNT = 8;

const DEFAULT_HOME_SECTIONS = [
    'hero',
    'trust_strip',
    'flash_sales',
    'featured',
    'categories',
    'testimonials',
    'all_products',
];

function buildEightCategories(apiList: { name: string; slug: string }[]): { name: string; slug: string }[] {
    const seen = new Set<string>();
    const out: { name: string; slug: string }[] = [];
    for (const c of apiList) {
        if (out.length >= CATEGORY_CARD_COUNT) break;
        const slug = (c.slug || '').trim() || c.name.toLowerCase().replace(/\s+/g, '-');
        if (seen.has(slug)) continue;
        out.push({ name: c.name, slug });
        seen.add(slug);
    }
    for (const def of CATEGORY_CATALOG) {
        if (out.length >= CATEGORY_CARD_COUNT) break;
        if (!seen.has(def.slug)) {
            out.push({ name: def.name, slug: def.slug });
            seen.add(def.slug);
        }
    }
    return out.slice(0, CATEGORY_CARD_COUNT);
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
    const [sectionOrder, setSectionOrder] = useState<string[]>(DEFAULT_HOME_SECTIONS);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;
        const load = async () => {
            try {
                const [productsRes, categoriesRes, heroRes, trustRes, testimonialRes, sectionsRes] = await Promise.all([
                    api.get('/products', { params: { limit: 100 } }),
                    api.get('/products/categories'),
                    api.get('/content/hero-slides').catch(() => ({ data: [] })),
                    api.get('/content/trust-badges').catch(() => ({ data: [] })),
                    api.get('/content/testimonials').catch(() => ({ data: [] })),
                    api.get('/content/homepage-sections').catch(() => ({ data: [] })),
                ]);
                const apiProducts = productsRes.data?.data ?? productsRes.data ?? [];
                const apiCategories = categoriesRes.data ?? [];
                const contentHeroSlides = Array.isArray(heroRes.data) ? heroRes.data : [];
                setTrustBadges(Array.isArray(trustRes.data) ? trustRes.data : []);
                setTestimonials(Array.isArray(testimonialRes.data) ? testimonialRes.data : []);
                const apiSectionKeys = (Array.isArray(sectionsRes.data) ? sectionsRes.data : [])
                    .map((s: { section_key?: string }) => s.section_key)
                    .filter((k: string | undefined): k is string => !!k && DEFAULT_HOME_SECTIONS.includes(k));
                if (apiSectionKeys.length > 0) setSectionOrder(apiSectionKeys);
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

    const { fallbackFeatured, fallbackFlash } = useMemo(() => {
        const featured = productsWithIds
            .filter((p: Product) => (source === 'api' && (p as Product & { is_featured?: boolean }).is_featured) || source === 'static')
            .slice(0, 8);
        const fallbackFeatured = featured.length ? featured : productsWithIds.slice(0, 8);
        const flashSales = productsWithIds
            .filter((p) => p.compare_price || Number(String(p.price).replace(/[^0-9.]/g, '')) < 1000)
            .slice(0, 6);
        const fallbackFlash = flashSales.length ? flashSales : productsWithIds.slice(0, 6);
        return { fallbackFeatured, fallbackFlash };
    }, [productsWithIds, source]);

    const allProducts = productsWithIds;

    const categoryCards = useMemo(() => buildEightCategories(categories), [categories]);

    /** One pass over products — avoid O(categories × products) filters per tile */
    const categoryProductCounts = useMemo(() => {
        const m = new Map<string, number>();
        for (const p of allProducts) {
            const name = typeof p.category === 'string' ? p.category : p.category?.name;
            if (!name) continue;
            m.set(name, (m.get(name) ?? 0) + 1);
        }
        return m;
    }, [allProducts]);


    if (!mounted) return null;

    const hasProducts = productsWithIds.length > 0;
    const productSectionKeys = new Set(['flash_sales', 'featured', 'categories', 'testimonials', 'all_products']);

    const sectionNodes: Record<string, React.ReactNode> = {
        hero: <HomeHero slides={heroSlides} />,
        trust_strip: <TrustStrip badges={trustBadges} />,
        flash_sales: (
            <section className="py-8 sm:py-12 relative">
                <div className="max-w-6xl mx-auto px-4 sm:px-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand/10 border border-brand/15">
                                <Zap className="w-5 h-5 text-brand" />
                            </span>
                            <div>
                                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 tracking-tight">Featured deals</h2>
                                <p className="text-xs text-gray-500">Hand-picked offers</p>
                            </div>
                        </div>
                        <Link href="/shop" className="text-xs font-semibold text-brand hover:text-brand/90 flex items-center gap-1 transition-colors">
                            View all
                            <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-6">
                        {fallbackFlash.map((product, idx) => (
                            <div key={product.slug || idx}>
                                <ProductCard product={product as any} />
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        ),
        featured: (
            <section className="py-8 sm:py-12 border-y border-gray-200/80 bg-white/50">
                <div className="max-w-6xl mx-auto px-4 sm:px-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand/10 ring-1 ring-brand/15">
                                <Flame className="w-5 h-5 text-brand" />
                            </span>
                            <div>
                                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 tracking-tight">Featured</h2>
                                <p className="text-xs text-gray-500">Hand-picked favorites</p>
                            </div>
                        </div>
                        <Link href="/shop" className="text-xs font-semibold text-brand hover:text-brand/90 flex items-center gap-1 transition-colors">
                            View all
                            <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                        {fallbackFeatured.map((product, idx) => (
                            <div key={product.slug || idx}>
                                <ProductCard product={product as any} />
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        ),
        categories: (
            <section className="py-8 sm:py-12" aria-labelledby="shop-by-category-heading">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="mb-4 sm:mb-5">
                        <h2 id="shop-by-category-heading" className="text-lg sm:text-xl font-semibold text-gray-900 mb-1 tracking-tight">
                            Shop by category
                        </h2>
                        <p className="text-xs text-gray-500">Browse our curated collection</p>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 mb-8">
                        {categoryCards.map((cat, idx) => {
                            const count = categoryProductCounts.get(cat.name) ?? 0;
                            const Icon = categoryIconForSlug(cat.slug);
                            const accentBorder = 'border-l-brand';
                            const iconBg = idx % 2 === 0 ? 'bg-brand/10 text-brand' : 'bg-brand/5 text-brand';
                            return (
                                <Link
                                    key={`${cat.slug}-${idx}`}
                                    href={`/shop/${cat.slug}`}
                                    aria-label={`${cat.name}: ${count} ${count === 1 ? 'product' : 'products'}`}
                                    className={`group relative flex min-h-[5.25rem] flex-col rounded-xl border border-gray-200/90 bg-white border-l-4 ${accentBorder} p-3 sm:p-3.5 lg:p-4 transition-colors hover:border-gray-300/90 hover:bg-gray-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 lg:min-h-0`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0 pr-1">
                                            <h3 className="font-semibold text-sm sm:text-[15px] text-gray-900 tracking-tight leading-tight line-clamp-2">{cat.name}</h3>
                                            <p className="mt-1 text-xs font-medium tabular-nums text-gray-500">
                                                {count} {count === 1 ? 'product' : 'products'}
                                            </p>
                                        </div>
                                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconBg}`} aria-hidden>
                                            <Icon className="h-4 w-4" strokeWidth={2} />
                                        </span>
                                    </div>
                                    <ChevronRight className="mt-auto pt-2 h-4 w-4 shrink-0 text-gray-300 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-brand" aria-hidden />
                                </Link>
                            );
                        })}
                    </div>
                    <div className="flex justify-center">
                        <Link href="/shop" className="inline-flex items-center gap-2 min-h-[44px] px-6 py-3 bg-brand text-white text-sm font-semibold rounded-xl hover:bg-brand/90 transition-colors touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2">
                            Shop all products
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </section>
        ),
        testimonials: <TestimonialsBlock testimonials={testimonials} />,
        all_products: (
            <section className="py-8 sm:py-12 border-t border-gray-200/80">
                <div className="max-w-6xl mx-auto px-4 sm:px-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 tracking-tight">All products</h2>
                        <span className="text-xs text-gray-500 font-medium">{allProducts.length} items</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                        {allProducts.map((product, idx) => (
                            <div key={product.slug || idx}>
                                <ProductCard product={product as any} />
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        ),
    };

    return (
        <ShopLayout>
            <div className="min-h-screen bg-app">
                {sectionOrder.map((key) => {
                    if (!sectionNodes[key]) return null;
                    if (productSectionKeys.has(key) && !hasProducts) return null;
                    return <Fragment key={key}>{sectionNodes[key]}</Fragment>;
                })}
                {!hasProducts && (
                    <div className="min-h-[40vh] flex items-center justify-center px-4">
                        <div className="animate-pulse text-sm text-gray-500">Loading products…</div>
                    </div>
                )}
            </div>
        </ShopLayout>
    );
}
