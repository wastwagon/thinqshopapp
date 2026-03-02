'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/axios';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Link from 'next/link';
import { ArrowLeft, Package, Truck, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

interface Shipment {
    id: number;
    tracking_number: string;
    status: string;
    total_price: number;
    weight: number;
    carrier_tracking_number?: string;
    shipping_method?: string;
    is_cod: boolean;
    items_declaration?: Array<{ description?: string; value?: string; quantity?: number }>;
    created_at: string;
    origin_warehouse?: { name: string; address: string; code: string };
    destination_warehouse?: { name: string; address: string; code: string };
    tracking?: Array<{ status: string; notes?: string; created_at: string }>;
}

export default function ShipmentDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;
    const [shipment, setShipment] = useState<Shipment | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        (async () => {
            try {
                const { data } = await api.get(`/logistics/shipments/${id}`);
                setShipment(data);
            } catch {
                toast.error('Shipment not found');
                router.replace('/dashboard/logistics');
            } finally {
                setLoading(false);
            }
        })();
    }, [id, router]);

    if (loading || !shipment) {
        return (
            <DashboardLayout>
                <div className="pb-20 md:pb-10 flex items-center justify-center min-h-[40vh]">
                    <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full" />
                </div>
            </DashboardLayout>
        );
    }

    const items = (shipment.items_declaration || []) as Array<{ description?: string; value?: string; quantity?: number }>;
    const trackingList = shipment.tracking || [];

    return (
        <DashboardLayout>
            <div className="pb-20 md:pb-10">
                <Link
                    href="/dashboard/logistics"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-blue-600 mb-6"
                >
                    <ArrowLeft className="h-4 w-4" /> Back to shipments
                </Link>

                <div className="max-w-2xl space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
                            <div className="flex flex-wrap justify-between items-start gap-4">
                                <div>
                                    <h1 className="text-xl font-bold text-gray-900">{shipment.tracking_number}</h1>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {new Date(shipment.created_at).toLocaleDateString(undefined, { dateStyle: 'full' })}
                                    </p>
                                </div>
                                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                                    shipment.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                    shipment.status === 'cancelled' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-600'
                                }`}>
                                    {shipment.status?.replace(/_/g, ' ')}
                                </span>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Weight</p>
                                    <p className="text-sm font-semibold text-gray-900">{shipment.weight} kg</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total</p>
                                    <p className="text-lg font-bold text-gray-900">₵{Number(shipment.total_price || 0).toFixed(2)}</p>
                                </div>
                                {shipment.carrier_tracking_number && (
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Carrier tracking</p>
                                        <p className="text-sm font-mono text-gray-900">{shipment.carrier_tracking_number}</p>
                                    </div>
                                )}
                                {shipment.shipping_method && (
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Method</p>
                                        <p className="text-sm font-semibold text-gray-900">{shipment.shipping_method.replace('_', ' ')}</p>
                                    </div>
                                )}
                                {shipment.is_cod && (
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Payment</p>
                                        <p className="text-sm font-semibold text-gray-900">Cash on Delivery</p>
                                    </div>
                                )}
                            </div>

                            {shipment.origin_warehouse && (
                                <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                        <MapPin className="h-3.5 w-3.5" /> Origin
                                    </p>
                                    <p className="text-sm font-bold text-gray-900">{shipment.origin_warehouse.name}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">{shipment.origin_warehouse.address}</p>
                                    <p className="text-xs font-mono text-gray-400 mt-1">{shipment.origin_warehouse.code}</p>
                                </div>
                            )}

                            {shipment.destination_warehouse && (
                                <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                        <MapPin className="h-3.5 w-3.5" /> Destination
                                    </p>
                                    <p className="text-sm font-bold text-gray-900">{shipment.destination_warehouse.name}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">{shipment.destination_warehouse.address}</p>
                                    <p className="text-xs font-mono text-gray-400 mt-1">{shipment.destination_warehouse.code}</p>
                                </div>
                            )}

                            {items.length > 0 && (
                                <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Items declared</p>
                                    <div className="space-y-2">
                                        {items.map((item, i) => (
                                            <div key={i} className="flex justify-between items-center text-sm">
                                                <span className="font-medium text-gray-900">{item.description || '—'}</span>
                                                <span className="text-gray-500">Qty {item.quantity ?? 1} {item.value ? `· ¥${item.value}` : ''}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {trackingList.length > 0 && (
                                <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <Truck className="h-3.5 w-3.5" /> Tracking
                                    </p>
                                    <ul className="space-y-3">
                                        {trackingList.map((t, i) => (
                                            <li key={i} className="flex gap-3">
                                                <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-900">{t.status?.replace(/_/g, ' ')}</p>
                                                    {t.notes && <p className="text-xs text-gray-500 mt-0.5">{t.notes}</p>}
                                                    <p className="text-xs text-gray-400 mt-1">{new Date(t.created_at).toLocaleString()}</p>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
