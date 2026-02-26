'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Link from 'next/link';
import { Package, Search, ChevronRight, FileText, Clock, Truck, CheckCircle, XCircle, Eye } from 'lucide-react';

const ORDER_STATUSES = ['pending', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');
    const [updatingId, setUpdatingId] = useState<number | null>(null);

    useEffect(() => {
        fetchOrders();
    }, [statusFilter]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const params = statusFilter ? { status: statusFilter } : {};
            const { data } = await api.get('/orders/admin/list', { params });
            setOrders(Array.isArray(data) ? data : data?.data ?? []);
        } catch {
            toast.error('Failed to load orders');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id: number, newStatus: string) => {
        setUpdatingId(id);
        try {
            await api.patch(`/orders/admin/${id}/status`, { status: newStatus });
            toast.success('Status updated');
            fetchOrders();
        } catch {
            toast.error('Failed to update status');
        } finally {
            setUpdatingId(null);
        }
    };

    const userName = (o: any) => {
        const p = o?.user?.profile;
        if (p?.first_name || p?.last_name) return `${p.first_name || ''} ${p.last_name || ''}`.trim();
        return o?.user?.email ?? '—';
    };

    const filteredOrders = orders.filter(
        (o) =>
            (o.order_number ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            userName(o).toLowerCase().includes(searchTerm.toLowerCase()) ||
            (o.user?.email ?? '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const pendingCount = orders.filter((o) => o.status === 'pending').length;
    const processingCount = orders.filter((o) => ['processing', 'packed', 'shipped', 'out_for_delivery'].includes(o.status)).length;
    const deliveredCount = orders.filter((o) => o.status === 'delivered').length;
    const cancelledCount = orders.filter((o) => o.status === 'cancelled').length;

    const stats = [
        { label: 'Total', value: orders.length, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
        { label: 'Pending', value: pendingCount, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
        { label: 'In progress', value: processingCount, icon: Truck, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
        { label: 'Delivered', value: deliveredCount, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
        { label: 'Cancelled', value: cancelledCount, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
    ];

    const StatusBadge = ({ status }: { status: string }) => {
        const colors: Record<string, string> = {
            pending: 'bg-amber-50 text-amber-700 border-amber-200',
            processing: 'bg-blue-50 text-blue-700 border-blue-200',
            packed: 'bg-indigo-50 text-indigo-700 border-indigo-200',
            shipped: 'bg-purple-50 text-purple-700 border-purple-200',
            out_for_delivery: 'bg-orange-50 text-orange-700 border-orange-200',
            delivered: 'bg-green-50 text-green-700 border-green-200',
            cancelled: 'bg-red-50 text-red-700 border-red-200',
        };
        return (
            <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-lg border ${colors[status] || 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                {status?.replace(/_/g, ' ')}
            </span>
        );
    };

    return (
        <DashboardLayout isAdmin={true}>
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                    <Package className="h-7 w-7 text-blue-600" />
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Orders</h1>
                        <p className="text-xs text-gray-500 mt-0.5">Customer orders</p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative min-w-0 sm:w-44">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search orders..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-9 pl-8 pr-2.5 border border-gray-100 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                    </div>
                    <div className="relative">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="h-9 pl-3 pr-8 border border-gray-100 rounded-lg text-sm font-medium text-gray-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none bg-white"
                        >
                            <option value="">All statuses</option>
                            {ORDER_STATUSES.map((s) => (
                                <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                            ))}
                        </select>
                        <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none rotate-90" aria-hidden />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
                {stats.map((s, i) => (
                    <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                        <div className={`w-9 h-9 rounded-lg ${s.bg} ${s.border} border flex items-center justify-center ${s.color} mb-2`}>
                            <s.icon className="h-4 w-4" />
                        </div>
                        <p className="text-[10px] font-semibold text-gray-500 mb-0.5">{s.label}</p>
                        <p className="text-xl font-bold text-gray-900">{s.value}</p>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-50">
                                <th className="px-3 py-2.5 text-[10px] font-semibold text-gray-500">Order</th>
                                <th className="px-3 py-2.5 text-[10px] font-semibold text-gray-500">Customer</th>
                                <th className="px-3 py-2.5 text-[10px] font-semibold text-gray-500">Items</th>
                                <th className="px-3 py-2.5 text-[10px] font-semibold text-gray-500">Total</th>
                                <th className="px-3 py-2.5 text-[10px] font-semibold text-gray-500">Status</th>
                                <th className="px-3 py-2.5 text-[10px] font-semibold text-gray-500">Date</th>
                                <th className="px-3 py-2.5 text-[10px] font-semibold text-gray-500 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="py-10 text-center">
                                        <div className="animate-spin h-7 w-7 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2" />
                                        <p className="text-sm text-gray-500">Loading...</p>
                                    </td>
                                </tr>
                            ) : filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-10 text-center text-gray-500">
                                        <Package className="h-10 w-10 mx-auto mb-2 text-gray-200" />
                                        <p className="text-sm">No orders found</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map((o) => (
                                    <tr key={o.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-3 py-2.5">
                                            <Link
                                                href={`/admin/orders/${o.id}`}
                                                className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                                            >
                                                {o.order_number}
                                            </Link>
                                        </td>
                                        <td className="px-3 py-2.5"><span className="text-xs text-gray-700 truncate block max-w-[120px]">{userName(o)}</span></td>
                                        <td className="px-3 py-2.5"><span className="text-xs text-gray-600">{o.items?.length ?? 0} items</span></td>
                                        <td className="px-3 py-2.5"><span className="text-xs font-semibold text-gray-900">₵{Number(o.total).toFixed(2)}</span></td>
                                        <td className="px-3 py-2.5"><StatusBadge status={o.status} /></td>
                                        <td className="px-3 py-2.5 text-[10px] text-gray-500">{o.created_at ? new Date(o.created_at).toLocaleDateString() : '—'}</td>
                                        <td className="px-3 py-2.5 text-right">
                                            <div className="flex items-center gap-2 justify-end">
                                                <Link
                                                    href={`/admin/orders/${o.id}`}
                                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold text-blue-600 hover:bg-blue-50 border border-blue-100"
                                                >
                                                    <Eye className="h-3 w-3" /> View
                                                </Link>
                                                <div className="relative inline-block">
                                                    <select
                                                        value={o.status}
                                                        onChange={(e) => handleStatusUpdate(o.id, e.target.value)}
                                                        disabled={updatingId === o.id}
                                                        className="text-[10px] font-semibold border border-gray-100 rounded-lg pl-2 pr-6 py-1.5 bg-gray-50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none cursor-pointer"
                                                    >
                                                        {ORDER_STATUSES.map((s) => (
                                                            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                                                        ))}
                                                    </select>
                                                    <ChevronRight className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none rotate-90" aria-hidden />
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </DashboardLayout>
    );
}
