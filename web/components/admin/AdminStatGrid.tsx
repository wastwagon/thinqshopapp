'use client';

import type { LucideIcon } from 'lucide-react';

export type AdminStatItem = {
    label: string;
    value: string | number;
    icon: LucideIcon;
    color: string;
    bg: string;
    border: string;
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

export default function AdminStatGrid({ items, columns = 4, className = '' }: AdminStatGridProps) {
    return (
        <div className={`grid ${colClass[columns]} gap-3 mb-4 ${className}`.trim()}>
            {items.map((s) => {
                const Icon = s.icon;
                return (
                    <div key={s.label} className="admin-stat-card">
                        <div className={`w-9 h-9 rounded-lg ${s.bg} ${s.border} border flex items-center justify-center ${s.color} mb-2`}>
                            <Icon className="h-4 w-4" aria-hidden />
                        </div>
                        <p className="text-xs font-semibold text-gray-500 mb-0.5">{s.label}</p>
                        <p className="text-xl font-bold text-gray-900">{s.value}</p>
                    </div>
                );
            })}
        </div>
    );
}
