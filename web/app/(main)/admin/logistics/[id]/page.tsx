'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/axios';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
    ArrowLeft,
    Truck,
    User,
    MapPin,
    Mail,
    Phone,
    Package,
    Calendar,
    Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';

const SHIPMENT_STATUSES = ['booked', 'pickup_scheduled', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'cancelled'];

interface ShipmentTracking {
    id: number;
    status: string;
    location: string | null;
    notes: string | null;
    created_at: string;
}

interface Address {
    id: number;
    full_name?: string | null;
    phone?: string | null;
    street?: string | null;
    city?: string | null;
    region?: string | null;
    landmark?: string | null;
}

interface Shipment {
    id: number;
    tracking_number: string;
    status: string;
    service_type: string;
    payment_method: string;
    payment_status: string;
    base_price: string;
    weight_price: string;
    total_price: string;
    weight: string;
    carrier_tracking_number?: string | null;
    origin_warehouse?: { code: string; name: string } | null;
    destination_warehouse?: { code: string; name: string } | null;
    created_at: string;
    estimated_delivery?: string | null;
    user?: {
        email: string;
        phone?: string | null;
        profile?: { first_name?: string; last_name?: string };
    };
    tracking?: ShipmentTracking[];
    pickup_address?: Address | null;
    delivery_address?: Address | null;
    items_declaration?: Array<{ description?: string; quantity?: number; value?: string }> | null;
    declaration_image_urls?: string[] | null;
}

const formatCmsLabel = (value?: string | null): string =>
    (value || '')
        .replace(/_/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/\b\w/g, (c) => c.toUpperCase()) || '—';

function formatAddress(addr: Address | null | undefined): string {
    if (!addr) return '—';
    const parts = [
        addr.full_name,
        addr.phone && `Tel: ${addr.phone}`,
        addr.street,
        [addr.city, addr.region].filter(Boolean).join(', '),
        addr.landmark,
    ].filter(Boolean);
    return parts.length ? parts.join('\n') : '—';
}

