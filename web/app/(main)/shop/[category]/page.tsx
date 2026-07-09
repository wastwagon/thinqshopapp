'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/axios';
import ProductGrid from '@/components/ui/ProductGrid';
import { Search, Loader2 } from 'lucide-react';
import ShopLayout from '@/components/layout/ShopLayout';
import PageHeader from '@/components/ui/PageHeader';
import ShopPageShell from '@/components/shop/ShopContent';
import CategoryBadges from '@/components/shop/CategoryBadges';
import { findCategoryBySlug, type CategoryNode } from '@/lib/category-utils';
import staticProducts from '@/lib/data/scraped_products.json';
import { normalizeProduct, STATIC_CATEGORIES } from '@/lib/product-utils';

const PAGE_SIZE = 24;

function CategoryShopContent() {
    const params = useParams();
    const router = useRouter();
    const categorySlug = (params?.category as string) || '';
    const [products, setProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);
    const [useApi, setUseApi] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const loadMore = useCallback(async () => {
        if (!loadingMore && hasMore && useApi) {
            const nextPage = page + 1;
            setPage(nextPage);
            setLoadingMore(true);
            try {
                const productsRes = await api.get('/products', {
                    params: { category: categorySlug, limit: PAGE_SIZE, page: nextPage },
                });
                const apiProducts = productsRes.data?.data ?? [];
                const meta = productsRes.data?.meta ?? {};
                const list = apiProducts.map((p: any, i: number) => normalizeProduct(p, (nextPage - 1) * PAGE_SIZE + i));
                setProducts((prev) => [...prev, ...list]);
                setHasMore(nextPage < (meta.totalPages ?? 1));
            } finally {
                setLoadingMore(false);
            }
        }
    }, [categorySlug, page, hasMore, loadingMore, useApi]);

    useEffect(() => {
        setPage(1);
        setHasMore(true);
        const fetchData = async () => {
            setLoading(true);
            try {
                const [productsRes, categoriesRes] = await Promise.all([
                    api.get('/products', { params: { category: categorySlug, limit: PAGE_SIZE, page: 1 } }),
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
            } catch (_) {}
            const normalized = (staticProducts as any[]).map((p, i) => normalizeProduct({ ...p, id: p.id ?? i + 1 }, i));
            const catSlug = categorySlug.toLowerCase().replace(/\s+/g, '-');
            const filtered = normalized.filter((p) => {
                const c = typeof p.category === 'string' ? p.category : (p.category?.name ?? p.category?.slug ?? '');
                return (typeof c === 'string' ? c.toLowerCase().replace(/\s+/g, '-') : c) === catSlug || (p.category?.slug === catSlug);
            });
            setProducts(filtered);
            setCategories(STATIC_CATEGORIES);
            setHasMore(false);
            setUseApi(false);
            setLoading(false);
        };
        fetchData();
    }, [categorySlug]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchTerm.trim()) router.push(`/shop?search=${encodeURIComponent(searchTerm.trim())}`);
    };

    const currentCat = findCategoryBySlug(categories as CategoryNode[], categorySlug);
    const categoryName = currentCat?.name ?? categorySlug.replace(/-/g, ' ');

    const breadcrumbs = [
        { label: 'Shop', href: '/shop' },
        { label: categoryName || 'Category' },
    ];

    return (
        <ShopLayout>
            <div className="bg-white md:bg-transparent min-h-[60vh]">
            <ShopPageShell wide className="py-8 sm:py-12">
                <PageHeader
                    title={categoryName}
                    subtitle={`Browse ${categoryName} products`}
                    accent="blue"
                    breadcrumbs={breadcrumbs}
                />
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-end gap-4 mb-6 -mt-4">
                    <form onSubmit={handleSearch} className="w-full sm:max-w-sm relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
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

                <div className="mb-8">
                    <CategoryBadges categories={categories} currentSlug={categorySlug} />
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

export default function CategoryShopPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center p-12 text-gray-500 font-medium">Loading...</div>}>
            <CategoryShopContent />
        </Suspense>
    );
}
