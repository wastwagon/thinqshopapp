'use client';

import React, { useEffect, useState, useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminStatGrid from '@/components/admin/AdminStatGrid';
import AdminTable, {
    AdminTableHead,
    AdminTh,
    AdminTableBody,
    AdminTr,
    AdminTd,
    AdminTableLoading,
    AdminTableEmpty,
} from '@/components/admin/AdminTable';
import { StatusBadge } from '@/components/ui/Badge';
import { buttonVariants } from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Link from 'next/link';
import {
    Package,
    Send,
    CheckCircle,
    Shield,
    ArrowUpRight,
    FileText,
    Banknote,
} from 'lucide-react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import { ADMIN_STAT_PROGRESS } from '@/lib/status-styles';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';

type RecentOrder = {
    id: number;
    order_number?: string;
    total?: number;
    status?: string;
    created_at?: string;
    user?: {
        email?: string;
        profile?: { first_name?: string; last_name?: string };
    };
};

function buildShipmentsChartData(shipments: { created_at?: string }[]): { name: string; value: number }[] {
    const days: { name: string; value: number }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dateKey = d.toISOString().slice(0, 10);
        const dayLabel = d.getDate().toString().padStart(2, '0');
        const count = shipments.filter((s) => {
            const created = s.created_at ? new Date(s.created_at).toISOString().slice(0, 10) : '';
            return created === dateKey;
        }).length;
        days.push({ name: dayLabel, value: count });
    }
    return days;
}

