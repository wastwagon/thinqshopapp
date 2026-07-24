'use client';

import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import { controlClassName } from '@/components/ui/Input';

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
    invalid?: boolean;
};

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
    { className, invalid, rows = 4, ...props },
    ref
) {
    return (
        <textarea
            ref={ref}
            rows={rows}
            aria-invalid={invalid || undefined}
            className={cn(
                controlClassName,
                'min-h-[80px] px-4 py-2.5 resize-y',
                invalid && 'border-red-400 focus:border-red-500 focus:ring-red-500/20',
                className
            )}
            {...props}
        />
    );
});

export default Textarea;
