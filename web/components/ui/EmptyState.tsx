'use client';

import Link from 'next/link';
import { LucideIcon } from 'lucide-react';
import { buttonVariants } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description?: string;
    actionLabel?: string;
    actionHref?: string;
    className?: string;
}

export default function EmptyState({
    icon: Icon,
    title,
    description,
    actionLabel,
    actionHref,
    className,
}: EmptyStateProps) {
    return (
        <div
            className={cn(
                'flex flex-col items-center justify-center py-16 px-6 text-center flat-card',
                className
            )}
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
                    className={buttonVariants({
                        variant: 'primary',
                        size: 'md',
                        className: 'px-6',
                    })}
                >
                    {actionLabel}
                </Link>
            )}
        </div>
    );
}
