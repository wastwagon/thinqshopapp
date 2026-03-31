'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/axios';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
    ArrowLeft,
    Package,
    User,
    MapPin,
    Mail,
    Phone,
} from 'lucide-react';
import toast from 'react-hot-toast';

const ORDER_STATUSES = ['pending', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];

const formatCmsLabel = (value?: string | null): string =>
    (value || '')
        .replace(/_/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/\b\w/g, (c) => c.toUpperCase()) || '—';

interface OrderItem {
    id: number;
    product_name: string;
    quantity: number;
    price: number;
    total: number;
    variant_details?: string | null;
    variant?: { variant_type: string; variant_value: string } | null;
    product?: { images?: string[]; slug?: string };
}

interface Order {
    id: number;
    order_number: string;
    total: number;
    subtotal: number;
    shipping_fee?: number;
    tax?: number;
    discount?: number;
    status: string;
    payment_method: string;
    payment_status?: string;
    created_at: string;
    items: OrderItem[];
    user?: { email: string; phone?: string | null; profile?: { first_name?: string; last_name?: string } };
    shipping_address?: {
        full_name?: string;
        phone?: string;
        street?: string;
        city?: string;
        region?: string;
        landmark?: string;
    };
    tracking?: Array<{ id: number; status: string; notes?: string | null; created_at: string }>;
}

