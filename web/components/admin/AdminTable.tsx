'use client';

import type { HTMLAttributes, ReactNode, TdHTMLAttributes, ThHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type AdminTableProps = {
    children: ReactNode;
    className?: string;
};

/** Flat table shell matching `.admin-table-wrap` */
export default function AdminTable({ children, className }: AdminTableProps) {
    return (
        <div className={cn('admin-table-wrap', className)}>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">{children}</table>
            </div>
        </div>
    );
}

export function AdminTableHead({ children }: { children: ReactNode }) {
    return (
        <thead>
            <tr className="bg-gray-50/50 border-b border-gray-50">{children}</tr>
        </thead>
    );
}

export function AdminTh({ className, align = 'left', ...props }: ThHTMLAttributes<HTMLTableCellElement> & { align?: 'left' | 'right' }) {
    return (
        <th
            className={cn(
                'admin-th',
                align === 'right' && 'text-right',
                className
            )}
            {...props}
        />
    );
}

export function AdminTableBody({ children, className }: { children: ReactNode; className?: string }) {
    return <tbody className={cn('divide-y divide-gray-50', className)}>{children}</tbody>;
}

export function AdminTr({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
    return <tr className={cn('hover:bg-gray-50/50 transition-colors', className)} {...props} />;
}

export function AdminTd({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
    return <td className={cn('admin-td', className)} {...props} />;
}

export function AdminTableLoading({ colSpan, label = 'Loading...' }: { colSpan: number; label?: string }) {
    return (
        <tr>
            <td colSpan={colSpan} className="py-10 text-center">
                <div
                    className="animate-spin h-7 w-7 border-2 border-brand border-t-transparent rounded-full mx-auto mb-2"
                    aria-hidden
                />
                <p className="text-sm text-gray-500">{label}</p>
            </td>
        </tr>
    );
}

export function AdminTableEmpty({
    colSpan,
    icon,
    message = 'No results',
}: {
    colSpan: number;
    icon?: ReactNode;
    message?: string;
}) {
    return (
        <tr>
            <td colSpan={colSpan} className="py-10 text-center text-gray-500">
                {icon}
                <p className="text-sm">{message}</p>
            </td>
        </tr>
    );
}
