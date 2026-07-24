'use client';

import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import { inputClassName } from '@/components/ui/Input';

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
    invalid?: boolean;
};

const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
    { className, invalid, children, ...props },
    ref
) {
    return (
        <select
            ref={ref}
            aria-invalid={invalid || undefined}
            className={cn(
                inputClassName,
                'pr-10 appearance-none bg-[length:1rem] bg-[right_0.75rem_center] bg-no-repeat',
                "bg-[url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 24 24%27 stroke=%27%236b7280%27%3E%3Cpath stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%272%27 d=%27M19 9l-7 7-7-7%27/%3E%3C/svg%3E')]",
                invalid && 'border-red-400 focus:border-red-500 focus:ring-red-500/20',
                className
            )}
            {...props}
        >
            {children}
        </select>
    );
});

export default Select;
