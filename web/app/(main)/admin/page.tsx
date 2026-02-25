'use client';

import React, { useEffect, useState, useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
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
    });
    const [shipments, setShipments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAdminStats = async () => {
            try {
                const [shipRes, transRes, procRes] = await Promise.all([
                    api.get('/logistics/admin/shipments'),
                    api.get('/finance/transfers/admin/all'),
                    api.get('/procurement/admin/requests')
                ]);

                const shipList = Array.isArray(shipRes.data) ? shipRes.data : [];
                setShipments(shipList);
                setStats({
                    totalShipments: shipList.length,
                    pendingTransfers: (transRes.data ?? []).filter((t: any) => t.status === 'pending').length,
                    pendingRequests: (procRes.data ?? []).filter((p: any) => p.status === 'submitted').length
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
        { label: 'Shipments', value: loading ? '—' : stats.totalShipments, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
        { label: 'Pending transfers', value: loading ? '—' : stats.pendingTransfers, icon: Send, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
        { label: 'Procurement requests', value: loading ? '—' : stats.pendingRequests, icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
        { label: 'Status', value: 'Operational', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
    ];

    return (
        <DashboardLayout isAdmin={true}>
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                    <Shield className="h-7 w-7 text-blue-600" />
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
                        <p className="text-xs text-gray-500 mt-0.5">Overview and quick actions</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {statCards.map((s, i) => (
                    <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                        <div className={`w-9 h-9 rounded-lg ${s.bg} ${s.border} border flex items-center justify-center ${s.color} mb-2`}>
                            <s.icon className="h-4 w-4" />
                        </div>
                        <p className="text-[10px] font-semibold text-gray-500 mb-0.5">{s.label}</p>
                        <p className="text-xl font-bold text-gray-900">{s.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4">
                <div className="lg:col-span-8 bg-white rounded-xl p-5 border border-gray-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/5 blur-[60px]" />
                    <div className="relative z-10">
                        <div className="mb-3">
                            <p className="text-[10px] font-semibold text-gray-500 mb-0.5">Activity</p>
                            <p className="text-base font-bold text-gray-900">Shipments in the last 7 days</p>
                        </div>
                        <div className="h-[200px] w-full mt-3">
                            {loading ? (
                                <div className="h-full flex items-center justify-center text-gray-400 text-sm">Loading…</div>
                            ) : !hasChartData ? (
                                <div className="h-full flex items-center justify-center text-gray-400 text-sm">No shipment data for the last 7 days</div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
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
                                                boxShadow: '0 10px 40px -12px rgba(0, 0, 0, 0.2)'
                                            }}
                                            itemStyle={{ color: '#fff', fontSize: '10px', fontWeight: '600' }}
                                            labelStyle={{ display: 'none' }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="value"
                                            stroke="#2563eb"
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#colorSales)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-4 bg-gray-900 rounded-xl p-5 relative overflow-hidden">
                    <div className="absolute bottom-0 right-0 w-40 h-40 bg-blue-600/20 blur-[50px]" />
                    <div className="relative z-10 flex flex-col h-full text-white">
                        <div className="flex justify-between items-center mb-3">
                            <p className="text-[10px] font-semibold text-white/50">Needs attention</p>
                            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                        </div>
                        <div className="space-y-2">
                            <a href="/admin/transfers" className="block p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors group/item">
                                <div className="flex justify-between items-start">
                                    <p className="text-2xl font-bold tracking-tight">{loading ? '—' : stats.pendingTransfers}</p>
                                    <ArrowUpRight className="h-3.5 w-3.5 text-white/30 group-hover/item:text-blue-400 transition-colors" />
                                </div>
                                <p className="text-[10px] font-semibold text-blue-300 mt-1">Pending transfers</p>
                            </a>
                            <a href="/admin/procurement" className="block p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors group/item">
                                <div className="flex justify-between items-start">
                                    <p className="text-2xl font-bold tracking-tight">{loading ? '—' : stats.pendingRequests}</p>
                                    <ArrowUpRight className="h-3.5 w-3.5 text-white/30 group-hover/item:text-blue-400 transition-colors" />
                                </div>
                                <p className="text-[10px] font-semibold text-indigo-300 mt-1">Procurement requests</p>
                            </a>
                        </div>
                        <a href="/admin/transfers" className="mt-3 block w-full h-9 bg-white text-gray-900 rounded-lg font-semibold text-xs hover:bg-blue-50 transition-colors flex items-center justify-center">
                            View all ({loading ? 0 : stats.pendingTransfers + stats.pendingRequests})
                        </a>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-start">
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center border border-green-100 mb-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <p className="text-[10px] font-semibold text-gray-500 mb-0.5">System</p>
                    <p className="text-lg font-bold text-gray-900">Operational</p>
                    <p className="text-[9px] text-gray-400 mt-0.5">All systems normal</p>
                </div>
            </div>
        </DashboardLayout>
    );
}
