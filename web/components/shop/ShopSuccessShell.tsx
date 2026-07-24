'use client';

import Link from 'next/link';
import ShopContent from './ShopContent';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { buttonVariants } from '@/components/ui/Button';

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
            <LoadingSpinner size="md" label={message} />
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
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 py-10 text-center px-4">
            <p className="text-sm text-gray-500">{message}</p>
            <Link href={href} className={buttonVariants({ variant: 'primary', size: 'md' })}>
                {linkLabel}
            </Link>
        </div>
    );
}
