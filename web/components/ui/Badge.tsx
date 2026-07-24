'use client';

import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type BadgeVariant = 'default' | 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'outline';

const variantClasses: Record<BadgeVariant, string> = {
    default: 'bg-gray-100 text-gray-700 border-gray-200',
    brand: 'bg-blue-50 text-blue-700 border-blue-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    danger: 'bg-red-50 text-red-700 border-red-200',
    info: 'bg-sky-50 text-sky-700 border-sky-200',
    outline: 'bg-white text-gray-600 border-gray-200',
};

export function badgeVariants({
    variant = 'default',
    className,
}: {
    variant?: BadgeVariant;
    className?: string;
} = {}) {
    return cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap',
        variantClasses[variant],
        className
    );
}

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
    variant?: BadgeVariant;
    children: ReactNode;
};

export default function Badge({ variant = 'default', className, children, ...props }: BadgeProps) {
    return (
        <span className={badgeVariants({ variant, className })} {...props}>
            {children}
        </span>
    );
}

/** Map common domain status strings to semantic badge variants */
export function statusToBadgeVariant(status?: string | null): BadgeVariant {
    const s = (status || '').toLowerCase();
    if (['completed', 'paid', 'approved', 'delivered', 'success', 'active', 'released'].includes(s)) {
        return 'success';
    }
    if (['pending', 'processing', 'in_transit', 'shipped', 'awaiting', 'open'].includes(s)) {
        return 'brand';
    }
    if (['cancelled', 'canceled', 'failed', 'rejected', 'refunded', 'expired'].includes(s)) {
        return 'danger';
    }
    if (['draft', 'on_hold', 'paused', 'warning'].includes(s)) {
        return 'warning';
    }
    return 'default';
}

type StatusBadgeProps = Omit<BadgeProps, 'variant'> & {
    status: string;
};

export function StatusBadge({ status, className, children, ...props }: StatusBadgeProps) {
    return (
        <Badge variant={statusToBadgeVariant(status)} className={className} {...props}>
            {children ?? status.replace(/_/g, ' ')}
        </Badge>
    );
}