function orderCustomerName(o: RecentOrder) {
    const p = o.user?.profile;
    if (p?.first_name || p?.last_name) return `${p.first_name || ''} ${p.last_name || ''}`.trim();
    return o.user?.email ?? '—';
}

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        totalShipments: 0,
        pendingTransfers: 0,
        pendingRequests: 0,
        pendingOrders: 0,
        pendingWithdrawals: 0,
        pendingConsignments: 0,
        pendingEscrow: 0,
    });
    const [shipments, setShipments] = useState<{ created_at?: string }[]>([]);
    const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAdminStats = async () => {
            try {
                const [shipRes, transRes, procRes, ordersRes, wdRes, conRes, escrowRes, recentRes] =
                    await Promise.all([
                        api.get('/logistics/admin/shipments'),
                        api.get('/finance/transfers/admin/all'),
                        api.get('/procurement/admin/requests'),
                        api
                            .get('/orders/admin/list', { params: { status: 'pending', limit: 1, page: 1 } })
                            .catch(() => ({ data: { meta: { total: 0 } } })),
                        api
                            .get('/finance/wallet/admin/withdrawals/pending-count')
                            .catch(() => ({ data: { count: 0 } })),
                        api.get('/consignment/admin/pending-count').catch(() => ({ data: { count: 0 } })),
                        api.get('/consignment/admin/escrow/count').catch(() => ({ data: { count: 0 } })),
                        api
                            .get('/orders/admin/list', { params: { limit: 8, page: 1 } })
                            .catch(() => ({ data: [] })),
                    ]);

                const shipList = Array.isArray(shipRes.data) ? shipRes.data : [];
                setShipments(shipList);

                const recentRaw = recentRes.data;
                const recentList: RecentOrder[] = Array.isArray(recentRaw)
                    ? recentRaw
                    : recentRaw?.data ?? [];
                setRecentOrders(recentList.slice(0, 8));

                setStats({
                    totalShipments: shipList.length,
                    pendingTransfers: (transRes.data ?? []).filter(
                        (t: { payment_status?: string }) => t.payment_status === 'pending'
                    ).length,
                    pendingRequests: (procRes.data ?? []).filter(
                        (p: { status?: string }) => p.status === 'submitted'
                    ).length,
                    pendingOrders: ordersRes.data?.meta?.total ?? 0,
                    pendingWithdrawals: wdRes.data?.count ?? 0,
                    pendingConsignments: conRes.data?.count ?? 0,
                    pendingEscrow: escrowRes.data?.count ?? 0,
                });
            } catch {
                toast.error('Failed to load dashboard stats');
            } finally {
                setLoading(false);
            }
        };
        fetchAdminStats();
    }, []);

    const chartData = useMemo(() => buildShipmentsChartData(shipments), [shipments]);
    const hasChartData = chartData.some((d) => d.value > 0);

    const statCards = [
        {
            label: 'Shipments',
            value: loading ? '—' : stats.totalShipments,
            icon: Package,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            border: 'border-blue-200',
        },
        {
            label: 'Pending transfers',
            value: loading ? '—' : stats.pendingTransfers,
            icon: Send,
            color: 'text-orange-600',
            bg: 'bg-orange-50',
            border: 'border-orange-100',
        },
        {
            label: 'Procurement requests',
            value: loading ? '—' : stats.pendingRequests,
            icon: FileText,
            ...ADMIN_STAT_PROGRESS,
        },
        {
            label: 'Pending orders',
            value: loading ? '—' : stats.pendingOrders,
            icon: CheckCircle,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
            border: 'border-amber-100',
        },
    ];

    const attentionItems = [
        { href: '/admin/transfers', count: stats.pendingTransfers, label: 'Pending transfers' },
        { href: '/admin/procurement', count: stats.pendingRequests, label: 'Procurement requests' },
        { href: '/admin/withdrawals', count: stats.pendingWithdrawals, label: 'Pending withdrawals' },
        { href: '/admin/consignments', count: stats.pendingConsignments, label: 'Sell for Me queue' },
        { href: '/admin/escrow', count: stats.pendingEscrow, label: 'Escrow payouts', highlight: true },
    ];

    const attentionTotal =
        stats.pendingTransfers +
        stats.pendingRequests +
        stats.pendingWithdrawals +
        stats.pendingConsignments +
        stats.pendingEscrow;

    return (
        <DashboardLayout isAdmin={true}>
            <div className="pb-6 md:pb-8">
                <AdminPageHeader
                    icon={Shield}
                    title="Dashboard"
                    subtitle="Overview and queues that need action"
                    actions={
                        <Link
                            href="/admin/orders"
                            className={buttonVariants({ variant: 'secondary', size: 'sm' })}
                        >
                            View orders
                        </Link>
                    }
                />

                <AdminStatGrid items={statCards} />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4">
                    <div className="lg:col-span-8 admin-card p-5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-50/80 blur-[60px] pointer-events-none" />
                        <div className="relative z-10">
                            <div className="mb-3 flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 mb-0.5">Activity</p>
                                    <p className="text-base font-bold text-gray-900">
                                        Shipments in the last 7 days
                                    </p>
                                </div>
                                <Link
                                    href="/admin/logistics"
                                    className="text-xs font-semibold text-brand hover:text-brand/80 shrink-0"
                                >
                                    View all
                                </Link>
                            </div>
                            <div className="mt-3 w-full" style={{ minHeight: 200 }}>
                                {loading ? (
                                    <div className="h-[200px] flex items-center justify-center">
                                        <LoadingSpinner size="sm" label="Loading chart" />
                                    </div>
                                ) : !hasChartData ? (
                                    <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">
                                        No shipment data for the last 7 days
                                    </div>
                                ) : (
                                    <div className="h-[200px] w-full">
                                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={100}>
                                            <AreaChart data={chartData}>
                                                <defs>
                                                    <linearGradient id="colorShipments" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#02274f" stopOpacity={0.18} />
                                                        <stop offset="95%" stopColor="#02274f" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                <XAxis
                                                    dataKey="name"
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                                                    dy={10}
                                                />
                                                <YAxis hide />
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: '#02274f',
                                                        border: 'none',
                                                        borderRadius: '12px',
                                                        padding: '10px 12px',
                                                    }}
                                                    itemStyle={{ color: '#fff', fontSize: '10px', fontWeight: '600' }}
                                                    labelStyle={{ display: 'none' }}
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="value"
                                                    stroke="#02274f"
                                                    strokeWidth={3}
                                                    fillOpacity={1}
                                                    fill="url(#colorShipments)"
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-4 admin-card p-5 border-l-4 border-l-brand relative overflow-hidden">
                        <div className="flex justify-between items-center mb-3">
                            <p className="text-xs font-semibold text-gray-500">Needs attention</p>
                            <span className="w-1.5 h-1.5 bg-brand rounded-full animate-pulse" aria-hidden />
                        </div>
                        <div className="space-y-2">
                            {attentionItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`block p-3 rounded-xl border transition-colors group/item ${
                                        item.highlight
                                            ? 'border-blue-100 bg-blue-50/50 hover:bg-blue-50 hover:border-blue-200'
                                            : 'border-gray-200/90 bg-gray-50/80 hover:bg-blue-50 hover:border-blue-300'
                                    }`}
                                >
                                    <div className="flex justify-between items-start">
                                        <p
                                            className={`text-2xl font-bold tracking-tight ${
                                                item.highlight ? 'text-blue-900' : 'text-gray-900'
                                            }`}
                                        >
                                            {loading ? '—' : item.count}
                                        </p>
                                        <ArrowUpRight
                                            className={`h-3.5 w-3.5 transition-colors ${
                                                item.highlight
                                                    ? 'text-blue-300 group-hover/item:text-blue-700'
                                                    : 'text-gray-300 group-hover/item:text-brand'
                                            }`}
                                            aria-hidden
                                        />
                                    </div>
                                    <p
                                        className={`text-xs font-semibold mt-1 ${
                                            item.highlight ? 'text-blue-700' : 'text-brand'
                                        }`}
                                    >
                                        {item.label}
                                    </p>
                                </Link>
                            ))}
                        </div>
                        <Link
                            href="/admin/transfers"
                            className={buttonVariants({
                                variant: 'primary',
                                size: 'sm',
                                className: 'mt-3 w-full',
                            })}
                        >
                            View all queues ({loading ? 0 : attentionTotal})
                        </Link>
                    </div>
                </div>

                <div className="mb-4">
                    <div className="flex items-center justify-between gap-3 mb-3">
                        <div>
                            <p className="text-xs font-semibold text-gray-500 mb-0.5">Shop</p>
                            <p className="text-base font-bold text-gray-900">Recent orders</p>
                        </div>
                        <Link
                            href="/admin/orders"
                            className="text-xs font-semibold text-brand hover:text-brand/80"
                        >
                            View all
                        </Link>
                    </div>
                    <AdminTable>
                        <AdminTableHead>
                            <AdminTh>Order</AdminTh>
                            <AdminTh>Customer</AdminTh>
                            <AdminTh align="right">Total</AdminTh>
                            <AdminTh>Status</AdminTh>
                            <AdminTh>Date</AdminTh>
                        </AdminTableHead>
                        <AdminTableBody>
                            {loading ? (
                                <AdminTableLoading colSpan={5} label="Loading orders…" />
                            ) : recentOrders.length === 0 ? (
                                <AdminTableEmpty colSpan={5} message="No orders yet" />
                            ) : (
                                recentOrders.map((o) => (
                                    <AdminTr key={o.id}>
                                        <AdminTd>
                                            <Link
                                                href={`/admin/orders/${o.id}`}
                                                className="font-semibold text-gray-900 hover:text-brand"
                                            >
                                                {o.order_number ?? `#${o.id}`}
                                            </Link>
                                        </AdminTd>
                                        <AdminTd className="text-gray-600">{orderCustomerName(o)}</AdminTd>
                                        <AdminTd className="text-right tabular-nums font-semibold text-gray-900">
                                            ₵{Number(o.total ?? 0).toFixed(2)}
                                        </AdminTd>
                                        <AdminTd>
                                            <StatusBadge status={o.status ?? 'pending'} />
                                        </AdminTd>
                                        <AdminTd className="text-gray-500 text-xs whitespace-nowrap">
                                            {o.created_at
                                                ? new Date(o.created_at).toLocaleDateString(undefined, {
                                                      month: 'short',
                                                      day: 'numeric',
                                                  })
                                                : '—'}
                                        </AdminTd>
                                    </AdminTr>
                                ))
                            )}
                        </AdminTableBody>
                    </AdminTable>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
                    <Link href="/admin/orders" className="admin-stat-card-interactive hover:border-blue-300">
                        <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center border border-amber-100 mb-2">
                            <CheckCircle className="h-4 w-4 text-amber-600" aria-hidden />
                        </div>
                        <p className="text-xs font-semibold text-gray-500 mb-0.5">Shop orders</p>
                        <p className="text-lg font-bold text-gray-900">
                            {loading ? '—' : stats.pendingOrders} pending
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">Open the order queue</p>
                    </Link>
                    <Link href="/admin/withdrawals" className="admin-stat-card-interactive hover:border-blue-300">
                        <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-100 mb-2">
                            <Banknote className="h-4 w-4 text-brand" aria-hidden />
                        </div>
                        <p className="text-xs font-semibold text-gray-500 mb-0.5">Withdrawals</p>
                        <p className="text-lg font-bold text-gray-900">
                            {loading ? '—' : stats.pendingWithdrawals} pending
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">Review payout requests</p>
                    </Link>
                </div>
            </div>
        </DashboardLayout>
    );
}
