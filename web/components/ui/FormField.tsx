'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import Label from '@/components/ui/Label';

type FormFieldProps = {
    label?: string;
    htmlFor?: string;
    hint?: string;
    error?: string;
    className?: string;
    children: ReactNode;
    required?: boolean;
};

export default function FormField({
    label,
    htmlFor,
    hint,
    error,
    className,
    children,
    required,
}: FormFieldProps) {
    return (
        <div className={cn('w-full', className)}>
            {label && (
                <Label htmlFor={htmlFor}>
                    {label}
                    {required && <span className="text-red-500 ml-0.5" aria-hidden>*</span>}
                </Label>
            )}
            {children}
            {error ? (
                <p className="text-red-500 text-xs mt-1.5" role="alert">
                    {error}
                </p>
            ) : hint ? (
                <p className="text-gray-400 text-xs mt-1.5">{hint}</p>
            ) : null}
        </div>
    );
}
