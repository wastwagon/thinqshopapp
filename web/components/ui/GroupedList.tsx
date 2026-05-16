'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { ChevronRight, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

export function GroupedList({
    children,
    className,
    'aria-label': ariaLabel,
}: {
    children: ReactNode;
    className?: string;
    'aria-label'?: string;
}) {
    return (
        <div
            role="list"
            aria-label={ariaLabel}
            className={cn('rounded-xl border border-gray-200/90 bg-white overflow-hidden divide-y divide-gray-100', className)}
        >
            {children}
        </div>
    );
}

export function GroupedListItem({
    href,
    onClick,
    icon: Icon,
    title,
    subtitle,
    destructive,
    external,
}: {
    href?: string;
    onClick?: () => void;
    icon?: LucideIcon;
    title: string;
    subtitle?: string;
    destructive?: boolean;
    external?: boolean;
}) {
    const content = (
        <>
            {Icon && (
                <span
                    className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                        destructive ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-600',
                    )}
                >
                    <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
                </span>
            )}
            <span className="flex-1 min-w-0 text-left">
                <span className={cn('block text-[15px] font-medium leading-snug', destructive ? 'text-red-600' : 'text-gray-900')}>
                    {title}
                </span>
                {subtitle && <span className="block text-xs text-gray-500 mt-0.5 truncate">{subtitle}</span>}
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" aria-hidden />
        </>
    );

    const rowClass =
        'flex items-center gap-3 w-full px-4 py-3.5 min-h-[52px] bg-white transition-colors active:bg-gray-50 hover:bg-gray-50/80 focus:outline-none focus-visible:bg-gray-50';

    if (href) {
        return (
            <Link
                href={href}
                role="listitem"
                className={rowClass}
                {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            >
                {content}
            </Link>
        );
    }

    if (onClick) {
        return (
            <button type="button" role="listitem" onClick={onClick} className={rowClass}>
                {content}
            </button>
        );
    }

    return (
        <div role="listitem" className={rowClass}>
            {content}
        </div>
    );
}

export function GroupedListSection({
    title,
    children,
    className,
}: {
    title?: string;
    children: ReactNode;
    className?: string;
}) {
    return (
        <section className={cn('mb-6', className)}>
            {title ? <p className="section-label">{title}</p> : null}
            <GroupedList>{children}</GroupedList>
        </section>
    );
}
