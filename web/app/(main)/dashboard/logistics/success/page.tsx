'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/axios';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ThankYouCard from '@/components/thank-you/ThankYouCard';
import DashboardSuccessShell, { DashboardLoadingState, DashboardEmptyState } from '@/components/dashboard/DashboardSuccessShell';
import { Truck, Package } from 'lucide-react';
import toast from 'react-hot-toast';

interface Shipment {
    id: number;
    tracking_number: string;
    status: string;
    service_type: string;
    weight: number;
    total_price: number;
    carrier_tracking_number?: string;
    created_at: string;
}

export default function LogisticsSuccessPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const id = searchParams.get('id');
    const [shipment, setShipment] = useState<Shipment | null>(null);
    const [loading, setLoading] = useState(!!id);

    useEffect(() => {
        if (!id) {
            setLoading(false);
            return;
        }
        api.get('/logistics/history')
            .then((res) => {
                const list = Array.isArray(res.data) ? res.data : [];
                const found = list.find((s: { id?: number; shipment_id?: number }) => String(s.id) === id || String(s.shipment_id) === id);
                if (found) setShipment(found);
                else setShipment(null);
            })
            .catch(() => {
                toast.error('Shipment not found');
                router.replace('/dashboard/logistics');
            })
            .finally(() => setLoading(false));
    }, [id, router]);

    if (!id) {
        return (
            <DashboardLayout>
                <DashboardEmptyState
                    message="No shipment ID provided."
                    backHref="/dashboard/logistics"
                    backLabel="Back to Logistics"
                />
            </DashboardLayout>
        );
    }

    if (loading || !shipment) {
        return (
            <DashboardLayout>
                <DashboardLoadingState message="Loading shipment…" />
            </DashboardLayout>
        );
    }

    const tracking = shipment.tracking_number || shipment.carrier_tracking_number || `SHP-${id}`;
    const serviceLabel = (shipment.service_type || 'freight').replace(/_/g, ' ');
    const total = Number(shipment.total_price ?? 0);

    return (
        <DashboardLayout>
            <DashboardSuccessShell>
                <ThankYouCard
                    title="Shipment booked successfully"
                    subtitle="Your freight has been registered. You can track its progress from your logistics dashboard."
                    details={[
                        { label: 'Tracking number', value: tracking },
                        { label: 'Service', value: serviceLabel },
                        { label: 'Weight', value: `${shipment.weight || '—'} kg` },
                        { label: 'Status', value: (shipment.status || 'booked').replace(/_/g, ' ') },
                        ...(total > 0 ? [{ label: 'Total', value: `₵${total.toFixed(2)}` }] : []),
                        { label: 'Date', value: new Date(shipment.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) },
                    ]}
                    primaryAction={{ label: 'View shipment', href: '/dashboard/logistics', icon: Package }}
                    secondaryAction={{ label: 'New shipment', href: '/dashboard/logistics', icon: Truck }}
                    accentColor="blue"
                />
            </DashboardSuccessShell>
        </DashboardLayout>
    );
}