function StatusBadge({ status }: { status: string }) {
    const colors: Record<string, string> = {
        booked: 'bg-orange-50 text-orange-700 border-orange-200',
        pickup_scheduled: 'bg-blue-50 text-blue-700 border-blue-200',
        picked_up: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        in_transit: 'bg-purple-50 text-purple-700 border-purple-200',
        out_for_delivery: 'bg-orange-50 text-orange-700 border-orange-200',
        delivered: 'bg-green-50 text-green-700 border-green-200',
        cancelled: 'bg-red-50 text-red-700 border-red-200',
    };
    return (
        <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg border ${colors[status] || 'bg-gray-50 text-gray-700 border-gray-200'}`}>
            {formatCmsLabel(status)}
        </span>
    );
}

export default function AdminShipmentDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;
    const [shipment, setShipment] = useState<Shipment | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        const fetchShipment = async () => {
            try {
                const { data } = await api.get(`/logistics/admin/shipments/${id}`);
                setShipment(data);
            } catch (err: any) {
                toast.error(err.response?.data?.message || 'Failed to load shipment');
                router.push('/admin/logistics');
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchShipment();
    }, [id, router]);

    const handleStatusUpdate = async (newStatus: string) => {
        if (!shipment) return;
        if (!confirm(`Update status to ${formatCmsLabel(newStatus)}?`)) return;
        setUpdating(true);
        try {
            await api.patch(`/logistics/admin/shipments/${shipment.id}/status`, { status: newStatus });
            toast.success('Status updated');
            setShipment((s) => (s ? { ...s, status: newStatus } : null));
        } catch {
            toast.error('Failed to update status');
        } finally {
            setUpdating(false);
        }
    };

    const userName = shipment?.user?.profile
        ? `${shipment.user.profile.first_name || ''} ${shipment.user.profile.last_name || ''}`.trim() || shipment.user.email
        : shipment?.user?.email ?? '—';

    if (loading) {
        return (
            <DashboardLayout isAdmin={true}>
                <div className="p-6 pb-6 md:pb-8 text-center">
                    <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-3" />
                    <p className="text-sm text-gray-500">Loading shipment...</p>
                </div>
            </DashboardLayout>
        );
    }

    if (!shipment) return null;

    return (
        <DashboardLayout isAdmin={true}>
            <div className="pb-6 md:pb-8">
                <div className="mb-6 flex items-center justify-between gap-3">
                    <Link
                        href="/admin/logistics"
                        className="text-blue-600 hover:text-gray-900 flex items-center text-sm font-medium transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4 mr-1.5" /> Shipments
                    </Link>
                </div>

                <div className="space-y-6">
                    {/* Header */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-4 py-4 sm:px-6 border-b border-gray-50 flex flex-wrap justify-between items-start gap-4 bg-gray-50/50">
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">{shipment.tracking_number}</h1>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {new Date(shipment.created_at).toLocaleString()} · {formatCmsLabel(shipment.service_type)}
                                </p>
                                {shipment.carrier_tracking_number && (
                                    <p className="text-xs text-gray-600 mt-1">Carrier: {shipment.carrier_tracking_number}</p>
                                )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <StatusBadge status={shipment.status} />
                                <select
                                    value={shipment.status}
                                    onChange={(e) => handleStatusUpdate(e.target.value)}
                                    disabled={updating}
                                    className="text-xs font-semibold border border-gray-200 rounded-lg pl-3 pr-8 py-2 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                >
                                    {SHIPMENT_STATUSES.map((s) => (
                                        <option key={s} value={s}>{formatCmsLabel(s)}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            {/* Tracking timeline */}
                            {shipment.tracking && shipment.tracking.length > 0 && (
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                    <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/50">
                                        <h3 className="text-sm font-semibold text-gray-900">Tracking history</h3>
                                    </div>
                                    <ul className="divide-y divide-gray-50">
                                        {shipment.tracking.map((t, i) => (
                                            <li key={t.id} className="px-4 py-3 flex gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                                                    <Package className="h-4 w-4 text-blue-600" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-medium text-gray-900">{formatCmsLabel(t.status)}</p>
                                                    {t.location && <p className="text-xs text-gray-500">{t.location}</p>}
                                                    {t.notes && <p className="text-xs text-gray-600 mt-0.5">{t.notes}</p>}
                                                    <p className="text-xs text-gray-400 mt-1">{new Date(t.created_at).toLocaleString()}</p>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Items declaration + images */}
                            {((shipment.items_declaration && (shipment.items_declaration as any[]).length > 0) || (shipment.declaration_image_urls && (shipment.declaration_image_urls as string[]).length > 0)) && (
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                    <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/50">
                                        <h3 className="text-sm font-semibold text-gray-900">Items declaration</h3>
                                    </div>
                                    <div className="px-4 py-4 space-y-4">
                                        {shipment.items_declaration && (shipment.items_declaration as any[]).length > 0 && (
                                            <div>
                                                <p className="text-xs font-medium text-gray-500 mb-2">Declared items</p>
                                                <ul className="space-y-1 text-sm text-gray-800">
                                                    {(shipment.items_declaration as any[]).map((item: any, i: number) => (
                                                        <li key={i}>{item.description || '—'} × {Number(item.quantity) || 1}{item.value ? ` (Value: ${item.value})` : ''}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        {shipment.declaration_image_urls && (shipment.declaration_image_urls as string[]).length > 0 && (
                                            <div>
                                                <p className="text-xs font-medium text-gray-500 mb-2">Package / item images</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {(shipment.declaration_image_urls as string[]).map((url, i) => {
                                                        const fullUrl = url.startsWith('http') ? url : `${process.env.NEXT_PUBLIC_API_URL || ''}${url}`;
                                                        return (
                                                            <a key={i} href={fullUrl} target="_blank" rel="noopener noreferrer" className="block">
                                                                <img src={fullUrl} alt="" className="w-24 h-24 object-cover rounded-lg border border-gray-200 hover:border-blue-400" />
                                                            </a>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Warehouses */}
                            {(shipment.origin_warehouse || shipment.destination_warehouse) && (
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                    <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/50">
                                        <h3 className="text-sm font-semibold text-gray-900">Route</h3>
                                    </div>
                                    <div className="px-4 py-4 flex items-center gap-3 flex-wrap">
                                        {shipment.origin_warehouse && (
                                            <span className="px-2.5 py-1.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-100 text-sm font-medium">
                                                {shipment.origin_warehouse.code} → {shipment.origin_warehouse.name}
                                            </span>
                                        )}
                                        {shipment.origin_warehouse && shipment.destination_warehouse && (
                                            <span className="text-gray-400">→</span>
                                        )}
                                        {shipment.destination_warehouse && (
                                            <span className="px-2.5 py-1.5 bg-green-50 text-green-700 rounded-lg border border-green-100 text-sm font-medium">
                                                {shipment.destination_warehouse.code} → {shipment.destination_warehouse.name}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

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
                                    {shipment.user?.email && (
                                        <a href={`mailto:${shipment.user.email}`} className="flex items-center gap-2 text-xs text-blue-600 hover:underline">
                                            <Mail className="h-3.5 w-3.5" /> {shipment.user.email}
                                        </a>
                                    )}
                                    {shipment.user?.phone && (
                                        <a href={`tel:${shipment.user.phone}`} className="flex items-center gap-2 text-xs text-blue-600 hover:underline">
                                            <Phone className="h-3.5 w-3.5" /> {shipment.user.phone}
                                        </a>
                                    )}
                                </div>
                            </div>

                            {/* Delivery address */}
                            {shipment.delivery_address && (
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                    <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/50">
                                        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                            <MapPin className="h-4 w-4" /> Delivery address
                                        </h3>
                                    </div>
                                    <div className="px-4 py-4">
                                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{formatAddress(shipment.delivery_address)}</p>
                                    </div>
                                </div>
                            )}

                            {/* Pricing */}
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/50">
                                    <h3 className="text-sm font-semibold text-gray-900">Summary</h3>
                                </div>
                                <div className="px-4 py-4 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Weight</span>
                                        <span className="font-medium text-gray-900">{shipment.weight} kg</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Payment method</span>
                                        <span className="font-medium text-gray-900">{formatCmsLabel(shipment.payment_method)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Payment status</span>
                                        <span className="font-medium text-gray-900">{formatCmsLabel(shipment.payment_status)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Total</span>
                                        <span className="font-bold text-gray-900">₵{Number(shipment.total_price).toFixed(2)}</span>
                                    </div>
                                    {shipment.estimated_delivery && (
                                        <div className="flex justify-between text-sm pt-2 border-t border-gray-100">
                                            <span className="text-gray-600 flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Est. delivery</span>
                                            <span className="text-gray-900">{new Date(shipment.estimated_delivery).toLocaleDateString()}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
