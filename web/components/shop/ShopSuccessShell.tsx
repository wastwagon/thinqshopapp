'use client';

import Link from 'next/link';
import ShopContent from './ShopContent';

type ShopSuccessShellProps = {
    children: React.ReactNode;
};

export default function ShopSuccessShell({ children }: ShopSuccessShellProps) {
    return (
        <ShopContent>
            <div className="py-6 sm:py-10 space-y-6">{children}</div>
        </ShopContent>
    );
}

export function ShopLoadingState({ message = 'Loading…' }: { message?: string }) {
    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center py-10">
            <div className="animate-spin h-10 w-10 border-2 border-blue-600 border-t-transparent rounded-full mb-4" />
            <p className="text-sm text-gray-500">{message}</p>
        </div>
    );
}

export function ShopEmptyState({
    message,
    href,
    linkLabel,
}: {
    message: string;
    href: string;
    linkLabel: string;
}) {
    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 py-10 text-center">
            <p className="text-sm text-gray-500">{message}</p>
            <Link href={href} className="text-blue-600 font-semibold text-sm hover:underline">
                {linkLabel}
            </Link>
        </div>
    );
}
