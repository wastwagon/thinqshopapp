'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DashboardContent from '@/components/dashboard/DashboardContent';
import api from '@/lib/axios';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowUpRight, Plus } from 'lucide-react';
import DashboardWalletBalancePanel from '@/components/dashboard/DashboardWalletBalancePanel';
import DashboardServiceCard from '@/components/dashboard/DashboardServiceCard';
import DashboardTrustHighlights from '@/components/dashboard/DashboardTrustHighlights';
import DashboardRecentActivity, {
    type RecentActivityItem,
} from '@/components/dashboard/DashboardRecentActivity';
import { DASHBOARD_SERVICES } from '@/components/dashboard/dashboard-services';
import { buttonVariants } from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

function getDisplayName(user: { first_name?: string; last_name?: string; email?: string } | null) {
    if (!user) return 'there';
    if (user.first_name) return user.first_name;
    if (user.last_name) return user.last_name;
    return user.email?.split('@')[0] || 'there';
}

function formatDate(iso?: string) {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
    });
}

type TimedActivity = RecentActivityItem & { at: string };

export default function DashboardPage() {
    const { isAuthenticated, user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [walletBalance, setWalletBalance] = useState('0.00');
    const [balanceHidden, setBalanceHidden] = useState(false);
    const [activity, setActivity] = useState<RecentActivityItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [activityLoading, setActivityLoading] = useState(true);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams(window.location.search);
        if (params.get('error') !== 'admin_required') return;
        toast.error('You need an admin account to access that area.');
        router.replace('/dashboard');
    }, [router]);

    useEffect(() => {
        if (authLoading) return;
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }

        const fetchHome = async () => {
            try {
                const { data } = await api.get('/finance/wallet');
                setWalletBalance(Number(data.balance_ghs).toFixed(2));
            } catch (error) {
                console.error('Failed to fetch wallet', error);
            } finally {
                setLoading(false);
            }

            try {
                const [ordersRes, transfersRes, logisticsRes] = await Promise.all([
                    api.get('/orders').catch(() => ({ data: [] })),
                    api.get('/finance/transfers').catch(() => ({ data: [] })),
                    api.get('/logistics/history').catch(() => ({ data: [] })),
                ]);

                const orders = Array.isArray(ordersRes.data) ? ordersRes.data : [];
                const transfers = Array.isArray(transfersRes.data) ? transfersRes.data : [];
                const shipments = Array.isArray(logisticsRes.data) ? logisticsRes.data : [];

                const timed: TimedActivity[] = [
                    ...orders.map(
                        (o: {
                            id: number;
                            order_number?: string;
                            total?: number;
                            status?: string;
                            created_at?: string;
                        }) => ({
                            id: `order-${o.id}`,
                            kind: 'order' as const,
                            title: o.order_number ?? `Order #${o.id}`,
                            subtitle: `Order · ${formatDate(o.created_at)}`,
                            href: `/dashboard/orders/${o.id}`,
                            amount: `₵${Number(o.total ?? 0).toFixed(2)}`,
                            status: o.status,
                            at: o.created_at ?? '',
                        })
                    ),
                    ...transfers.map(
                        (t: {
                            id: number;
                            amount_ghs?: number;
                            payment_status?: string;
                            status?: string;
                            created_at?: string;
                            recipient_name?: string;
                        }) => ({
                            id: `transfer-${t.id}`,
                            kind: 'transfer' as const,
                            title: t.recipient_name ? `To ${t.recipient_name}` : `Transfer #${t.id}`,
                            subtitle: `Transfer · ${formatDate(t.created_at)}`,
                            href: `/dashboard/transfers/${t.id}/confirmation`,
                            amount: `₵${Number(t.amount_ghs ?? 0).toFixed(2)}`,
                            status: t.payment_status ?? t.status,
                            at: t.created_at ?? '',
                        })
                    ),
                    ...shipments.map(
                        (s: {
                            id: number;
                            tracking_number?: string;
                            status?: string;
                            created_at?: string;
                        }) => ({
                            id: `ship-${s.id}`,
                            kind: 'shipment' as const,
                            title: s.tracking_number ?? `Shipment #${s.id}`,
                            subtitle: `Logistics · ${formatDate(s.created_at)}`,
                            href: `/dashboard/logistics/${s.id}`,
                            status: s.status,
                            at: s.created_at ?? '',
                        })
                    ),
                ];

                timed.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));
                setActivity(
                    timed.slice(0, 6).map(({ at: _at, ...item }) => item)
                );
            } catch (error) {
                console.error('Failed to fetch activity', error);
            } finally {
                setActivityLoading(false);
            }
        };

        fetchHome();
    }, [isAuthenticated, authLoading, router]);

    if (authLoading || loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[50vh] py-8">
                    <LoadingSpinner label="Loading your dashboard…" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <DashboardContent>
                <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                    className="mb-4"
                >
                    <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="min-w-0 flex-1">
                            <h1 className="text-xl font-bold text-gray-900 tracking-tight leading-tight">
                                Welcome back, {getDisplayName(user)}
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">
                                Manage your wallet and services
                            </p>
                        </div>
                        <div className="hidden sm:flex items-center gap-2 shrink-0">
                            <Link
                                href="/dashboard/wallet"
                                className={buttonVariants({ variant: 'secondary', size: 'sm' })}
                            >
                                <Plus className="h-3.5 w-3.5" aria-hidden />
                                Deposit
                            </Link>
                            <Link
                                href="/dashboard/transfers"
                                className={buttonVariants({ variant: 'primary', size: 'sm' })}
                            >
                                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                                Send
                            </Link>
                        </div>
                    </div>

                    <DashboardWalletBalancePanel
                        label="Available balance"
                        amount={walletBalance}
                        hidden={balanceHidden}
                        onToggleHidden={() => setBalanceHidden((v) => !v)}
                        actions={
                            <>
                                <Link
                                    href="/dashboard/wallet"
                                    className={buttonVariants({
                                        variant: 'secondary',
                                        size: 'sm',
                                        className:
                                            'bg-white/95 text-brand border-0 hover:bg-white shadow-sm',
                                    })}
                                >
                                    <Plus className="h-3.5 w-3.5" aria-hidden />
                                    Deposit
                                </Link>
                                <Link
                                    href="/dashboard/transfers"
                                    className={buttonVariants({
                                        variant: 'secondary',
                                        size: 'sm',
                                        className:
                                            'bg-white/15 text-white border border-white/25 hover:bg-white/25',
                                    })}
                                >
                                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                                    Send
                                </Link>
                            </>
                        }
                    />
                </motion.section>

                <DashboardRecentActivity items={activity} loading={activityLoading} />

                <section aria-label="Main services" className="mb-2">
                    <div className="mb-3">
                        <p className="text-xs font-semibold text-gray-500 mb-0.5">Services</p>
                        <h2 className="text-base font-bold text-gray-900">What do you need?</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {DASHBOARD_SERVICES.map((service, index) => (
                            <DashboardServiceCard key={service.title} {...service} index={index} />
                        ))}
                    </div>
                </section>

                <DashboardTrustHighlights />
            </DashboardContent>
        </DashboardLayout>
    );
}
