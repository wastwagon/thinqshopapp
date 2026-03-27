'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import BarcodeScanner from '@/components/ui/BarcodeScanner';
import { Truck, Search, Package, User, Mail, Calendar, Clock, Zap, FileText, CheckCircle, ChevronRight, Camera, ExternalLink } from 'lucide-react';

interface Shipment {
    id: number;
    tracking_number: string;
    status: string;
    service_type: string;
    user: {
        email: string;
        profile?: { first_name?: string; last_name?: string };
    };
    created_at: string;
    origin_warehouse_id?: number;
    origin_warehouse?: { code: string; name: string };
    destination_warehouse_id?: number;
    destination_warehouse?: { code: string; name: string };
    carrier_tracking_number?: string;
}

export default function AdminLogisticsPage() {
    const router = useRouter();
    const [shipments, setShipments] = useState<Shipment[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [updatingId, setUpdatingId] = useState<number | null>(null);
    const [scannerOpen, setScannerOpen] = useState(false);

    useEffect(() => {
        fetchShipments();
    }, []);

    const fetchShipments = async () => {
        try {
            const { data } = await api.get('/logistics/admin/shipments');
            setShipments(Array.isArray(data) ? data : data?.data ?? []);
        } catch {
            toast.error('Failed to load shipments');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id: number, newStatus: string) => {
        if (!confirm(`Update status to ${newStatus.replace(/_/g, ' ')}?`)) return;
        setUpdatingId(id);
        try {
            await api.patch(`/logistics/admin/shipments/${id}/status`, { status: newStatus });
            toast.success('Status updated');
            fetchShipments();
        } catch {
            toast.error('Failed to update status');
        } finally {
            setUpdatingId(null);
        }
    };

    const handleSimulateWebhook = async (id: number) => {
        setUpdatingId(id);
        try {
            await api.post(`/logistics/admin/simulate-webhook/${id}`);
            toast.success('Status advanced');
            fetchShipments();
        } catch {
            toast.error('Simulation failed');
        } finally {
            setUpdatingId(null);
        }
    };

    const filteredShipments = shipments.filter(
        (s) =>
            (s.tracking_number ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (s.user?.email ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            [s.user?.profile?.first_name, s.user?.profile?.last_name].filter(Boolean).join(' ').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (s.carrier_tracking_number ?? '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const exactTrackingMatch = searchTerm.trim()
        ? shipments.find((s) => (s.tracking_number ?? '').toLowerCase() === searchTerm.trim().toLowerCase())
        : null;

    const goToShipmentDetail = () => {
        if (exactTrackingMatch) {
            router.push(`/admin/logistics/${exactTrackingMatch.id}`);
            return;
        }
        if (filteredShipments.length === 1) {
            router.push(`/admin/logistics/${filteredShipments[0].id}`);
            return;
        }
        if (filteredShipments.length === 0 && searchTerm.trim()) {
            toast.error('No shipment found for this tracking or customer');
        } else if (filteredShipments.length > 1) {
            toast('Multiple matches — refine search or click a row to view details', { icon: '🔍' });
        }
    };

    const bookedCount = shipments.filter((s) => s.status === 'booked').length;
    const inTransitCount = shipments.filter((s) => s.status === 'in_transit').length;
    const deliveredCount = shipments.filter((s) => s.status === 'delivered').length;

    const stats = [
        { label: 'Total', value: shipments.length, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
        { label: 'Booked', value: bookedCount, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
        { label: 'In transit', value: inTransitCount, icon: Truck, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
        { label: 'Delivered', value: deliveredCount, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
    ];

    const StatusBadge = ({ status }: { status: string }) => {
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
            <span className={`px-2 py-0.5 text-xs font-semibold rounded-lg border ${colors[status] || 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                {status.replace(/_/g, ' ')}
            </span>
        );
    };

    return (
        <DashboardLayout isAdmin={true}>
            <div className="pb-6 md:pb-8">
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                    <Truck className="h-7 w-7 text-blue-600" />
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Shipments</h1>
                        <p className="text-xs text-gray-500 mt-0.5">Freight and delivery</p>
                    </div>
                </div>
                <div className="flex gap-2 min-w-0 flex-1 sm:flex-initial sm:max-w-md">
                    <div className="relative flex-1 min-w-0">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search tracking or customer..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && goToShipmentDetail()}
                            className="w-full h-9 pl-9 pr-3 bg-white border border-gray-100 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={() => setScannerOpen(true)}
                        className="h-9 px-3 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-1.5 shrink-0"
                        title="Scan barcode to find shipment"
                        aria-label="Scan barcode"
                    >
                        <Camera className="h-4 w-4" />
                        <span className="hidden xs:inline text-xs font-medium">Scan</span>
                    </button>
                    <button
                        type="button"
                        onClick={goToShipmentDetail}
                        className="h-9 px-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center gap-1.5 shrink-0 text-sm font-medium"
                        title="Open shipment details"
                    >
                        <span className="hidden xs:inline">Go</span>
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {stats.map((s, i) => (
                    <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                        <div className={`w-9 h-9 rounded-lg ${s.bg} ${s.border} border flex items-center justify-center ${s.color} mb-2`}>
                            <s.icon className="h-4 w-4" />
                        </div>
                        <p className="text-xs font-semibold text-gray-500 mb-0.5">{s.label}</p>
                        <p className="text-xl font-bold text-gray-900">{s.value}</p>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-50">
                                <th className="px-3 py-2.5 text-xs font-semibold text-gray-500 min-w-0">Tracking</th>
                                <th className="px-3 py-2.5 text-xs font-semibold text-gray-500 min-w-0">Customer</th>
                                <th className="px-3 py-2.5 text-xs font-semibold text-gray-500 text-center min-w-0">Status</th>
                                <th className="px-3 py-2.5 text-xs font-semibold text-gray-500 text-right min-w-0">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="py-10 text-center">
                                        <div className="animate-spin h-7 w-7 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2" />
                                        <p className="text-sm text-gray-500">Loading...</p>
                                    </td>
                                </tr>
                            ) : filteredShipments.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-10 text-center text-gray-500">
                                        <Package className="h-10 w-10 mx-auto mb-2 text-gray-200" />
                                        <p className="text-sm">No shipments found</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredShipments.map((shipment) => (
                                    <tr key={shipment.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-3 py-2.5">
                                            <div className="flex flex-col gap-0.5">
                                                <Link
                                                    href={`/admin/logistics/${shipment.id}`}
                                                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                                                >
                                                    {shipment.tracking_number || '—'}
                                                </Link>
                                                <span className="text-xs text-gray-500">{shipment.service_type || 'Standard'}</span>
                                                {shipment.origin_warehouse && (
                                                    <div className="flex items-center gap-1 mt-1 flex-wrap">
                                                        <span className="text-xs font-semibold py-0.5 px-1.5 bg-blue-50 text-blue-700 rounded border border-blue-100">{shipment.origin_warehouse.code}</span>
                                                        {shipment.destination_warehouse && (
                                                            <>
                                                                <span className="text-gray-300">→</span>
                                                                <span className="text-xs font-semibold py-0.5 px-1.5 bg-green-50 text-green-700 rounded border border-green-100">{shipment.destination_warehouse.code}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                                {shipment.carrier_tracking_number && (
                                                    <span className="text-xs text-gray-500">Carrier: {shipment.carrier_tracking_number}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <div className="w-7 h-7 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100 shrink-0">
                                                    <User className="h-3.5 w-3.5 text-gray-400" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-medium text-gray-900 truncate">
                                                        {[shipment.user?.profile?.first_name, shipment.user?.profile?.last_name].filter(Boolean).join(' ') || '—'}
                                                    </p>
                                                    <p className="text-xs text-gray-500 truncate flex items-center gap-1">
                                                        <Mail className="h-2.5 w-2.5 shrink-0" />{shipment.user?.email}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3 py-2.5 text-center">
                                            <StatusBadge status={shipment.status} />
                                            <p className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1">
                                                <Calendar className="h-2.5 w-2.5" />{new Date(shipment.created_at).toLocaleDateString()}
                                            </p>
                                        </td>
                                        <td className="px-3 py-2.5 text-right">
                                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                                <Link
                                                    href={`/admin/logistics/${shipment.id}`}
                                                    className="min-w-[44px] min-h-[44px] w-10 h-10 rounded-lg border border-gray-200 bg-white text-gray-700 flex items-center justify-center hover:bg-gray-50 hover:border-gray-300 transition-all shrink-0"
                                                    title="View details"
                                                    aria-label="View shipment details"
                                                >
                                                    <ExternalLink className="h-4 w-4" />
                                                </Link>
                                                <button
                                                    type="button"
                                                    onClick={() => handleSimulateWebhook(shipment.id)}
                                                    disabled={updatingId === shipment.id || shipment.status === 'delivered'}
                                                    title="Advance status"
                                                    className="min-w-[44px] min-h-[44px] w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all disabled:opacity-50 shrink-0"
                                                    aria-label="Advance status"
                                                >
                                                    <Zap className="h-4 w-4" />
                                                </button>
                                                <div className="relative inline-block">
                                                    <select
                                                        disabled={updatingId === shipment.id}
                                                        className="appearance-none bg-gray-50 border border-gray-100 text-gray-700 text-xs font-semibold rounded-lg min-h-[44px] py-2 pl-2.5 pr-7 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                                                        value={shipment.status}
                                                        onChange={(e) => handleStatusUpdate(shipment.id, e.target.value)}
                                                    >
                                                        <option value="booked">Booked</option>
                                                        <option value="pickup_scheduled">Pickup scheduled</option>
                                                        <option value="picked_up">Picked up</option>
                                                        <option value="in_transit">In transit</option>
                                                        <option value="out_for_delivery">Out for delivery</option>
                                                        <option value="delivered">Delivered</option>
                                                        <option value="cancelled">Cancelled</option>
                                                    </select>
                                                    <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none rotate-90" aria-hidden />
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
            </div>

            <BarcodeScanner
                open={scannerOpen}
                onClose={() => setScannerOpen(false)}
                onScan={(value) => {
                    setSearchTerm(value);
                    setScannerOpen(false);
                    const match = shipments.find((s) => (s.tracking_number ?? '').toLowerCase() === value.toLowerCase());
                    if (match) {
                        router.push(`/admin/logistics/${match.id}`);
                    } else {
                        toast('Scan saved to search — click Go if one result, or refine', { icon: '✓' });
                    }
                }}
            />
        </DashboardLayout>
    );
}
