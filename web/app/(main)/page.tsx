'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Zap, ArrowRight, ChevronRight, Flame } from 'lucide-react';
import products from '@/lib/data/scraped_products.json';
import api from '@/lib/axios';
import ProductCard from '@/components/ui/ProductCard';
import ShopLayout from '@/components/layout/ShopLayout';

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

export default function Home() {
    const [mounted, setMounted] = useState(false);
    const [productsList, setProductsList] = useState<Product[]>([]);
    const [categories, setCategories] = useState<{ name: string; slug: string }[]>([]);
    const [source, setSource] = useState<'api' | 'static'>('static');

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;
        const load = async () => {
            try {
                const [productsRes, categoriesRes] = await Promise.all([
                    api.get('/products', { params: { limit: 100 } }),
                    api.get('/products/categories'),
                ]);
                const apiProducts = productsRes.data?.data ?? [];
                const apiCategories = categoriesRes.data ?? [];
                if (apiProducts.length > 0) {
                    setProductsList(apiProducts.map((p: any, i: number) => normalizeProduct(p, i)));
                    setCategories(apiCategories.map((c: any) => ({ name: c.name, slug: c.slug })));
                    setSource('api');
                    return;
                }
            } catch (_) {
                // Fall through to static
            }
            const staticProducts = (products as Product[]).map((p, i) => normalizeProduct({ ...p, id: p.id ?? i + 1 }, i));
            setProductsList(staticProducts);
            setCategories(STATIC_CATEGORIES.map(name => ({ name, slug: name.toLowerCase().replace(/\s+/g, '-') })));
            setSource('static');
        };
        load();
    }, [mounted]);

    const productsWithIds = productsList;

    const featured = productsWithIds.filter((p: Product) => (source === 'api' && (p as any).is_featured) || source === 'static').slice(0, 8);
    const fallbackFeatured = featured.length ? featured : productsWithIds.slice(0, 8);
    const flashSales = productsWithIds.filter(p => p.compare_price || Number(String(p.price).replace(/[^0-9.]/g, '')) < 1000).slice(0, 6);
    const fallbackFlash = flashSales.length ? flashSales : productsWithIds.slice(0, 6);
    const allProducts = productsWithIds;

    if (!mounted || productsWithIds.length === 0) {
        if (!mounted) return null;
        return (
            <ShopLayout>
                <div className="min-h-[60vh] flex items-center justify-center">
                    <div className="animate-pulse text-sm text-gray-500">Loading products...</div>
                </div>
            </ShopLayout>
        );
    }

    return (
        <ShopLayout>
            <div className="min-h-screen bg-[#fafafa]">
                {/* Premium Hero Banner */}
                <section className="relative overflow-hidden border-b border-gray-100">
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" />
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,#3b82f640,transparent)]" />
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />
                    <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 lg:py-32">
                        <div className="max-w-2xl">
                            <p className="text-[10px] sm:text-xs font-bold text-blue-400 uppercase tracking-[0.3em] mb-4">ThinQShop</p>
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-6 leading-[1.1]">
                                Discover premium tech
                            </h1>
                            <p className="text-base sm:text-lg text-gray-300 mb-10 max-w-lg">
                                Cameras, computers, and pro gear — curated for creators and professionals.
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <Link
                                    href="/shop"
                                    className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white text-sm font-bold rounded-2xl hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/25 group"
                                >
                                    Shop all
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                                </Link>
                                <Link
                                    href="/shop/photography"
                                    className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 text-white text-sm font-semibold rounded-2xl border border-white/20 hover:bg-white/20 transition-all backdrop-blur-sm"
                                >
                                    Browse cameras
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Flash Sales */}
                <section className="py-8 sm:py-12">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500/10">
                                    <Zap className="w-5 h-5 text-amber-600" />
                                </span>
                                <div>
                                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">Flash Sales</h2>
                                    <p className="text-xs text-gray-500">Limited time deals</p>
                                </div>
                            </div>
                            <Link
                                href="/shop"
                                className="text-xs font-semibold text-gray-500 hover:text-gray-900 flex items-center gap-1"
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
                <section className="py-8 sm:py-12 bg-white border-y border-gray-100">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-500/10">
                                    <Flame className="w-5 h-5 text-blue-600" />
                                </span>
                                <div>
                                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">Featured</h2>
                                    <p className="text-xs text-gray-500">Hand-picked favorites</p>
                                </div>
                            </div>
                            <Link
                                href="/shop"
                                className="text-xs font-semibold text-gray-500 hover:text-gray-900 flex items-center gap-1"
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
                            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">Shop by category</h2>
                            <p className="text-xs text-gray-500">Browse our curated collection</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                            {categories.map((cat) => {
                                const count = allProducts.filter(p => (typeof p.category === 'string' ? p.category : p.category?.name) === cat.name).length;
                                return (
                                    <Link
                                        key={cat.slug}
                                        href={`/shop/${cat.slug}`}
                                        className="block p-6 rounded-2xl bg-white border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all group"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{cat.name}</span>
                                            <span className="text-xs text-gray-400">{count} products</span>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-gray-300 mt-2 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                                    </Link>
                                );
                            })}
                        </div>
                        <div className="flex justify-center">
                            <Link
                                href="/shop"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors"
                            >
                                Shop all products
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </section>

                {/* All Products - compact grid */}
                <section className="py-8 sm:py-12 bg-white border-t border-gray-100">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg sm:text-xl font-bold text-gray-900">All products</h2>
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
            </div>
        </ShopLayout>
    );
}
