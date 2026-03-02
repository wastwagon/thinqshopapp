'use client';

import Link from 'next/link';

type Category = { id?: number; name: string; slug?: string };

interface CategoryBadgesProps {
    categories: Category[];
    currentSlug?: string;
}

function getSlug(cat: Category): string {
    return cat.slug ?? cat.name?.toLowerCase?.()?.replace(/\s+/g, '-') ?? '';
}

export default function CategoryBadges({ categories, currentSlug = '' }: CategoryBadgesProps) {
    const isAll = !currentSlug;

    return (
        <div className="lg:hidden w-full -mx-4 sm:-mx-6 px-4 sm:px-6 overflow-x-auto overflow-y-hidden pb-2 no-scrollbar overflow-touch">
            <div className="flex flex-nowrap gap-2 min-w-max items-stretch">
                <Link
                    href="/shop"
                    className={`shrink-0 min-h-[44px] flex items-center px-4 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${isAll ? 'bg-gray-900 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'}`}
                    aria-current={isAll ? 'page' : undefined}
                >
                    All Products
                </Link>
                {categories.map((cat) => {
                    const slug = getSlug(cat);
                    const isActive = currentSlug === slug;
                    return (
                        <Link
                            key={cat.id ?? cat.slug ?? cat.name}
                            href={`/shop/${slug}`}
                            className={`shrink-0 min-h-[44px] flex items-center px-4 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${isActive ? 'bg-gray-900 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'}`}
                            aria-current={isActive ? 'page' : undefined}
                        >
                            {cat.name}
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
