'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/axios';
import ProductGrid from '@/components/ui/ProductGrid';
import { Search } from 'lucide-react';
import ShopLayout from '@/components/layout/ShopLayout';
import PageHeader from '@/components/ui/PageHeader';
import staticProducts from '@/lib/data/scraped_products.json';
import { normalizeProduct, STATIC_CATEGORIES } from '@/lib/product-utils';

function ShopContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [products, setProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const category = searchParams?.get('category') || '';
    const search = searchParams?.get('search') || '';

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [productsRes, categoriesRes] = await Promise.all([
                    api.get('/products', { params: { category, search } }),
                    api.get('/products/categories'),
                ]);
                const apiProducts = productsRes.data?.data ?? [];
                const apiCategories = categoriesRes.data ?? [];
                if (apiProducts.length > 0) {
                    setProducts(apiProducts.map((p: any, i: number) => normalizeProduct(p, i)));
                    setCategories(Array.isArray(apiCategories) ? apiCategories : []);
                    setLoading(false);
                    return;
                }
            } catch (_) {}
            const normalized = (staticProducts as any[]).map((p, i) => normalizeProduct({ ...p, id: p.id ?? i + 1 }, i));
            let filtered = normalized;
            if (category) {
                const catSlug = category.toLowerCase().replace(/\s+/g, '-');
                filtered = filtered.filter((p) => {
                    const c = typeof p.category === 'string' ? p.category : (p.category?.name ?? p.category?.slug ?? '');
                    return (typeof c === 'string' ? c.toLowerCase().replace(/\s+/g, '-') : c) === catSlug || (p.category?.slug === catSlug);
                });
            }
            if (search) {
                const q = search.toLowerCase();
                filtered = filtered.filter(
                    (p) =>
                        (p.name || '').toLowerCase().includes(q) ||
                        (p.description || '').toLowerCase().includes(q) ||
                        (typeof p.category === 'string' && p.category.toLowerCase().includes(q)) ||
                        (q === 'deal' && (p.compare_price || Number(String(p.price).replace(/[^0-9.]/g, '')) < 1000))
                );
            }
            setProducts(filtered);
            setCategories(STATIC_CATEGORIES);
            setLoading(false);
        };
        fetchData();
    }, [category, search]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams(searchParams?.toString() || '');
        if (searchTerm) params.set('search', searchTerm);
        else params.delete('search');
        router.push(`/shop?${params.toString()}`);
    };

    const breadcrumbs = search ? [{ label: 'Shop', href: '/shop' }, { label: 'Search' }] : [{ label: 'Shop' }];

    return (
        <ShopLayout>
            <div className="max-w-7xl mx-auto px-6 py-12">
                <PageHeader
                    title={search ? 'Search Results' : 'Our Collection'}
                    subtitle="Premium electronics and tech delivered to you"
                    breadcrumbs={breadcrumbs}
                />
                <div className="flex flex-col md:flex-row justify-end mb-8 -mt-4">
                    <form onSubmit={handleSearch} className="w-full md:w-80 relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all font-medium"
                            placeholder="Search products..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </form>
                </div>

                <div className="flex flex-col lg:flex-row gap-12">
                    <aside className="w-full lg:w-64 flex-shrink-0">
                        <div className="sticky top-24">
                            <h3 className="text-xs font-bold tracking-widest uppercase text-gray-400 mb-6">Categories</h3>
                            <div className="space-y-1.5">
                                <Link
                                    href="/shop"
                                    className={`block w-full text-left px-5 py-3.5 rounded-2xl text-sm font-bold transition-all ${!category ? 'bg-gray-900 text-white shadow-lg shadow-gray-200' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
                                >
                                    All Products
                                </Link>
                                {categories.map((cat) => (
                                    <Link
                                        key={cat.id ?? cat.slug ?? cat.name}
                                        href={`/shop/${cat.slug ?? cat.name?.toLowerCase?.()?.replace(/\s+/g, '-')}`}
                                        className={`block w-full text-left px-5 py-3.5 rounded-2xl text-sm font-bold transition-all ${category === (cat.slug ?? '') ? 'bg-gray-900 text-white shadow-lg shadow-gray-200' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
                                    >
                                        {cat.name}
                                    </Link>
                                ))}
                            </div>
                            <div className="mt-12 bg-blue-50 p-6 rounded-xl border border-blue-100">
                                <p className="text-[10px] font-bold tracking-widest text-blue-600 uppercase mb-2">Shipping</p>
                                <p className="text-xs font-bold text-gray-900 leading-tight">International delivery. Items ship from abroad with 7–14 day estimated delivery.</p>
                            </div>
                        </div>
                    </aside>
                    <main className="flex-1">
                        <ProductGrid products={products} loading={loading} />
                    </main>
                </div>
            </div>
        </ShopLayout>
    );
}

export default function ShopPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center p-12 text-gray-500 font-medium">Loading...</div>}>
            <ShopContent />
        </Suspense>
    );
}
