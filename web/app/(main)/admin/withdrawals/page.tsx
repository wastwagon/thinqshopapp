'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { Wallet, Search, CheckCircle, XCircle, Clock, User } from 'lucide-react';
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
                        <div className="relative min-w-0 sm:w-56">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" aria-hidden />
                            <input
                                type="search"
                                placeholder="Search user or recipient..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="admin-input w-full sm:w-56 pl-8"
                                aria-label="Search withdrawals"
                            />
                        </div>
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
                                    : 'bg-white text-gray-600 border-gray-200 hover:border-brand/30'
                            }`}
                        >
                            {tab === '' ? 'All' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                            {tab === 'pending' && statusFilter === 'pending' && pendingCount > 0 && (
                                <span className="ml-1.5 bg-white/20 px-1.5 rounded-full">{pendingCount}</span>
                            )}
                        </button>
                    ))}
                </div>

                <div className="admin-table-wrap">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-50">
                                    <th className="admin-th">User</th>
                                    <th className="admin-th">Amount</th>
                                    <th className="admin-th">Method / recipient</th>
                                    <th className="admin-th">Requested</th>
                                    <th className="admin-th">Status</th>
                                    <th className="px-3 py-2.5 text-xs font-semibold text-gray-500 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="py-10 text-center text-sm text-gray-500">Loading…</td>
                                    </tr>
                                ) : filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-10 text-center text-gray-500">
                                            <Wallet className="h-10 w-10 mx-auto mb-2 text-gray-200" />
                                            <p className="text-sm">No withdrawal requests</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map((w) => (
                                        <tr key={w.id} className="hover:bg-gray-50/50">
                                            <td className="px-3 py-2.5">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-lg bg-brand/10 flex items-center justify-center shrink-0">
                                                        <User className="h-3.5 w-3.5 text-brand" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-semibold text-gray-900 truncate">{userLabel(w)}</p>
                                                        <p className="text-[10px] text-gray-500 truncate">{w.user?.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <span className="text-xs font-bold text-gray-900">₵{w.amount_ghs.toFixed(2)}</span>
                                            </td>
                                            <td className="px-3 py-2.5 max-w-[200px]">
                                                <p className="text-xs text-gray-700 capitalize">{w.method.replace(/_/g, ' ')}</p>
                                                <p className="text-[10px] text-gray-500 truncate">{recipientSummary(w)}</p>
                                            </td>
                                            <td className="px-3 py-2.5 text-xs text-gray-500">
                                                {new Date(w.created_at).toLocaleString()}
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <span
                                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold capitalize ${
                                                        w.status === 'pending'
                                                            ? 'bg-amber-50 text-amber-700'
                                                            : w.status === 'paid'
                                                              ? 'bg-green-50 text-green-700'
                                                              : w.status === 'rejected'
                                                                ? 'bg-red-50 text-red-600'
                                                                : 'bg-gray-100 text-gray-600'
                                                    }`}
                                                >
                                                    {w.status === 'pending' && <Clock className="h-3 w-3" />}
                                                    {w.status === 'paid' && <CheckCircle className="h-3 w-3" />}
                                                    {w.status === 'rejected' && <XCircle className="h-3 w-3" />}
                                                    {w.status}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2.5 text-right">
                                                {w.status === 'pending' ? (
                                                    <div className="flex justify-end gap-1">
                                                        <button
                                                            type="button"
                                                            disabled={processingId === w.id}
                                                            onClick={() => { setModal({ id: w.id, action: 'approve' }); setNote(''); }}
                                                            className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-green-50 text-green-700 border border-green-100 hover:bg-green-100"
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            type="button"
                                                            disabled={processingId === w.id}
                                                            onClick={() => { setModal({ id: w.id, action: 'reject' }); setNote(''); }}
                                                            className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-red-50 text-red-600 border border-red-100 hover:bg-red-100"
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] text-gray-400">
                                                        {w.admin_note || w.rejection_reason || '—'}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {modal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/40" onClick={() => !processingId && setModal(null)} aria-hidden />
                        <div className="admin-modal-panel relative max-w-md w-full p-6">
                            <h2 className="text-lg font-bold text-gray-900 mb-1">
                                {modal.action === 'approve' ? 'Approve withdrawal' : 'Reject withdrawal'}
                            </h2>
                            <p className="text-xs text-gray-500 mb-4">
                                {modal.action === 'approve'
                                    ? 'Send funds to the user manually first (MoMo or bank), then approve to debit their wallet.'
                                    : 'The reserved amount will be released back to their available balance.'}
                            </p>
                            <label className="text-xs font-semibold text-gray-500 block mb-1.5">
                                {modal.action === 'approve' ? 'Payment note (optional)' : 'Rejection reason'}
                            </label>
                            <textarea
                                className="w-full min-h-[80px] bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand/20"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder={modal.action === 'approve' ? 'e.g. Paid via MTN ref 12345' : 'Reason for rejection'}
                            />
                            <div className="flex gap-2 mt-4">
                                <button
                                    type="button"
                                    disabled={!!processingId}
                                    onClick={modal.action === 'approve' ? handleApprove : handleReject}
                                    className={`flex-1 h-10 rounded-lg font-semibold text-sm text-white disabled:opacity-50 ${
                                        modal.action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                                    }`}
                                >
                                    {processingId ? 'Processing…' : modal.action === 'approve' ? 'Mark paid' : 'Reject'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => !processingId && setModal(null)}
                                    className="h-10 px-4 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold text-gray-600"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
