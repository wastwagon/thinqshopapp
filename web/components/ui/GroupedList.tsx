'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { ChevronRight, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

const rowClass =
    'flex items-center gap-3 w-full px-4 py-3.5 min-h-[52px] bg-white transition-colors active:bg-gray-50 hover:bg-gray-50/80 focus:outline-none focus-visible:bg-gray-50';

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

export function GroupedListHeader({
    title,
    icon: Icon,
    action,
    className,
}: {
    title: string;
    icon?: LucideIcon;
    action?: ReactNode;
    className?: string;
}) {
    return (
        <div className={cn('px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/50', className)}>
            <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                {Icon && <Icon className="h-4 w-4 text-brand shrink-0" aria-hidden />}
                {title}
            </h3>
            {action}
        </div>
    );
}

export function GroupedListEmpty({
    icon: Icon,
    message,
    action,
}: {
    icon?: LucideIcon;
    message: string;
    action?: ReactNode;
}) {
    return (
        <div className="py-10 px-6 text-center" role="status">
            {Icon && <Icon className="h-10 w-10 mx-auto mb-3 text-gray-200" aria-hidden />}
            <p className="text-sm text-gray-500">{message}</p>
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}

function RowIcon({ icon: Icon, destructive }: { icon: LucideIcon; destructive?: boolean }) {
    return (
        <span
            className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                destructive ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-600',
            )}
        >
            <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
        </span>
    );
}

function RowBody({ title, subtitle, destructive }: { title: string; subtitle?: string; destructive?: boolean }) {
    return (
        <span className="flex-1 min-w-0 text-left">
            <span className={cn('block text-[15px] font-medium leading-snug truncate', destructive ? 'text-red-600' : 'text-gray-900')}>
                {title}
            </span>
            {subtitle && <span className="block text-xs text-gray-500 mt-0.5 truncate">{subtitle}</span>}
        </span>
    );
}

export function GroupedListRow({
    icon: Icon,
    iconClassName,
    title,
    subtitle,
    trailing,
    destructive,
}: {
    icon?: LucideIcon;
    iconClassName?: string;
    title: string;
    subtitle?: string;
    trailing?: ReactNode;
    destructive?: boolean;
}) {
    return (
        <div role="listitem" className={rowClass}>
            {Icon && (
                <span
                    className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                        iconClassName ?? (destructive ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-600'),
                    )}
                >
                    <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
                </span>
            )}
            <RowBody title={title} subtitle={subtitle} destructive={destructive} />
            {trailing && <span className="shrink-0">{trailing}</span>}
        </div>
    );
}

export function GroupedListItem({
    href,
    onClick,
    icon: Icon,
    title,
    subtitle,
    trailing,
    destructive,
    external,
    showChevron = true,
}: {
    href?: string;
    onClick?: () => void;
    icon?: LucideIcon;
    title: string;
    subtitle?: string;
    trailing?: ReactNode;
    destructive?: boolean;
    external?: boolean;
    showChevron?: boolean;
}) {
    const content = (
        <>
            {Icon && <RowIcon icon={Icon} destructive={destructive} />}
            <RowBody title={title} subtitle={subtitle} destructive={destructive} />
            {trailing}
            {showChevron && <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" aria-hidden />}
        </>
    );

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
