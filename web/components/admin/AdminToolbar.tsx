'use client';

import type { ReactNode } from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/lib/cn';
import Input from '@/components/ui/Input';

type AdminToolbarProps = {
    searchValue?: string;
    onSearchChange?: (value: string) => void;
    searchPlaceholder?: string;
    searchAriaLabel?: string;
    children?: ReactNode;
    className?: string;
};

/** Search field + primary actions for admin page headers */
export default function AdminToolbar({
    searchValue,
    onSearchChange,
    searchPlaceholder = 'Search…',
    searchAriaLabel = 'Search',
    children,
    className,
}: AdminToolbarProps) {
    return (
        <div className={cn('flex flex-wrap items-center gap-2', className)}>
            {onSearchChange != null && (
                <div className="relative flex-1 min-w-0 sm:flex-initial sm:w-48">
                    <Search
                        className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none"
                        aria-hidden
                    />
                    <Input
                        type="search"
                        value={searchValue ?? ''}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder={searchPlaceholder}
                        aria-label={searchAriaLabel}
                        className="h-9 min-h-[36px] pl-9 text-xs sm:w-48"
                    />
                </div>
            )}
            {children}
        </div>
    );
}
