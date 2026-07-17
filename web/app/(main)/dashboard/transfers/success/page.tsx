'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/axios';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ThankYouCard from '@/components/thank-you/ThankYouCard';
import DashboardSuccessShell, { DashboardLoadingState, DashboardEmptyState } from '@/components/dashboard/DashboardSuccessShell';
import { Send, FileDown } from 'lucide-react';
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
                <DashboardEmptyState
                    message="No transfer ID provided."
                    backHref="/dashboard/transfers"
                    backLabel="Back to Transfers"
                />
            </DashboardLayout>
        );
    }

    if (loading || !transfer) {
        return (
            <DashboardLayout>
                <DashboardLoadingState message="Loading transfer…" />
            </DashboardLayout>
        );
    }

    const refShort = transfer.token?.slice(0, 12) || `TRF-${transfer.id}`;
    const statusLabel =
        transfer.status === 'processing'
            ? 'Awaiting payment review'
            : transfer.status?.replace(/_/g, ' ') || 'Submitted';

    return (
        <DashboardLayout>
            <DashboardSuccessShell>
                <ThankYouCard
                    title="Transfer submitted successfully"
                    subtitle="We received your payment proof. Our team will verify the payment and process your transfer."
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
                    accentColor="violet"
                />
            </DashboardSuccessShell>
        </DashboardLayout>
    );
}
