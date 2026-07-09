'use client';

import Link from 'next/link';
import DashboardContent from './DashboardContent';

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
            <div className="flex flex-col items-center gap-4">
                <div className="animate-spin h-10 w-10 border-2 border-blue-600 border-t-transparent rounded-full" />
                <p className="text-sm text-gray-500">{message}</p>
            </div>
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
            <div className="text-center px-4">
                <p className="text-gray-500 text-sm mb-4">{message}</p>
                <Link href={backHref} className="text-blue-600 font-semibold text-sm hover:underline">
                    {backLabel}
                </Link>
            </div>
        </DashboardSuccessShell>
    );
}
