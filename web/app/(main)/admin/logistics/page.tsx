'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import { StatusBadge } from '@/components/ui/Badge';
import BarcodeScanner from '@/components/ui/BarcodeScanner';
import { Truck, Package, User, Mail, Calendar, Clock, Zap, FileText, CheckCircle, ChevronRight, Camera, ExternalLink } from 'lucide-react';
import { ADMIN_STAT_PROGRESS } from '@/lib/status-styles';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';

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
    const { confirm, confirmDialog } = useConfirmDialog();
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
        const ok = await confirm({
            title: `Update status to ${newStatus.replace(/_/g, ' ')}?`,
            confirmLabel: 'Update',
            variant: 'primary',
        });
        if (!ok) return;
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
        { label: 'Total', value: shipments.length, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
        { label: 'Booked', value: bookedCount, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
        { label: 'In transit', value: inTransitCount, icon: Truck, ...ADMIN_STAT_PROGRESS },
        { label: 'Delivered', value: deliveredCount, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
    ];

    return (
        <DashboardLayout isAdmin={true}>
            <div className="pb-6 md:pb-8">
            <AdminPageHeader
                icon={Truck}
                title="Shipments"
                subtitle="Freight and delivery"
                actions={
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            goToShipmentDetail();
                        }}
                    >
                        <AdminToolbar
                            searchValue={searchTerm}
                            onSearchChange={setSearchTerm}
                            searchPlaceholder="Search tracking or customer…"
                            searchAriaLabel="Search shipments"
                        >
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => setScannerOpen(true)}
                                leftIcon={<Camera className="h-3.5 w-3.5" />}
                                title="Scan barcode to find shipment"
                                className="h-9 min-h-[36px] px-3 text-xs shrink-0"
                            >
                                <span className="hidden xs:inline">Scan</span>
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                rightIcon={<ChevronRight className="h-3.5 w-3.5" />}
                                title="Open shipment details"
                                className="h-9 min-h-[36px] px-3 text-xs shrink-0"
                            >
                                <span className="hidden xs:inline">Go</span>
                            </Button>
                        </AdminToolbar>
                    </form>
                }
            />
            <AdminStatGrid items={stats} columns={4} />

            <AdminTable>
                <AdminTableHead>
                    <AdminTh>Tracking</AdminTh>
                    <AdminTh>Customer</AdminTh>
                    <AdminTh align="right">Status</AdminTh>
                    <AdminTh align="right">Actions</AdminTh>
                </AdminTableHead>
                <AdminTableBody>
                    {loading ? (
                        <AdminTableLoading colSpan={4} />
                    ) : filteredShipments.length === 0 ? (
                        <AdminTableEmpty
                            colSpan={4}
                            icon={<Package className="h-10 w-10 mx-auto mb-2 text-gray-200" />}
                            message="No shipments found"
                        />
                    ) : (
                        filteredShipments.map((shipment) => (
                            <AdminTr key={shipment.id}>
                                <AdminTd>
                                    <div className="flex flex-col gap-0.5">
                                        <Link
                                            href={`/admin/logistics/${shipment.id}`}
                                            className="text-xs font-semibold text-brand hover:underline"
                                        >
                                            {shipment.tracking_number || '—'}
                                        </Link>
                                        <span className="text-xs text-gray-500">{shipment.service_type || 'Standard'}</span>
                                        {shipment.origin_warehouse && (
                                            <div className="flex items-center gap-1 mt-1 flex-wrap">
                                                <span className="text-xs font-semibold py-0.5 px-1.5 bg-blue-50 text-blue-600 rounded border border-blue-200">{shipment.origin_warehouse.code}</span>
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
                                </AdminTd>
                                <AdminTd>
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
                                </AdminTd>
                                <AdminTd className="text-right">
                                    <StatusBadge status={shipment.status} />
                                    <p className="text-xs text-gray-500 mt-1 flex items-center justify-end gap-1">
                                        <Calendar className="h-2.5 w-2.5" />{new Date(shipment.created_at).toLocaleDateString()}
                                    </p>
                                </AdminTd>
                                <AdminTd className="text-right">
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
                                            className="min-w-[44px] min-h-[44px] w-10 h-10 bg-blue-50 text-brand rounded-lg flex items-center justify-center hover:bg-brand hover:text-white transition-all disabled:opacity-50 shrink-0"
                                            aria-label="Advance status"
                                        >
                                            <Zap className="h-4 w-4" />
                                        </button>
                                        <Select
                                            disabled={updatingId === shipment.id}
                                            value={shipment.status}
                                            onChange={(e) => void handleStatusUpdate(shipment.id, e.target.value)}
                                            className="h-9 min-h-[36px] text-xs py-1.5 w-auto min-w-[8.5rem]"
                                            aria-label={`Update status for ${shipment.tracking_number}`}
                                        >
                                            <option value="booked">Booked</option>
                                            <option value="pickup_scheduled">Pickup scheduled</option>
                                            <option value="picked_up">Picked up</option>
                                            <option value="in_transit">In transit</option>
                                            <option value="out_for_delivery">Out for delivery</option>
                                            <option value="delivered">Delivered</option>
                                            <option value="cancelled">Cancelled</option>
                                        </Select>
                                    </div>
                                </AdminTd>
                            </AdminTr>
                        ))
                    )}
                </AdminTableBody>
            </AdminTable>
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
            {confirmDialog}
        </DashboardLayout>
    );
}
