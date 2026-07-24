'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

/** Shared field chrome — also used by Textarea/Select and legacy auth class aliases */
export const controlClassName =
    'block w-full bg-white border border-gray-200/90 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand disabled:opacity-50 disabled:bg-gray-50 disabled:cursor-not-allowed';

export const inputClassName = cn(controlClassName, 'h-11 min-h-[44px] px-4 py-2.5');

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
    invalid?: boolean;
};

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
    { className, invalid, type = 'text', ...props },
    ref
) {
    return (
        <input
            ref={ref}
            type={type}
            aria-invalid={invalid || undefined}
            className={cn(
                inputClassName,
                invalid && 'border-red-400 focus:border-red-500 focus:ring-red-500/20',
                className
            )}
            {...props}
        />
    );
});

export default Input;
