'use client';

import React, { useEffect, useState, useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminStatGrid from '@/components/admin/AdminStatGrid';
import Link from 'next/link';
import {
    Package,
    Send,
    CheckCircle,
    Shield,
    ArrowUpRight,
    FileText,
} from 'lucide-react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';

function buildShipmentsChartData(shipments: any[]): { name: string; value: number }[] {
    const days: { name: string; value: number }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dateKey = d.toISOString().slice(0, 10);
        const dayLabel = d.getDate().toString().padStart(2, '0');
        const count = shipments.filter((s: any) => {
            const created = s.created_at ? new Date(s.created_at).toISOString().slice(0, 10) : '';
            return created === dateKey;
        }).length;
        days.push({ name: dayLabel, value: count });
    }
    return days;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        totalShipments: 0,
        pendingTransfers: 0,
        pendingRequests: 0,
        pendingOrders: 0,
    });
    const [shipments, setShipments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAdminStats = async () => {
            try {
                const [shipRes, transRes, procRes, ordersRes] = await Promise.all([
                    api.get('/logistics/admin/shipments'),
                    api.get('/finance/transfers/admin/all'),
                    api.get('/procurement/admin/requests'),
                    api.get('/orders/admin/list', { params: { status: 'pending', limit: 1, page: 1 } }).catch(() => ({ data: { meta: { total: 0 } } })),
                ]);

                const shipList = Array.isArray(shipRes.data) ? shipRes.data : [];
                setShipments(shipList);
                setStats({
                    totalShipments: shipList.length,
                    pendingTransfers: (transRes.data ?? []).filter((t: any) => t.payment_status === 'pending').length,
                    pendingRequests: (procRes.data ?? []).filter((p: any) => p.status === 'submitted').length,
                    pendingOrders: ordersRes.data?.meta?.total ?? 0,
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
        { label: 'Shipments', value: loading ? '—' : stats.totalShipments, icon: Package, color: 'text-brand', bg: 'bg-brand/5', border: 'border-brand/20' },
        { label: 'Pending transfers', value: loading ? '—' : stats.pendingTransfers, icon: Send, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
        { label: 'Procurement requests', value: loading ? '—' : stats.pendingRequests, icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
        { label: 'Pending orders', value: loading ? '—' : stats.pendingOrders, icon: CheckCircle, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
    ];

    const attentionTotal = stats.pendingTransfers + stats.pendingRequests;

    return (
        <DashboardLayout isAdmin={true}>
            <div className="pb-6 md:pb-8">
                <AdminPageHeader icon={Shield} title="Dashboard" subtitle="Overview and quick actions" />

                <AdminStatGrid items={statCards} />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4">
                    <div className="lg:col-span-8 admin-card p-5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-brand/5 blur-[60px] pointer-events-none" />
                        <div className="relative z-10">
                            <div className="mb-3">
                                <p className="text-xs font-semibold text-gray-500 mb-0.5">Activity</p>
                                <p className="text-base font-bold text-gray-900">Shipments in the last 7 days</p>
                            </div>
                            <div className="mt-3 w-full" style={{ minHeight: 200 }}>
                                {loading ? (
                                    <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">Loading…</div>
                                ) : !hasChartData ? (
                                    <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">No shipment data for the last 7 days</div>
                                ) : (
                                    <div className="h-[200px] w-full">
                                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={100}>
                                            <AreaChart data={chartData}>
                                                <defs>
                                                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.12} />
                                                        <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
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
                                                        backgroundColor: '#111827',
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
                                                    stroke="#f97316"
                                                    strokeWidth={3}
                                                    fillOpacity={1}
                                                    fill="url(#colorSales)"
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
                            <Link
                                href="/admin/transfers"
                                className="block p-3 rounded-xl border border-gray-200/90 bg-gray-50/80 hover:bg-brand/5 hover:border-brand/30 transition-colors group/item"
                            >
                                <div className="flex justify-between items-start">
                                    <p className="text-2xl font-bold tracking-tight text-gray-900">{loading ? '—' : stats.pendingTransfers}</p>
                                    <ArrowUpRight className="h-3.5 w-3.5 text-gray-300 group-hover/item:text-brand transition-colors" aria-hidden />
                                </div>
                                <p className="text-xs font-semibold text-brand mt-1">Pending transfers</p>
                            </Link>
                            <Link
                                href="/admin/procurement"
                                className="block p-3 rounded-xl border border-gray-200/90 bg-gray-50/80 hover:bg-brand/5 hover:border-brand/30 transition-colors group/item"
                            >
                                <div className="flex justify-between items-start">
                                    <p className="text-2xl font-bold tracking-tight text-gray-900">{loading ? '—' : stats.pendingRequests}</p>
                                    <ArrowUpRight className="h-3.5 w-3.5 text-gray-300 group-hover/item:text-brand transition-colors" aria-hidden />
                                </div>
                                <p className="text-xs font-semibold text-indigo-600 mt-1">Procurement requests</p>
                            </Link>
                        </div>
                        <Link
                            href="/admin/transfers"
                            className="mt-3 block w-full min-h-[44px] h-10 bg-brand text-white rounded-xl font-semibold text-xs hover:bg-brand/90 transition-colors flex items-center justify-center"
                        >
                            View all ({loading ? 0 : attentionTotal})
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
                    <Link href="/admin/orders" className="admin-stat-card-interactive hover:border-brand/30">
                        <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center border border-amber-100 mb-2">
                            <CheckCircle className="h-4 w-4 text-amber-600" aria-hidden />
                        </div>
                        <p className="text-xs font-semibold text-gray-500 mb-0.5">Shop orders</p>
                        <p className="text-lg font-bold text-gray-900">{loading ? '—' : stats.pendingOrders} pending</p>
                        <p className="text-xs text-gray-400 mt-0.5">View order queue</p>
                    </Link>
                </div>
            </div>
        </DashboardLayout>
    );
}
