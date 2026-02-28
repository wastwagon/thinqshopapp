'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/axios';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ThankYouCard from '@/components/thank-you/ThankYouCard';
import { ShoppingBag, ChevronRight, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface Request {
    id: number;
    request_number: string;
    request_type?: string;
    description: string;
    status: string;
    created_at: string;
}

export default function ProcurementSuccessPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const id = searchParams.get('id');
    const [request, setRequest] = useState<Request | null>(null);
    const [loading, setLoading] = useState(!!id);

    useEffect(() => {
        if (!id) {
            setLoading(false);
            return;
        }
        api.get(`/procurement/user/request/${id}`)
            .then((res) => setRequest(res.data))
            .catch(() => {
                toast.error('Request not found');
                router.replace('/dashboard/procurement');
            })
            .finally(() => setLoading(false));
    }, [id, router]);

    if (!id) {
        return (
            <DashboardLayout>
                <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 px-4 py-6 pb-6 md:pb-8">
                    <p className="text-gray-500 text-sm">No request ID provided.</p>
                    <Link href="/dashboard/procurement" className="text-blue-600 font-semibold text-sm hover:underline">
                        Back to Procurement
                    </Link>
                </div>
            </DashboardLayout>
        );
    }

    if (loading || !request) {
        return (
            <DashboardLayout>
                <div className="min-h-[60vh] flex items-center justify-center pb-6 md:pb-8">
                    <div className="animate-spin h-10 w-10 border-2 border-blue-600 border-t-transparent rounded-full" />
                </div>
            </DashboardLayout>
        );
    }

    const typeLabel = (request.request_type || 'sourcing').replace(/_/g, ' ');
    const descShort = request.description?.slice(0, 50) + (request.description?.length > 50 ? '…' : '');

    return (
        <DashboardLayout>
            <div className="min-h-[80vh] flex items-center justify-center px-4 py-6 sm:py-10 pb-6 md:pb-8 safe-area-inset-bottom bg-gradient-to-b from-gray-50 to-white">
                <ThankYouCard
                    title="Request submitted successfully"
                    subtitle="Our team will review your request and send you a quote. You will be notified when a quote is ready."
                    details={[
                        { label: 'Request number', value: request.request_number || `PRQ-${id}` },
                        { label: 'Type', value: typeLabel },
                        { label: 'Description', value: descShort || '—' },
                        { label: 'Status', value: (request.status || 'submitted').replace(/_/g, ' ') },
                        { label: 'Date', value: new Date(request.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) },
                    ]}
                    primaryAction={{ label: 'View request', href: `/dashboard/procurement/${request.id}/response`, icon: ChevronRight }}
                    secondaryAction={{ label: 'New request', href: '/dashboard/procurement', icon: ShoppingBag }}
                    accentColor="violet"
                />
            </div>
        </DashboardLayout>
    );
}
