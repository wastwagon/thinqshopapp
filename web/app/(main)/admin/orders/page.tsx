'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminStatGrid from '@/components/admin/AdminStatGrid';
import AdminToolbar from '@/components/admin/AdminToolbar';
import AdminTable, {
    AdminTableBody,
    AdminTableEmpty,
    AdminTableHead,
    AdminTableLoading,
    AdminTd,
    AdminTh,
    AdminTr,
} from '@/components/admin/AdminTable';
import Select from '@/components/ui/Select';
import { StatusBadge } from '@/components/ui/Badge';
import { buttonVariants } from '@/components/ui/Button';
import Link from 'next/link';
import { Package, FileText, Clock, Truck, CheckCircle, XCircle, Eye } from 'lucide-react';
import { ADMIN_STAT_PROGRESS } from '@/lib/status-styles';

const ORDER_STATUSES = [
    'pending',
    'processing',
    'packed',
    'shipped',
    'out_for_delivery',
    'delivered',
    'cancelled',
];

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
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
        if (o?.user?.email) return o.user.email;
        if (o?.shipping_address?.full_name) return `${o.shipping_address.full_name} (Guest)`;
        if (o?.guest_email) return `${o.guest_email} (Guest)`;
        return 'Guest';
    };

    const filteredOrders = orders.filter(
        (o) =>
            (o.order_number ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            userName(o).toLowerCase().includes(searchTerm.toLowerCase()) ||
            (o.user?.email ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (o.guest_email ?? '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const pendingCount = orders.filter((o) => o.status === 'pending').length;
    const processingCount = orders.filter((o) =>
        ['processing', 'packed', 'shipped', 'out_for_delivery'].includes(o.status)
    ).length;
    const deliveredCount = orders.filter((o) => o.status === 'delivered').length;
    const cancelledCount = orders.filter((o) => o.status === 'cancelled').length;

    const stats = [
        {
            label: 'Total',
            value: orders.length,
            icon: FileText,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            border: 'border-blue-200',
        },
        {
            label: 'Pending',
            value: pendingCount,
            icon: Clock,
            color: 'text-orange-600',
            bg: 'bg-orange-50',
            border: 'border-orange-100',
        },
        { label: 'In progress', value: processingCount, icon: Truck, ...ADMIN_STAT_PROGRESS },
        {
            label: 'Delivered',
            value: deliveredCount,
            icon: CheckCircle,
            color: 'text-green-600',
            bg: 'bg-green-50',
            border: 'border-green-100',
        },
        {
            label: 'Cancelled',
            value: cancelledCount,
            icon: XCircle,
            color: 'text-red-600',
            bg: 'bg-red-50',
            border: 'border-red-100',
        },
    ];

    return (
        <DashboardLayout isAdmin={true}>
            <div className="pb-6 md:pb-8">
                <AdminPageHeader
                    icon={Package}
                    title="Orders"
                    subtitle="Customer orders"
                    actions={
                        <AdminToolbar
                            searchValue={searchTerm}
                            onSearchChange={setSearchTerm}
                            searchPlaceholder="Search orders…"
                            searchAriaLabel="Search orders"
                        >
                            <Select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                aria-label="Filter by status"
                                className="h-9 min-h-[36px] text-xs w-auto min-w-[9rem]"
                            >
                                <option value="">All statuses</option>
                                {ORDER_STATUSES.map((s) => (
                                    <option key={s} value={s}>
                                        {s.replace(/_/g, ' ')}
                                    </option>
                                ))}
                            </Select>
                        </AdminToolbar>
                    }
                />

                <AdminStatGrid items={stats} columns={5} />

                <AdminTable>
                    <AdminTableHead>
                        <AdminTh>Order</AdminTh>
                        <AdminTh>Customer</AdminTh>
                        <AdminTh>Items</AdminTh>
                        <AdminTh>Total</AdminTh>
                        <AdminTh>Status</AdminTh>
                        <AdminTh>Date</AdminTh>
                        <AdminTh align="right">Actions</AdminTh>
                    </AdminTableHead>
                    <AdminTableBody>
                        {loading ? (
                            <AdminTableLoading colSpan={7} />
                        ) : filteredOrders.length === 0 ? (
                            <AdminTableEmpty
                                colSpan={7}
                                icon={<Package className="h-10 w-10 mx-auto mb-2 text-gray-200" />}
                                message="No orders found"
                            />
                        ) : (
                            filteredOrders.map((o) => (
                                <AdminTr key={o.id}>
                                    <AdminTd>
                                        <Link
                                            href={`/admin/orders/${o.id}`}
                                            className="text-xs font-semibold text-brand hover:underline"
                                        >
                                            {o.order_number}
                                        </Link>
                                    </AdminTd>
                                    <AdminTd>
                                        <span className="text-xs text-gray-700 truncate block max-w-[120px]">
                                            {userName(o)}
                                        </span>
                                    </AdminTd>
                                    <AdminTd>
                                        <span className="text-xs text-gray-600">
                                            {o.items?.length ?? 0} items
                                        </span>
                                    </AdminTd>
                                    <AdminTd>
                                        <span className="text-xs font-semibold text-gray-900 tabular-nums">
                                            ₵{Number(o.total).toFixed(2)}
                                        </span>
                                    </AdminTd>
                                    <AdminTd>
                                        <StatusBadge status={o.status} />
                                    </AdminTd>
                                    <AdminTd className="text-xs text-gray-500">
                                        {o.created_at
                                            ? new Date(o.created_at).toLocaleDateString()
                                            : '—'}
                                    </AdminTd>
                                    <AdminTd className="text-right">
                                        <div className="flex items-center gap-2 justify-end">
                                            <Link
                                                href={`/admin/orders/${o.id}`}
                                                className={buttonVariants({
                                                    variant: 'secondary',
                                                    size: 'sm',
                                                    className: 'h-8 min-h-[32px] px-2 text-xs',
                                                })}
                                            >
                                                <Eye className="h-3 w-3" /> View
                                            </Link>
                                            <Select
                                                value={o.status}
                                                onChange={(e) =>
                                                    handleStatusUpdate(o.id, e.target.value)
                                                }
                                                disabled={updatingId === o.id}
                                                className="h-8 min-h-[32px] text-xs py-1 w-auto min-w-[7.5rem]"
                                                aria-label={`Update status for ${o.order_number}`}
                                            >
                                                {ORDER_STATUSES.map((s) => (
                                                    <option key={s} value={s}>
                                                        {s.replace(/_/g, ' ')}
                                                    </option>
                                                ))}
                                            </Select>
                                        </div>
                                    </AdminTd>
                                </AdminTr>
                            ))
                        )}
                    </AdminTableBody>
                </AdminTable>
            </div>
        </DashboardLayout>
    );
}
