'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function ProductsPage() {
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
        <div className="min-h-screen flex items-center justify-center">
            <p className="text-gray-500 font-medium">Redirecting...</p>
        </div>
    );
}
