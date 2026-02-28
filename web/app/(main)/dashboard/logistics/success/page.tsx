'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/axios';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ThankYouCard from '@/components/thank-you/ThankYouCard';
import { Truck, Package, ArrowRight } from 'lucide-react';
import Link from 'next/link';
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
                const found = list.find((s: any) => String(s.id) === id || String(s.shipment_id) === id);
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
                <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 px-4 py-6 pb-6 md:pb-8">
                    <p className="text-gray-500 text-sm">No shipment ID provided.</p>
                    <Link href="/dashboard/logistics" className="text-blue-600 font-semibold text-sm hover:underline">
                        Back to Logistics
                    </Link>
                </div>
            </DashboardLayout>
        );
    }

    if (loading || !shipment) {
        return (
            <DashboardLayout>
                <div className="min-h-[60vh] flex items-center justify-center pb-6 md:pb-8">
                    <div className="animate-spin h-10 w-10 border-2 border-blue-600 border-t-transparent rounded-full" />
                </div>
            </DashboardLayout>
        );
    }

    const tracking = shipment.tracking_number || shipment.carrier_tracking_number || `SHP-${id}`;
    const serviceLabel = (shipment.service_type || 'freight').replace(/_/g, ' ');
    const total = Number(shipment.total_price ?? 0);

    return (
        <DashboardLayout>
            <div className="min-h-[80vh] flex items-center justify-center px-4 py-6 sm:py-10 pb-6 md:pb-8 safe-area-inset-bottom bg-gradient-to-b from-gray-50 to-white">
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
                    accentColor="emerald"
                />
            </div>
        </DashboardLayout>
    );
}
