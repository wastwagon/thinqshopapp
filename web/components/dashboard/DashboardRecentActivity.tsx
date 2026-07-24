'use client';

import Link from 'next/link';
import { ArrowUpRight, Package, Send, Truck } from 'lucide-react';
import { StatusBadge } from '@/components/ui/Badge';
import { buttonVariants } from '@/components/ui/Button';

export type ActivityKind = 'order' | 'transfer' | 'shipment';

export type RecentActivityItem = {
    id: string;
    kind: ActivityKind;
    title: string;
    subtitle: string;
    href: string;
    amount?: string;
    status?: string;
};

const KIND_ICON = {
    order: Package,
    transfer: Send,
    shipment: Truck,
} as const;

type DashboardRecentActivityProps = {
    items: RecentActivityItem[];
    loading?: boolean;
};

export default function DashboardRecentActivity({ items, loading }: DashboardRecentActivityProps) {
    return (
        <section aria-label="Recent activity" className="mb-5">
            <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                    <p className="text-xs font-semibold text-gray-500 mb-0.5">Activity</p>
                    <h2 className="text-base font-bold text-gray-900">Recent</h2>
                </div>
                <Link
                    href="/dashboard/orders"
                    className="text-xs font-semibold text-brand hover:text-brand/80"
                >
                    View all
                </Link>
            </div>

            <div className="flat-card overflow-hidden divide-y divide-gray-50">
                {loading ? (
                    <div className="px-4 py-8 text-center text-sm text-gray-400 animate-pulse">
                        Loading activity…
                    </div>
                ) : items.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                        <p className="text-sm text-gray-500 mb-3">No recent activity yet</p>
                        <Link
                            href="/shop"
                            className={buttonVariants({ variant: 'secondary', size: 'sm' })}
                        >
                            Start shopping
                        </Link>
                    </div>
                ) : (
                    items.map((item) => {
                        const Icon = KIND_ICON[item.kind];
                        return (
                            <Link
                                key={item.id}
                                href={item.href}
                                className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50/80 transition-colors group"
                            >
                                <span className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 text-brand flex items-center justify-center shrink-0">
                                    <Icon className="h-4 w-4" aria-hidden />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold text-gray-900 truncate">{item.title}</p>
                                    <p className="text-xs text-gray-500 truncate">{item.subtitle}</p>
                                </div>
                                <div className="flex flex-col items-end gap-1 shrink-0">
                                    {item.amount ? (
                                        <span className="text-sm font-semibold text-gray-900 tabular-nums">
                                            {item.amount}
                                        </span>
                                    ) : null}
                                    {item.status ? <StatusBadge status={item.status} /> : null}
                                </div>
                                <ArrowUpRight
                                    className="h-3.5 w-3.5 text-gray-300 group-hover:text-brand shrink-0 transition-colors"
                                    aria-hidden
                                />
                            </Link>
                        );
                    })
                )}
            </div>
        </section>
    );
}
