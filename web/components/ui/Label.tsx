'use client';

import { forwardRef, type LabelHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export const labelClassName = 'text-sm font-medium text-gray-700 mb-1.5 block';

const Label = forwardRef<HTMLLabelElement, LabelHTMLAttributes<HTMLLabelElement>>(function Label(
    { className, ...props },
    ref
) {
    return <label ref={ref} className={cn(labelClassName, className)} {...props} />;
});

export default Label;
