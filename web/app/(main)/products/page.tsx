'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ShopLayout from '@/components/layout/ShopLayout';
import { ShopLoadingState } from '@/components/shop/ShopSuccessShell';

function ProductsRedirect() {
    const searchParams = useSearchParams();
    const router = useRouter();

    useEffect(() => {
        const category = searchParams?.get('category') || '';
        const search = searchParams?.get('search') || '';
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        const query = params.toString();
        if (category) {
            router.replace(`/shop/${category}${query ? `?${query}` : ''}`);
        } else {
            router.replace(query ? `/shop?${query}` : '/shop');
        }
    }, [searchParams, router]);

    return (
        <ShopLayout>
            <ShopLoadingState message="Redirecting…" />
        </ShopLayout>
    );
}

export default function ProductsPage() {
    return (
        <Suspense
            fallback={
                <ShopLayout>
                    <ShopLoadingState message="Redirecting…" />
                </ShopLayout>
            }
        >
            <ProductsRedirect />
        </Suspense>
    );
}
