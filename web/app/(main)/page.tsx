'use client';

import { Fragment, useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Zap, ChevronRight, Flame } from 'lucide-react';
import api from '@/lib/axios';
import ShopLayout from '@/components/layout/ShopLayout';
import HomeHero from '@/components/home/HomeHero';

const ProductCard = dynamic(() => import('@/components/ui/ProductCard'), {
    loading: () => <div className="aspect-[4/5] rounded-xl bg-gray-100 animate-pulse" aria-hidden />,
});
const TrustStrip = dynamic(() => import('@/components/home/TrustStrip'));
const HomeServicesSection = dynamic(() => import('@/components/home/HomeServicesSection'));
const TestimonialsBlock = dynamic(() => import('@/components/home/TestimonialsBlock'));

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

/** Enough for featured/flash + a capped “all products” grid without hydrating 100 cards. */
const HOME_PRODUCT_FETCH_LIMIT = 36;
const HOME_ALL_PRODUCTS_VISIBLE = 24;

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

const DEFAULT_HOME_SECTIONS = [
    'hero',
    'trust_strip',
    'platform_services',
    'flash_sales',
    'featured',
    'testimonials',
    'all_products',
];

type HeroSlide = { id: number; title: string; subtitle?: string | null; cta_text?: string | null; cta_url?: string | null; image_path?: string | null };
type TrustBadge = { id: number; icon: string; label: string; optional_link?: string | null };
type Testimonial = { id: number; quote: string; author_name: string; author_role?: string | null };

export default function Home() {
    const [productsList, setProductsList] = useState<Product[]>([]);
    const [source, setSource] = useState<'api' | 'static'>('static');
    const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
    const [trustBadges, setTrustBadges] = useState<TrustBadge[]>([]);
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
    const [sectionOrder, setSectionOrder] = useState<string[]>(DEFAULT_HOME_SECTIONS);

    useEffect(() => {
        const load = async () => {
            try {
                // Hero first so LCP can settle before product/content payloads land.
                const heroRes = await api.get('/content/hero-slides', { timeout: 12000 }).catch(() => ({ data: [] }));
                const contentHeroSlides = Array.isArray(heroRes.data) ? heroRes.data : [];
                if (contentHeroSlides.length) setHeroSlides(contentHeroSlides);

                const [productsRes, trustRes, testimonialRes, sectionsRes] = await Promise.all([
                    api.get('/products', { params: { limit: HOME_PRODUCT_FETCH_LIMIT }, timeout: 12000 }),
                    api.get('/content/trust-badges', { timeout: 12000 }).catch(() => ({ data: [] })),
                    api.get('/content/testimonials', { timeout: 12000 }).catch(() => ({ data: [] })),
                    api.get('/content/homepage-sections', { timeout: 12000 }).catch(() => ({ data: [] })),
                ]);
                const apiProducts = productsRes.data?.data ?? productsRes.data ?? [];
                setTrustBadges(Array.isArray(trustRes.data) ? trustRes.data : []);
                setTestimonials(Array.isArray(testimonialRes.data) ? testimonialRes.data : []);
                const apiSections = Array.isArray(sectionsRes.data) ? sectionsRes.data : [];
                const apiSectionKeys = apiSections
                    .slice()
                    .sort((a: { sort_order?: number }, b: { sort_order?: number }) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
                    .map((s: { section_key?: string }) => s.section_key)
                    .filter((k: string | undefined): k is string => !!k && DEFAULT_HOME_SECTIONS.includes(k));
                if (apiSectionKeys.length > 0) {
                    const merged = [...apiSectionKeys];
                    if (!merged.includes('platform_services')) {
                        const trustIdx = merged.indexOf('trust_strip');
                        merged.splice(trustIdx >= 0 ? trustIdx + 1 : 0, 0, 'platform_services');
                    }
                    setSectionOrder(merged);
                }
                if (apiProducts.length > 0 && Array.isArray(apiProducts)) {
                    const list = apiProducts.map((p: any, i: number) => normalizeProduct(p, i));
                    setProductsList(list);
                    setSource('api');
                    setHeroSlides(contentHeroSlides);
                    return;
                }
            } catch (_) {
                // Fall through to static
            }
            const staticMod = await import('@/lib/data/scraped_products.json');
            const staticProducts = (staticMod.default as Product[])
                .slice(0, HOME_PRODUCT_FETCH_LIMIT)
                .map((p, i) => normalizeProduct({ ...p, id: p.id ?? i + 1 }, i));
            setProductsList(staticProducts);
            setSource('static');
            setHeroSlides([]);
        };
        load();
    }, []);

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

    const allProducts = productsWithIds.slice(0, HOME_ALL_PRODUCTS_VISIBLE);

    const hasProducts = productsWithIds.length > 0;
    const showFeaturedSections = fallbackFlash.length >= 4 && fallbackFeatured.length >= 4;
    const productSectionKeys = new Set(['flash_sales', 'featured', 'testimonials', 'all_products']);

    const sectionNodes: Record<string, React.ReactNode> = {
        hero: <HomeHero slides={heroSlides} />,
        trust_strip: <TrustStrip badges={trustBadges} />,
        platform_services: <HomeServicesSection />,
        flash_sales: (
            <section className="py-8 sm:py-12 relative">
                <div className="page-shell">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-50 border border-amber-100">
                                <Zap className="w-5 h-5 text-amber-600" />
                            </span>
                            <div>
                                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 tracking-tight">Featured deals</h2>
                                <p className="text-xs text-gray-500">Hand-picked offers</p>
                            </div>
                        </div>
                        <Link href="/shop" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors">
                            View all
                            <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 sm:gap-4">
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
                <div className="page-shell">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 ring-1 ring-blue-100">
                                <Flame className="w-5 h-5 text-blue-600" />
                            </span>
                            <div>
                                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 tracking-tight">Featured</h2>
                                <p className="text-xs text-gray-500">Hand-picked favorites</p>
                            </div>
                        </div>
                        <Link href="/shop" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors">
                            View all
                            <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 sm:gap-4">
                        {fallbackFeatured.map((product, idx) => (
                            <div key={product.slug || idx}>
                                <ProductCard product={product as any} />
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        ),
        testimonials: <TestimonialsBlock testimonials={testimonials} />,
        all_products: (
            <section className="py-8 sm:py-12 border-t border-gray-200/80">
                <div className="page-shell">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 tracking-tight">All products</h2>
                        <Link href="/shop" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors">
                            View shop
                            <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 sm:gap-4">
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
            <div className="min-h-screen bg-white md:bg-app">
                {sectionOrder.map((key) => {
                    if (!sectionNodes[key]) return null;
                    if (productSectionKeys.has(key) && !hasProducts) return null;
                    if ((key === 'flash_sales' || key === 'featured') && !showFeaturedSections) return null;
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
