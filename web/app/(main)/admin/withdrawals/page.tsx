'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
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
import Textarea from '@/components/ui/Textarea';
import FormField from '@/components/ui/FormField';
import Modal from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/Badge';
import { Wallet, User } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/axios';

type WithdrawalRow = {
    id: number;
    user_id: number;
    amount_ghs: number;
    net_amount_ghs: number;
    method: string;
    recipient_details: Record<string, string>;
    status: string;
    admin_note?: string;
    rejection_reason?: string;
    created_at: string;
    paid_at?: string;
    user?: {
        email: string;
        phone?: string;
        profile?: { first_name?: string; last_name?: string };
    };
};

const STATUS_TABS = ['pending', 'paid', 'rejected', 'cancelled', ''] as const;

function userLabel(w: WithdrawalRow) {
    const p = w.user?.profile;
    if (p?.first_name || p?.last_name) {
        return `${p.first_name || ''} ${p.last_name || ''}`.trim();
    }
    return w.user?.email ?? `User #${w.user_id}`;
}

function recipientSummary(w: WithdrawalRow) {
    const d = w.recipient_details || {};
    if (w.method === 'mobile_money') {
        return `${d.network || 'MoMo'} · ${d.phone || '—'} · ${d.account_name || ''}`;
    }
    return `${d.bank_name || 'Bank'} · ${d.account_number || '—'} · ${d.account_name || ''}`;
}

