'use client';

import { cn } from '@/lib/cn';

type SkeletonProps = {
    className?: string;
};

/** Lightweight pulse placeholder for loading states */
export default function Skeleton({ className }: SkeletonProps) {
    return (
        <div
            className={cn('animate-pulse rounded-xl bg-gray-100', className)}
            aria-hidden
        />
    );
}
