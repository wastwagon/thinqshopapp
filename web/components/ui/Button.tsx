'use client';

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'link';
export type ButtonSize = 'sm' | 'md' | 'lg';

const variantClasses: Record<ButtonVariant, string> = {
    primary:
        'bg-brand text-white hover:bg-brand/90 focus-visible:ring-brand shadow-sm',
    secondary:
        'border border-gray-200/90 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300 focus-visible:ring-brand',
    ghost: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus-visible:ring-brand',
    danger:
        'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600 shadow-sm',
    link: 'text-brand hover:text-brand/80 underline-offset-4 hover:underline px-0 min-h-0 h-auto',
};

const sizeClasses: Record<ButtonSize, string> = {
    sm: 'h-9 min-h-[36px] px-3 text-xs rounded-lg gap-1.5',
    md: 'h-11 min-h-[44px] px-4 text-sm rounded-xl gap-2',
    lg: 'h-12 min-h-[48px] px-6 text-sm rounded-xl gap-2',
};

export function buttonVariants({
    variant = 'primary',
    size = 'md',
    className,
}: {
    variant?: ButtonVariant;
    size?: ButtonSize;
    className?: string;
} = {}) {
    return cn(
        'inline-flex items-center justify-center font-semibold transition-colors touch-manipulation',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:pointer-events-none',
        'active:scale-[0.99]',
        variantClasses[variant],
        variant !== 'link' && sizeClasses[size],
        className
    );
}

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
    {
        className,
        variant = 'primary',
        size = 'md',
        loading = false,
        disabled,
        leftIcon,
        rightIcon,
        children,
        type = 'button',
        ...props
    },
    ref
) {
    return (
        <button
            ref={ref}
            type={type}
            disabled={disabled || loading}
            className={buttonVariants({ variant, size, className })}
            {...props}
        >
            {loading ? (
                <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden />
            ) : (
                leftIcon
            )}
            {children}
            {!loading && rightIcon}
        </button>
    );
});

export default Button;
