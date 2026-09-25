'use client';

import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/cn';

export type AdminStatItem = {
    label: string;
    value: string | number;
    icon: LucideIcon;
    color: string;
    bg: string;
    border: string;
    href?: string;
    onClick?: () => void;
    selected?: boolean;
    ariaLabel?: string;
};

type AdminStatGridProps = {
    items: AdminStatItem[];
    columns?: 2 | 3 | 4 | 5;
    className?: string;
};

const colClass: Record<number, string> = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
};

function StatCardContent({ item }: { item: AdminStatItem }) {
    const Icon = item.icon;
    return (
        <>
            <div
                className={cn(
                    'w-9 h-9 rounded-lg border flex items-center justify-center mb-2',
                    item.bg,
                    item.border,
                    item.color,
                )}
            >
                <Icon className="h-4 w-4" aria-hidden />
            </div>
            <p className="text-xs font-semibold text-gray-500 mb-0.5">{item.label}</p>
            <p className="text-xl font-bold text-gray-900">{item.value}</p>
        </>
    );
}

export default function AdminStatGrid({ items, columns = 4, className = '' }: AdminStatGridProps) {
    return (
        <div className={`grid ${colClass[columns]} gap-3 mb-4 ${className}`.trim()}>
            {items.map((item) => {
                const selectedClass = item.selected
                    ? 'border-brand ring-2 ring-brand/15 bg-blue-50/40'
                    : undefined;
                if (item.href) {
                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            aria-label={item.ariaLabel ?? item.label}
                            aria-current={item.selected ? 'true' : undefined}
                            className={cn('admin-stat-card-interactive', selectedClass)}
                        >
                            <StatCardContent item={item} />
                        </Link>
                    );
                }
                if (item.onClick) {
                    return (
                        <button
                            key={item.label}
                            type="button"
                            onClick={item.onClick}
                            aria-label={item.ariaLabel ?? item.label}
                            aria-pressed={item.selected}
                            className={cn('admin-stat-card-interactive text-left w-full', selectedClass)}
                        >
                            <StatCardContent item={item} />
                        </button>
                    );
                }
                return (
                    <div key={item.label} className="admin-stat-card">
                        <StatCardContent item={item} />
                    </div>
                );
            })}
        </div>
    );
}
