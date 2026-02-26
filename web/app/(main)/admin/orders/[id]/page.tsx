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

interface OrderItem {
    id: number;
    product_name: string;
    quantity: number;
    price: number;
    total: number;
    product?: { images?: string[]; slug?: string };
}

interface Order {
    id: number;
    order_number: string;
    total: number;
    subtotal: number;
    status: string;
    payment_method: string;
    payment_status?: string;
    created_at: string;
    items: OrderItem[];
    user?: { email: string; profile?: { first_name?: string; last_name?: string; phone?: string } };
    shipping_address?: {
        full_name?: string;
        phone?: string;
        street?: string;
        city?: string;
        region?: string;
        landmark?: string;
    };
}

export default function AdminOrderDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

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

    const userName = order?.user?.profile
        ? `${order.user.profile.first_name || ''} ${order.user.profile.last_name || ''}`.trim() || order.user.email
        : order?.user?.email ?? '—';

    if (loading) {
        return (
            <DashboardLayout isAdmin={true}>
                <div className="p-6 text-center">
                    <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-3" />
                    <p className="text-sm text-gray-500">Loading order...</p>
                </div>
            </DashboardLayout>
        );
    }

    if (!order) return null;

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
                                {order.payment_method?.replace(/_/g, ' ')}
                            </span>
                            <select
                                value={order.status}
                                onChange={(e) => handleStatusUpdate(e.target.value)}
                                disabled={updating}
                                className="text-xs font-semibold border border-gray-200 rounded-lg pl-3 pr-8 py-2 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            >
                                {ORDER_STATUSES.map((s) => (
                                    <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Main content */}
                    <div className="lg:col-span-2 space-y-6">
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
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                Qty {item.quantity} × ₵{Number(item.price).toFixed(2)}
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
                                {order.user?.profile?.phone && (
                                    <a href={`tel:${order.user.profile.phone}`} className="flex items-center gap-2 text-xs text-blue-600 hover:underline">
                                        <Phone className="h-3.5 w-3.5" /> {order.user.profile.phone}
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
        </DashboardLayout>
    );
}
