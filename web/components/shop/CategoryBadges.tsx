'use client';

import Link from 'next/link';
import {
    getShopNavRoots,
    getActiveRoot,
    getSubcategoriesForRoot,
    type CategoryNode,
} from '@/lib/category-utils';
import SubcategoryLinks from '@/components/shop/SubcategoryLinks';

type Category = CategoryNode;

interface CategoryBadgesProps {
    categories: Category[];
    currentSlug?: string;
}

function getSlug(cat: Category): string {
    return cat.slug ?? cat.name?.toLowerCase?.()?.replace(/\s+/g, '-') ?? '';
}

const rootLinkClass = (active: boolean) =>
    active
        ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white border-blue-600 shadow-[0_4px_14px_-4px_rgba(37,99,235,0.55)]'
        : 'bg-white text-gray-700 border-gray-200/90 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900 shadow-sm';

export default function CategoryBadges({ categories, currentSlug = '' }: CategoryBadgesProps) {
    const isAll = !currentSlug;
    const roots = getShopNavRoots(categories);
    const activeRoot = getActiveRoot(categories, currentSlug);
    const activeRootId = activeRoot?.id;
    const childChips =
        activeRootId != null ? getSubcategoriesForRoot(categories, activeRootId) : [];

    return (
        <div className="space-y-3">
            <div className="rounded-2xl border border-gray-200/90 bg-gray-50/60 p-2 sm:p-2.5">
                <div className="w-full overflow-x-auto overflow-y-hidden pb-0.5 no-scrollbar overflow-touch">
                    <div className="flex flex-nowrap sm:flex-wrap gap-2 min-w-max sm:min-w-0 items-stretch">
                        <Link
                            href="/shop"
                            className={`shrink-0 min-h-[44px] flex items-center px-4 sm:px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all border ${rootLinkClass(isAll)}`}
                            aria-current={isAll ? 'page' : undefined}
                        >
                            All Products
                        </Link>
                        {roots.map((cat) => {
                            const slug = getSlug(cat);
                            const isActive =
                                currentSlug === slug ||
                                (activeRootId != null && cat.id === activeRootId);
                            return (
                                <Link
                                    key={cat.id ?? cat.slug ?? cat.name}
                                    href={`/shop/${slug}`}
                                    className={`shrink-0 min-h-[44px] flex items-center px-4 sm:px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all border ${rootLinkClass(isActive)}`}
                                    aria-current={isActive ? 'page' : undefined}
                                >
                                    {cat.name}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>

            {childChips.length > 0 && (
                <div className="w-full overflow-x-auto overflow-y-hidden pb-0.5 no-scrollbar overflow-touch">
                    <SubcategoryLinks
                        subcategories={childChips}
                        currentSlug={currentSlug}
                        variant="chips"
                    />
                </div>
            )}
        </div>
    );
}
