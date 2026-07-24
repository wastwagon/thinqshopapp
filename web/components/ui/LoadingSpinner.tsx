'use client';

import { cn } from '@/lib/cn';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    label?: string;
    className?: string;
}

const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-2',
    lg: 'w-16 h-16 border-2',
};

export default function LoadingSpinner({ size = 'md', label = 'Loading', className }: LoadingSpinnerProps) {
    return (
        <div
            className={cn('flex flex-col items-center justify-center gap-4', className)}
            role="status"
            aria-label={label}
        >
            <div
                className={cn(
                    sizeClasses[size],
                    'border-blue-100 border-t-brand rounded-full animate-spin'
                )}
                aria-hidden
            />
            {label && (
                <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">{label}</span>
            )}
        </div>
    );
}