export default function AdminWithdrawalsPage() {
    const [rows, setRows] = useState<WithdrawalRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('pending');
    const [searchTerm, setSearchTerm] = useState('');
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [modal, setModal] = useState<{ id: number; action: 'approve' | 'reject' } | null>(null);
    const [note, setNote] = useState('');

    const fetchRows = async () => {
        setLoading(true);
        try {
            const params: Record<string, string> = { limit: '100' };
            if (statusFilter) params.status = statusFilter;
            const { data } = await api.get('/finance/wallet/admin/withdrawals', { params });
            setRows(data?.data ?? []);
        } catch {
            toast.error('Failed to load withdrawals');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRows();
    }, [statusFilter]);

    const filtered = rows.filter((w) => {
        if (!searchTerm.trim()) return true;
        const q = searchTerm.toLowerCase();
        return (
            userLabel(w).toLowerCase().includes(q) ||
            (w.user?.email ?? '').toLowerCase().includes(q) ||
            recipientSummary(w).toLowerCase().includes(q)
        );
    });

    const handleApprove = async () => {
        if (!modal || modal.action !== 'approve') return;
        setProcessingId(modal.id);
        try {
            await api.patch(`/finance/wallet/admin/withdrawals/${modal.id}/approve`, {
                admin_note: note.trim() || undefined,
            });
            toast.success('Marked as paid and wallet debited');
            setModal(null);
            setNote('');
            fetchRows();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to approve');
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async () => {
        if (!modal || modal.action !== 'reject') return;
        if (!note.trim()) {
            toast.error('Rejection reason is required');
            return;
        }
        setProcessingId(modal.id);
        try {
            await api.patch(`/finance/wallet/admin/withdrawals/${modal.id}/reject`, {
                rejection_reason: note.trim(),
            });
            toast.success('Withdrawal rejected');
            setModal(null);
            setNote('');
            fetchRows();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to reject');
        } finally {
            setProcessingId(null);
        }
    };

    const pendingCount = rows.filter((r) => r.status === 'pending').length;

    return (
        <DashboardLayout isAdmin={true}>
            <div className="pb-6 md:pb-8">
                <AdminPageHeader
                    icon={Wallet}
                    title="Withdrawals"
                    subtitle="Review requests, pay users manually, then approve to debit their wallet"
                    actions={
                        <AdminToolbar
                            searchValue={searchTerm}
                            onSearchChange={setSearchTerm}
                            searchPlaceholder="Search user or recipient…"
                            searchAriaLabel="Search withdrawals"
                        />
                    }
                />

                <div className="flex flex-wrap gap-2 mb-4">
                    {STATUS_TABS.map((tab) => (
                        <button
                            key={tab || 'all'}
                            type="button"
                            onClick={() => setStatusFilter(tab)}
                            className={`h-8 px-3 rounded-lg text-xs font-semibold border transition-colors ${
                                statusFilter === tab
                                    ? 'bg-brand text-white border-brand'
                                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                            }`}
                        >
                            {tab === '' ? 'All' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                            {tab === 'pending' && statusFilter === 'pending' && pendingCount > 0 && (
                                <span className="ml-1.5 bg-white/20 px-1.5 rounded-full">
                                    {pendingCount}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                <AdminTable>
                    <AdminTableHead>
                        <AdminTh>User</AdminTh>
                        <AdminTh>Amount</AdminTh>
                        <AdminTh>Method / recipient</AdminTh>
                        <AdminTh>Requested</AdminTh>
                        <AdminTh>Status</AdminTh>
                        <AdminTh align="right">Actions</AdminTh>
                    </AdminTableHead>
                    <AdminTableBody>
                        {loading ? (
                            <AdminTableLoading colSpan={6} />
                        ) : filtered.length === 0 ? (
                            <AdminTableEmpty
                                colSpan={6}
                                icon={<Wallet className="h-10 w-10 mx-auto mb-2 text-gray-200" />}
                                message="No withdrawal requests"
                            />
                        ) : (
                            filtered.map((w) => (
                                <AdminTr key={w.id}>
                                    <AdminTd>
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                                                <User className="h-3.5 w-3.5 text-brand" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-semibold text-gray-900 truncate">
                                                    {userLabel(w)}
                                                </p>
                                                <p className="text-[10px] text-gray-500 truncate">
                                                    {w.user?.email}
                                                </p>
                                            </div>
                                        </div>
                                    </AdminTd>
                                    <AdminTd>
                                        <span className="text-xs font-bold text-gray-900 tabular-nums">
                                            ₵{Number(w.amount_ghs).toFixed(2)}
                                        </span>
                                    </AdminTd>
                                    <AdminTd className="max-w-[200px]">
                                        <p className="text-xs text-gray-700 capitalize">
                                            {w.method.replace(/_/g, ' ')}
                                        </p>
                                        <p className="text-[10px] text-gray-500 truncate">
                                            {recipientSummary(w)}
                                        </p>
                                    </AdminTd>
                                    <AdminTd className="text-xs text-gray-500 whitespace-nowrap">
                                        {new Date(w.created_at).toLocaleString()}
                                    </AdminTd>
                                    <AdminTd>
                                        <StatusBadge status={w.status} />
                                    </AdminTd>
                                    <AdminTd className="text-right">
                                        {w.status === 'pending' ? (
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    disabled={processingId === w.id}
                                                    onClick={() => {
                                                        setModal({ id: w.id, action: 'approve' });
                                                        setNote('');
                                                    }}
                                                    className="h-8 min-h-[32px] px-2 text-xs bg-emerald-600 hover:bg-emerald-700"
                                                >
                                                    Approve
                                                </Button>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="danger"
                                                    disabled={processingId === w.id}
                                                    onClick={() => {
                                                        setModal({ id: w.id, action: 'reject' });
                                                        setNote('');
                                                    }}
                                                    className="h-8 min-h-[32px] px-2 text-xs"
                                                >
                                                    Reject
                                                </Button>
                                            </div>
                                        ) : (
                                            <span className="text-[10px] text-gray-400">
                                                {w.admin_note || w.rejection_reason || '—'}
                                            </span>
                                        )}
                                    </AdminTd>
                                </AdminTr>
                            ))
                        )}
                    </AdminTableBody>
                </AdminTable>

                <Modal
                    open={!!modal}
                    onClose={() => {
                        if (!processingId) setModal(null);
                    }}
                    title={modal?.action === 'approve' ? 'Approve withdrawal' : 'Reject withdrawal'}
                    description={
                        modal?.action === 'approve'
                            ? 'Send funds to the user manually first (MoMo or bank), then approve to debit their wallet.'
                            : 'The reserved amount will be released back to their available balance.'
                    }
                    footer={
                        <>
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                disabled={!!processingId}
                                onClick={() => !processingId && setModal(null)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                variant={modal?.action === 'reject' ? 'danger' : 'primary'}
                                loading={!!processingId}
                                disabled={!!processingId}
                                onClick={modal?.action === 'approve' ? handleApprove : handleReject}
                                className={
                                    modal?.action === 'approve'
                                        ? 'bg-emerald-600 hover:bg-emerald-700'
                                        : undefined
                                }
                            >
                                {modal?.action === 'approve' ? 'Mark paid' : 'Reject'}
                            </Button>
                        </>
                    }
                >
                    <FormField
                        label={
                            modal?.action === 'approve'
                                ? 'Payment note (optional)'
                                : 'Rejection reason'
                        }
                        htmlFor="withdrawal-note"
                        required={modal?.action === 'reject'}
                    >
                        <Textarea
                            id="withdrawal-note"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder={
                                modal?.action === 'approve'
                                    ? 'e.g. Paid via MTN ref 12345'
                                    : 'Reason for rejection'
                            }
                            rows={3}
                        />
                    </FormField>
                </Modal>
            </div>
        </DashboardLayout>
    );
}
