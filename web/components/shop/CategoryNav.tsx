'use client';

import Link from 'next/link';
import {
    getShopNavRoots,
    getActiveRoot,
    getSubcategoriesForRoot,
    rootHasSubcategories,
    type CategoryNode,
} from '@/lib/category-utils';
import SubcategoryLinks from '@/components/shop/SubcategoryLinks';

interface CategoryNavProps {
    categories: CategoryNode[];
    currentSlug?: string;
    variant?: 'sidebar' | 'inline';
}

function getSlug(cat: CategoryNode): string {
    return cat.slug ?? cat.name?.toLowerCase?.()?.replace(/\s+/g, '-') ?? '';
}

export default function CategoryNav({ categories, currentSlug = '', variant = 'sidebar' }: CategoryNavProps) {
    const isSidebar = variant === 'sidebar';
    const roots = getShopNavRoots(categories);
    const activeRoot = getActiveRoot(categories, currentSlug);
    const activeRootId = activeRoot?.id;
    const subcategories =
        activeRootId != null && rootHasSubcategories(categories, activeRootId)
            ? getSubcategoriesForRoot(categories, activeRootId)
            : [];

    return (
        <div className={isSidebar ? 'space-y-1.5' : 'flex flex-wrap gap-2'}>
            <Link
                href="/shop"
                className={
                    isSidebar
                        ? `block w-full text-left px-5 py-3.5 rounded-xl text-sm font-medium transition-all ${!currentSlug ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`
                        : `px-4 py-2 rounded-full text-sm font-semibold ${!currentSlug ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`
                }
            >
                All Products
            </Link>
            {roots.map((cat) => {
                const slug = getSlug(cat);
                const isActive =
                    currentSlug === slug || (activeRootId != null && cat.id === activeRootId);
                if (isSidebar) {
                    return (
                        <div key={cat.id ?? slug} className="space-y-1">
                            <Link
                                href={`/shop/${slug}`}
                                className={`block w-full text-left px-5 py-3.5 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'}`}
                                aria-current={isActive && subcategories.length === 0 ? 'page' : undefined}
                            >
                                {cat.name}
                            </Link>
                            {isActive && subcategories.length > 0 && (
                                <SubcategoryLinks
                                    subcategories={subcategories}
                                    currentSlug={currentSlug}
                                    variant="sidebar"
                                />
                            )}
                        </div>
                    );
                }
                return (
                    <Link
                        key={cat.id ?? slug}
                        href={`/shop/${slug}`}
                        className={`px-4 py-2 rounded-full text-sm font-semibold ${isActive ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                    >
                        {cat.name}
                    </Link>
                );
            })}
        </div>
    );
}
