'use client';

import Link from 'next/link';
import { flattenCategoryTree, type CategoryNode } from '@/lib/category-utils';

interface CategoryNavProps {
    categories: CategoryNode[];
    currentSlug?: string;
    variant?: 'sidebar' | 'inline';
}

function getSlug(cat: CategoryNode): string {
    return cat.slug ?? cat.name?.toLowerCase?.()?.replace(/\s+/g, '-') ?? '';
}

export default function CategoryNav({ categories, currentSlug = '', variant = 'sidebar' }: CategoryNavProps) {
    const rows = flattenCategoryTree(categories);
    const isSidebar = variant === 'sidebar';

    return (
        <div className={isSidebar ? 'space-y-1.5' : 'flex flex-wrap gap-2'}>
            <Link
                href="/shop"
                className={
                    isSidebar
                        ? `block w-full text-left px-5 py-3.5 rounded-xl text-sm font-medium transition-all ${!currentSlug ? 'bg-brand text-white' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`
                        : `px-4 py-2 rounded-full text-sm font-semibold ${!currentSlug ? 'bg-brand text-white' : 'bg-gray-100 text-gray-600'}`
                }
            >
                All Products
            </Link>
            {rows.map(({ cat, depth }) => {
                const slug = getSlug(cat);
                const isActive = currentSlug === slug;
                const isChild = depth > 0;
                if (isSidebar) {
                    return (
                        <Link
                            key={cat.id ?? slug}
                            href={`/shop/${slug}`}
                            className={`block w-full text-left rounded-xl text-sm font-medium transition-all ${isChild ? 'pl-8 pr-5 py-2.5' : 'px-5 py-3.5'} ${isActive ? 'bg-brand text-white' : isChild ? 'text-gray-500 hover:bg-gray-50 hover:text-gray-900' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'}`}
                        >
                            {isChild ? `↳ ${cat.name}` : cat.name}
                        </Link>
                    );
                }
                return (
                    <Link
                        key={cat.id ?? slug}
                        href={`/shop/${slug}`}
                        className={`px-4 py-2 rounded-full text-sm font-semibold ${isActive ? 'bg-brand text-white' : 'bg-gray-100 text-gray-600'}`}
                    >
                        {cat.name}
                    </Link>
                );
            })}
        </div>
    );
}