export default function AdminOrderDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [resolvingReturn, setResolvingReturn] = useState(false);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const { data } = await api.get(`/orders/admin/${id}`);
                setOrder(data);
            } catch (err: any) {
                toast.error(err.response?.data?.message || 'Failed to load order');
                router.push('/admin/orders');
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchOrder();
    }, [id, router]);

    const handleStatusUpdate = async (newStatus: string) => {
        if (!order) return;
        setUpdating(true);
        try {
            await api.patch(`/orders/admin/${order.id}/status`, { status: newStatus });
            toast.success('Status updated');
            setOrder((o) => (o ? { ...o, status: newStatus } : null));
        } catch {
            toast.error('Failed to update status');
        } finally {
            setUpdating(false);
        }
    };

    const resolveReturn = async (action: 'approve' | 'reject' | 'refund') => {
        if (!order) return;
        const notes = window.prompt('Optional admin note');
        setResolvingReturn(true);
        try {
            const { data } = await api.patch(`/orders/admin/${order.id}/return`, {
                action,
                notes: notes?.trim() || undefined,
            });
            setOrder(data);
            const labels: Record<'approve' | 'reject' | 'refund', string> = {
                approve: 'approved',
                reject: 'rejected',
                refund: 'refunded',
            };
            toast.success(`Return ${labels[action]}`);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to resolve return request');
        } finally {
            setResolvingReturn(false);
        }
    };

    const userName = order?.user?.profile
        ? `${order.user.profile.first_name || ''} ${order.user.profile.last_name || ''}`.trim() || order.user.email
        : order?.user?.email ?? '—';

    if (loading) {
        return (
            <DashboardLayout isAdmin={true}>
                <div className="p-6 pb-6 md:pb-8 text-center">
                    <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-3" />
                    <p className="text-sm text-gray-500">Loading order...</p>
                </div>
            </DashboardLayout>
        );
    }

    if (!order) return null;

    const hasReturnRequested = (order.tracking || []).some((e) => e.status === 'return_requested');
    const hasReturnResolved = (order.tracking || []).some((e) => ['return_approved', 'return_rejected', 'refunded'].includes(e.status));

    const address = order.shipping_address;
    const addressLines = [
        address?.full_name && `Attn: ${address.full_name}`,
        address?.phone && `Tel: ${address.phone}`,
        address?.street,
        [address?.city, address?.region].filter(Boolean).join(', '),
        address?.landmark,
    ].filter(Boolean);

    return (
        <DashboardLayout isAdmin={true}>
            <div className="pb-6 md:pb-8">
            <div className="mb-6 flex items-center justify-between gap-3">
                <Link
                    href="/admin/orders"
                    className="text-blue-600 hover:text-gray-900 flex items-center text-sm font-medium transition-colors"
                >
                    <ArrowLeft className="h-4 w-4 mr-1.5" /> Orders
                </Link>
            </div>

            <div className="space-y-6">
                {/* Header card */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-4 py-4 sm:px-6 border-b border-gray-50 flex flex-wrap justify-between items-start gap-4 bg-gray-50/50">
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">#{order.order_number}</h1>
                            <p className="text-xs text-gray-500 mt-0.5">
                                {new Date(order.created_at).toLocaleString()}
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 capitalize">
                                {formatCmsLabel(order.payment_method)}
                            </span>
                            <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 capitalize">
                                Payment: {formatCmsLabel(order.payment_status)}
                            </span>
                            <select
                                value={order.status}
                                onChange={(e) => handleStatusUpdate(e.target.value)}
                                disabled={updating}
                                className="text-xs font-semibold border border-gray-200 rounded-lg pl-3 pr-8 py-2 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            >
                                {ORDER_STATUSES.map((s) => (
                                    <option key={s} value={s}>{formatCmsLabel(s)}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                    {hasReturnRequested && !hasReturnResolved && (
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <p className="text-sm font-semibold text-amber-900">Return request pending review</p>
                                <p className="text-xs text-amber-700">Resolve this customer return request.</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    disabled={resolvingReturn}
                                    onClick={() => resolveReturn('approve')}
                                    className="min-h-[44px] px-3 py-2 rounded-lg text-xs font-semibold bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
                                >
                                    Approve
                                </button>
                                <button
                                    type="button"
                                    disabled={resolvingReturn}
                                    onClick={() => resolveReturn('reject')}
                                    className="min-h-[44px] px-3 py-2 rounded-lg text-xs font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
                                >
                                    Reject
                                </button>
                                <button
                                    type="button"
                                    disabled={resolvingReturn}
                                    onClick={() => resolveReturn('refund')}
                                    className="min-h-[44px] px-3 py-2 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                                >
                                    Refund
                                </button>
                            </div>
                        </div>
                    )}

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Main content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Timeline */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/50">
                                <h3 className="text-sm font-semibold text-gray-900">Order timeline</h3>
                            </div>
                            <div className="px-4 py-4 space-y-3">
                                {(order.tracking || []).length === 0 ? (
                                    <p className="text-xs text-gray-500">No tracking events yet.</p>
                                ) : (
                                    (order.tracking || []).map((event) => (
                                        <div key={event.id} className="p-3 rounded-xl border border-gray-100 bg-gray-50/60">
                                            <div className="flex items-center justify-between gap-3">
                                                <p className="text-xs font-semibold text-gray-900 tracking-wide">{formatCmsLabel(event.status)}</p>
                                                <p className="text-xs text-gray-500">{new Date(event.created_at).toLocaleString()}</p>
                                            </div>
                                            {event.notes && <p className="text-xs text-gray-600 mt-1">{event.notes}</p>}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Items */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/50">
                                <h3 className="text-sm font-semibold text-gray-900">Order items</h3>
                            </div>
                            <ul className="divide-y divide-gray-50">
                                {order.items.map((item) => (
                                    <li key={item.id} className="px-4 py-4 flex gap-4">
                                        <div className="h-14 w-14 flex-shrink-0 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-center overflow-hidden">
                                            {item.product?.images?.[0] ? (
                                                <img
                                                    src={item.product.images[0]}
                                                    alt=""
                                                    className="w-full h-full object-contain"
                                                />
                                            ) : (
                                                <Package className="h-6 w-6 text-gray-400" />
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h4 className="text-sm font-semibold text-gray-900">{item.product_name}</h4>
                                            {(item.variant_details || item.variant) && (
                                                <p className="text-xs text-gray-600 mt-0.5">
                                                    {item.variant_details ?? `${item.variant!.variant_type}: ${item.variant!.variant_value}`.replace(/_/g, ' ')}
                                                </p>
                                            )}
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                Quantity {item.quantity} × ₵{Number(item.price).toFixed(2)}
                                            </p>
                                        </div>
                                        <p className="text-sm font-semibold text-gray-900 shrink-0">
                                            ₵{Number(item.total).toFixed(2)}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                            <div className="px-4 py-4 border-t border-gray-100 bg-gray-50/80">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Subtotal</span>
                                    <span className="font-medium text-gray-900">₵{Number(order.subtotal || order.total).toFixed(2)}</span>
                                </div>
                            <div className="flex justify-between text-sm mt-2">
                                <span className="text-gray-600">Shipping</span>
                                <span className="font-medium text-gray-900">₵{Number(order.shipping_fee || 0).toFixed(2)}</span>
                            </div>
                                <div className="flex justify-between text-sm mt-2 pt-2 border-t border-gray-100">
                                    <span className="font-semibold text-gray-900">Total</span>
                                    <span className="font-bold text-gray-900">₵{Number(order.total).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Customer */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/50">
                                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                    <User className="h-4 w-4" /> Customer
                                </h3>
                            </div>
                            <div className="px-4 py-4 space-y-2">
                                <p className="text-sm font-medium text-gray-900">{userName}</p>
                                {order.user?.email && (
                                    <a href={`mailto:${order.user.email}`} className="flex items-center gap-2 text-xs text-blue-600 hover:underline">
                                        <Mail className="h-3.5 w-3.5" /> {order.user.email}
                                    </a>
                                )}
                                {order.user?.phone && (
                                    <a href={`tel:${order.user.phone}`} className="flex items-center gap-2 text-xs text-blue-600 hover:underline">
                                        <Phone className="h-3.5 w-3.5" /> {order.user.phone}
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* Shipping address */}
                        {addressLines.length > 0 && (
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/50">
                                    <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                        <MapPin className="h-4 w-4" /> Shipping address
                                    </h3>
                                </div>
                                <div className="px-4 py-4">
                                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{addressLines.join('\n')}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            </div>
        </DashboardLayout>
    );
}
