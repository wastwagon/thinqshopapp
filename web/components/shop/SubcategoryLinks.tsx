'use client';

import Link from 'next/link';
import type { CategoryNode } from '@/lib/category-utils';

function getSlug(cat: CategoryNode): string {
    return cat.slug ?? cat.name?.toLowerCase?.()?.replace(/\s+/g, '-') ?? '';
}

interface SubcategoryLinksProps {
    subcategories: CategoryNode[];
    currentSlug?: string;
    variant?: 'sidebar' | 'chips';
}

export default function SubcategoryLinks({
    subcategories,
    currentSlug = '',
    variant = 'sidebar',
}: SubcategoryLinksProps) {
    if (subcategories.length === 0) return null;

    if (variant === 'chips') {
        return (
            <div className="flex flex-nowrap gap-2 min-w-max items-stretch">
                {subcategories.map((cat) => {
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
        );
    }

    return (
        <div className="space-y-1 pl-3 border-l-2 border-brand/20 ml-2">
            {subcategories.map((cat) => {
                const slug = getSlug(cat);
                const isActive = currentSlug === slug;
                return (
                    <Link
                        key={cat.id ?? slug}
                        href={`/shop/${slug}`}
                        className={`block w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-brand text-white' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
                        aria-current={isActive ? 'page' : undefined}
                    >
                        {cat.name}
                    </Link>
                );
            })}
        </div>
    );
}
