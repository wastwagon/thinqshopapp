'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/axios';
import ProductGrid from '@/components/ui/ProductGrid';
import { Search, Loader2 } from 'lucide-react';
import ShopLayout from '@/components/layout/ShopLayout';
import PageHeader from '@/components/ui/PageHeader';
import ShopPageShell from '@/components/shop/ShopContent';
import CategoryBadges from '@/components/shop/CategoryBadges';
import staticProducts from '@/lib/data/scraped_products.json';
import { normalizeProduct, STATIC_CATEGORIES } from '@/lib/product-utils';

const PAGE_SIZE = 24;

function ShopContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [products, setProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);
    const [useApi, setUseApi] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const category = searchParams?.get('category') || '';
    const search = searchParams?.get('search') || '';

    useEffect(() => {
        setSearchTerm(search);
    }, [search]);

    useEffect(() => {
        setPage(1);
        setHasMore(true);
        const load = async () => {
            setLoading(true);
            try {
                const [productsRes, categoriesRes] = await Promise.all([
                    api.get('/products', { params: { category, search, limit: PAGE_SIZE, page: 1 } }),
                    api.get('/products/categories'),
                ]);
                const apiProducts = productsRes.data?.data ?? [];
                const apiCategories = categoriesRes.data ?? [];
                const meta = productsRes.data?.meta ?? {};
                setProducts(apiProducts.map((p: any, i: number) => normalizeProduct(p, i)));
                setCategories(Array.isArray(apiCategories) ? apiCategories : []);
                setHasMore(1 < (meta.totalPages ?? 1));
                setUseApi(true);
                setLoading(false);
                return;
            } catch (_) {
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
                setHasMore(false);
                setUseApi(false);
            }
            setLoading(false);
        };
        load();
    }, [category, search]);

    const loadMore = async () => {
        if (!loadingMore && hasMore && useApi) {
            const nextPage = page + 1;
            setPage(nextPage);
            setLoadingMore(true);
            try {
                const productsRes = await api.get('/products', {
                    params: { category, search, limit: PAGE_SIZE, page: nextPage },
                });
                const apiProducts = productsRes.data?.data ?? [];
                const meta = productsRes.data?.meta ?? {};
                const list = apiProducts.map((p: any, i: number) => normalizeProduct(p, (nextPage - 1) * PAGE_SIZE + i));
                setProducts((prev) => [...prev, ...list]);
                setHasMore(nextPage < (meta.totalPages ?? 1));
            } catch (_) {
                setUseApi(false);
            } finally {
                setLoadingMore(false);
            }
        }
    };

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
            <div className="bg-white md:bg-transparent min-h-[60vh]">
            <ShopPageShell wide className="py-8 sm:py-12">
                <PageHeader
                    title={search ? 'Search Results' : 'Our Collection'}
                    subtitle="Electronics and tech delivered to you"
                    accent="blue"
                    breadcrumbs={breadcrumbs}
                />
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
                    <form onSubmit={handleSearch} className="w-full sm:max-w-sm relative group order-2 sm:order-2">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-11 pr-4 py-3 h-12 bg-gray-50 border border-gray-100 rounded-2xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all font-medium"
                            placeholder="Search products..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </form>
                </div>

                <div className="mb-8">
                    <CategoryBadges categories={categories} currentSlug={category} />
                </div>

                <ProductGrid products={products} loading={loading} />
                {!loading && hasMore && useApi && (
                    <div className="mt-12 flex justify-center">
                        <button
                            type="button"
                            onClick={loadMore}
                            disabled={loadingMore}
                            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-8 py-4 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                            {loadingMore ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Loading...
                                </>
                            ) : (
                                'Load more'
                            )}
                        </button>
                    </div>
                )}
            </ShopPageShell>
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
