'use client';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    label?: string;
}

const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-2',
    lg: 'w-16 h-16 border-2',
};

export default function LoadingSpinner({ size = 'md', label = 'Loading' }: LoadingSpinnerProps) {
    return (
        <div className="flex flex-col items-center justify-center gap-4" role="status" aria-label={label}>
            <div
                className={`${sizeClasses[size]} border-blue-200 border-t-blue-600 rounded-full animate-spin`}
                aria-hidden
            />
            {label && (
                <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">{label}</span>
            )}
        </div>
    );
}
