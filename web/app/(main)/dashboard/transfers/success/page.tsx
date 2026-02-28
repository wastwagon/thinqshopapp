'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/axios';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ThankYouCard from '@/components/thank-you/ThankYouCard';
import { Send, ArrowRight, FileDown } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface Transfer {
    id: number;
    token: string;
    amount_ghs: number;
    amount_cny: number;
    recipient_name: string;
    status: string;
    created_at: string;
}

export default function TransferSuccessPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const id = searchParams.get('id');
    const [transfer, setTransfer] = useState<Transfer | null>(null);
    const [loading, setLoading] = useState(!!id);

    useEffect(() => {
        if (!id) {
            setLoading(false);
            return;
        }
        api.get(`/finance/transfers/${id}`)
            .then((res) => setTransfer(res.data))
            .catch(() => {
                toast.error('Transfer not found');
                router.replace('/dashboard/transfers');
            })
            .finally(() => setLoading(false));
    }, [id, router]);

    if (!id) {
        return (
            <DashboardLayout>
                <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 px-4 py-6 pb-6 md:pb-8">
                    <p className="text-gray-500 text-sm">No transfer ID provided.</p>
                    <Link href="/dashboard/transfers" className="text-blue-600 font-semibold text-sm hover:underline">
                        Back to Transfers
                    </Link>
                </div>
            </DashboardLayout>
        );
    }

    if (loading || !transfer) {
        return (
            <DashboardLayout>
                <div className="min-h-[60vh] flex items-center justify-center pb-6 md:pb-8">
                    <div className="animate-spin h-10 w-10 border-2 border-blue-600 border-t-transparent rounded-full" />
                </div>
            </DashboardLayout>
        );
    }

    const refShort = transfer.token?.slice(0, 12) || `TRF-${transfer.id}`;
    const statusLabel = transfer.status?.replace(/_/g, ' ') || 'Submitted';

    return (
        <DashboardLayout>
            <div className="min-h-[80vh] flex items-center justify-center px-4 py-6 sm:py-10 pb-6 md:pb-8 safe-area-inset-bottom bg-gradient-to-b from-gray-50 to-white">
                <ThankYouCard
                    title="Transfer submitted successfully"
                    subtitle="Your cross-border transfer has been initiated. We will process it and send funds to your recipient."
                    details={[
                        { label: 'Reference', value: refShort },
                        { label: 'Amount (GHS)', value: `₵${Number(transfer.amount_ghs).toFixed(2)}` },
                        { label: 'Amount (CNY)', value: `¥${Number(transfer.amount_cny).toFixed(2)}` },
                        { label: 'Recipient', value: transfer.recipient_name || '—' },
                        { label: 'Status', value: statusLabel },
                        { label: 'Date', value: new Date(transfer.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) },
                    ]}
                    primaryAction={{ label: 'View details', href: `/dashboard/transfers/${transfer.id}/confirmation`, icon: FileDown }}
                    primaryVariant="outlined"
                    secondaryAction={{ label: 'New transfer', href: '/dashboard/transfers', icon: Send }}
                    accentColor="blue"
                />
            </div>
        </DashboardLayout>
    );
}
