'use client';

import Link from 'next/link';
import { getRootCategories, findCategoryBySlug, type CategoryNode } from '@/lib/category-utils';

type Category = CategoryNode;

interface CategoryBadgesProps {
    categories: Category[];
    currentSlug?: string;
}

function getSlug(cat: Category): string {
    return cat.slug ?? cat.name?.toLowerCase?.()?.replace(/\s+/g, '-') ?? '';
}

export default function CategoryBadges({ categories, currentSlug = '' }: CategoryBadgesProps) {
    const isAll = !currentSlug;
    const roots = getRootCategories(categories);
    const current = currentSlug ? findCategoryBySlug(categories, currentSlug) : undefined;
    const activeRoot =
        current?.parent_id != null
            ? categories.find((c) => c.id === current.parent_id) ?? current.parent
            : current?.parent_id == null
              ? current
              : undefined;
    const activeRootId = activeRoot && 'id' in activeRoot ? activeRoot.id : (activeRoot as CategoryNode | undefined)?.id;
    const childChips =
        activeRootId != null
            ? (categories.find((c) => c.id === activeRootId)?.children ??
              categories.filter((c) => c.parent_id === activeRootId))
            : [];

    return (
        <div className="space-y-3">
            <div className="lg:hidden w-full -mx-4 sm:-mx-6 px-4 sm:px-6 overflow-x-auto overflow-y-hidden pb-2 no-scrollbar overflow-touch">
                <div className="flex flex-nowrap gap-2 min-w-max items-stretch">
                    <Link
                        href="/shop"
                        className={`shrink-0 min-h-[44px] flex items-center px-4 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${isAll ? 'bg-brand text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'}`}
                        aria-current={isAll ? 'page' : undefined}
                    >
                        All products
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
                                className={`shrink-0 min-h-[44px] flex items-center px-4 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${isActive ? 'bg-brand text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'}`}
                                aria-current={isActive ? 'page' : undefined}
                            >
                                {cat.name}
                            </Link>
                        );
                    })}
                </div>
            </div>
            {childChips.length > 0 && (
                <div className="lg:hidden w-full -mx-4 sm:-mx-6 px-4 sm:px-6 overflow-x-auto overflow-y-hidden pb-1 no-scrollbar overflow-touch">
                    <div className="flex flex-nowrap gap-2 min-w-max items-stretch">
                        {childChips.map((cat) => {
                            const slug = getSlug(cat);
                            const isActive = currentSlug === slug;
                            return (
                                <Link
                                    key={cat.id ?? slug}
                                    href={`/shop/${slug}`}
                                    className={`shrink-0 min-h-[40px] flex items-center px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${isActive ? 'bg-brand/10 text-brand border-brand/30' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
                                    aria-current={isActive ? 'page' : undefined}
                                >
                                    {cat.name}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
