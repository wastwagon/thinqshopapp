'use client';

import Link from 'next/link';
import DashboardContent from './DashboardContent';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { buttonVariants } from '@/components/ui/Button';

type DashboardSuccessShellProps = {
    children: React.ReactNode;
    wide?: boolean;
};

export default function DashboardSuccessShell({ children, wide }: DashboardSuccessShellProps) {
    return (
        <DashboardContent wide={wide}>
            <div className="min-h-[calc(100dvh-11rem)] flex flex-col items-center justify-center py-6 sm:py-10">
                {children}
            </div>
        </DashboardContent>
    );
}

export function DashboardLoadingState({ message = 'Loading…' }: { message?: string }) {
    return (
        <DashboardSuccessShell>
            <LoadingSpinner size="md" label={message} />
        </DashboardSuccessShell>
    );
}

export function DashboardEmptyState({
    message,
    backHref,
    backLabel,
}: {
    message: string;
    backHref: string;
    backLabel: string;
}) {
    return (
        <DashboardSuccessShell>
            <div className="text-center px-4 space-y-4">
                <p className="text-gray-500 text-sm">{message}</p>
                <Link href={backHref} className={buttonVariants({ variant: 'primary', size: 'md' })}>
                    {backLabel}
                </Link>
            </div>
        </DashboardSuccessShell>
    );
}
