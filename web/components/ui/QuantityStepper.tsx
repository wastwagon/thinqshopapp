'use client';

import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/cn';

type QuantityStepperProps = {
    value: number;
    onChange: (next: number) => void;
    min?: number;
    max?: number;
    className?: string;
    size?: 'sm' | 'md';
};

/** Shared cart/PDP quantity control */
export default function QuantityStepper({
    value,
    onChange,
    min = 1,
    max,
    className,
    size = 'md',
}: QuantityStepperProps) {
    const btn =
        size === 'sm'
            ? 'min-w-[40px] min-h-[40px] w-8 h-8'
            : 'min-w-[44px] min-h-[44px] w-9 h-9';

    return (
        <div
            className={cn(
                'inline-flex items-center p-0.5 bg-gray-50 border border-gray-200/90 rounded-lg',
                className
            )}
        >
            <button
                type="button"
                onClick={() => onChange(Math.max(min, value - 1))}
                disabled={value <= min}
                className={cn(
                    btn,
                    'flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-600 disabled:opacity-30 transition-colors'
                )}
                aria-label="Decrease quantity"
            >
                <Minus className="h-3.5 w-3.5" aria-hidden />
            </button>
            <span className="w-8 text-center text-xs font-semibold text-gray-900 tabular-nums" aria-live="polite">
                {value}
            </span>
            <button
                type="button"
                onClick={() => onChange(max != null ? Math.min(max, value + 1) : value + 1)}
                disabled={max != null && value >= max}
                className={cn(
                    btn,
                    'flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-600 disabled:opacity-30 transition-colors'
                )}
                aria-label="Increase quantity"
            >
                <Plus className="h-3.5 w-3.5" aria-hidden />
            </button>
        </div>
    );
}
