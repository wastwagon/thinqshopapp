'use client';

import Link from 'next/link';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description?: string;
    actionLabel?: string;
    actionHref?: string;
}

export default function EmptyState({ icon: Icon, title, description, actionLabel, actionHref }: EmptyStateProps) {
    return (
        <div
            className="flex flex-col items-center justify-center py-16 px-6 text-center bg-white rounded-2xl border border-gray-100 shadow-sm"
            role="status"
        >
            <div
                className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-6 text-gray-300"
                aria-hidden
            >
                <Icon className="h-8 w-8" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
            {description && <p className="text-sm text-gray-500 max-w-sm mb-6">{description}</p>}
            {actionLabel && actionHref && (
                <Link
                    href={actionHref}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition-colors min-h-[44px] inline-flex items-center justify-center"
                >
                    {actionLabel}
                </Link>
            )}
        </div>
    );
}
