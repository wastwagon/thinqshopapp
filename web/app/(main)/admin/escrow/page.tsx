'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { Shield, Search, Clock, PauseCircle, PlayCircle, ExternalLink, RefreshCw, History } from 'lucide-react';

type EscrowRow = {
    id: number;
    submission_number: string;
    name: string;
    expected_payout_ghs: number;
    sold_at?: string;
    sale_order_id?: number | null;
    escrow_on_hold: boolean;
    escrow_hold_reason?: string | null;
    user?: {
        email: string;
        phone?: string;
        profile?: { first_name?: string; last_name?: string };
    };
    order?: {
        id: number;
        order_number: string;
        status: string;
        payment_status: string;
    } | null;
};

type EscrowLedgerEntry = {
    id: number;
    event_type: string;
    amount_ghs?: number | string | null;
    note?: string | null;
    created_at: string;
};

type EscrowResponse = {
    items: EscrowRow[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
    summary: { total_in_escrow_ghs: number; held_count: number };
};

const ORDER_STATUS_FILTERS = ['', 'processing', 'packed', 'shipped', 'out_for_delivery'] as const;

const EVENT_LABELS: Record<string, string> = {
    locked: 'Escrow locked',
    hold_placed: 'Dispute hold',
    hold_released: 'Hold released',
    released: 'Payout released',
    voided: 'Voided (refund)',
    auto_released: 'Auto-released',
    clawback_pending: 'Clawback pending',
};

type ClawbackRow = {
    id: number;
    amount_ghs: number | string;
    recovered_ghs: number | string;
    status: string;
    notes?: string | null;
    order_id: number;
    submission?: { submission_number: string; name: string };
    consignor?: { email: string; profile?: { first_name?: string; last_name?: string } };
};

export default function AdminEscrowPage() {
    const [data, setData] = useState<EscrowResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [holdOnly, setHoldOnly] = useState(false);
    const [orderStatus, setOrderStatus] = useState('');
    const [page, setPage] = useState(1);
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [holdModal, setHoldModal] = useState<{ id: number; name: string } | null>(null);
    const [holdReason, setHoldReason] = useState('');
    const [autoReleaseDays, setAutoReleaseDays] = useState(0);
    const [runningAuto, setRunningAuto] = useState(false);
    const [ledgerModal, setLedgerModal] = useState<{ id: number; name: string } | null>(null);
    const [ledgerEntries, setLedgerEntries] = useState<EscrowLedgerEntry[]>([]);
    const [ledgerLoading, setLedgerLoading] = useState(false);
    const [clawbacks, setClawbacks] = useState<ClawbackRow[]>([]);
    const [settlingClawbackId, setSettlingClawbackId] = useState<number | null>(null);

    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 300);
        return () => clearTimeout(t);
    }, [searchTerm]);

    const fetchRows = useCallback(async () => {
        setLoading(true);
        try {
            const [escrowRes, settingsRes, clawRes] = await Promise.all([
                api.get('/consignment/admin/escrow', {
                    params: {
                        page,
                        limit: 25,
                        hold_only: holdOnly || undefined,
                        search: debouncedSearch || undefined,
                        order_status: orderStatus || undefined,
                    },
                }),
                api.get('/consignment/admin/settings'),
                api.get('/consignment/admin/clawbacks', { params: { status: 'pending' } }),
            ]);
            setData(escrowRes.data as EscrowResponse);
            setAutoReleaseDays(Number(settingsRes.data?.auto_release_days_after_shipped ?? 0));
            setClawbacks(Array.isArray(clawRes.data) ? clawRes.data : []);
        } catch {
            toast.error('Failed to load escrow queue');
        } finally {
            setLoading(false);
        }
    }, [page, holdOnly, debouncedSearch, orderStatus]);

    useEffect(() => {
        fetchRows();
    }, [fetchRows]);

    useEffect(() => {
        setPage(1);
    }, [holdOnly, debouncedSearch, orderStatus]);

    const rows = data?.items ?? [];

    const userName = (r: EscrowRow) => {
        const p = r.user?.profile;
        if (p?.first_name || p?.last_name) return `${p.first_name || ''} ${p.last_name || ''}`.trim();
        return r.user?.email ?? '—';
    };

    const openLedger = async (id: number, name: string) => {
        setLedgerModal({ id, name });
        setLedgerLoading(true);
        try {
            const { data: ledger } = await api.get(`/consignment/admin/escrow/${id}/ledger`);
            setLedgerEntries(Array.isArray(ledger) ? ledger : []);
        } catch {
            toast.error('Failed to load escrow history');
            setLedgerEntries([]);
        } finally {
            setLedgerLoading(false);
        }
    };

    const onHold = async () => {
        if (!holdModal || !holdReason.trim()) {
            toast.error('Hold reason required');
            return;
        }
        setProcessingId(holdModal.id);
        try {
            await api.patch(`/consignment/admin/escrow/${holdModal.id}/hold`, { reason: holdReason.trim() });
            toast.success('Escrow on hold');
            setHoldModal(null);
            setHoldReason('');
            fetchRows();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to place hold');
        } finally {
            setProcessingId(null);
        }
    };

    const releaseHold = async (id: number) => {
        setProcessingId(id);
        try {
            await api.patch(`/consignment/admin/escrow/${id}/release-hold`);
            toast.success('Hold released');
            fetchRows();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to release hold');
        } finally {
            setProcessingId(null);
        }
    };

    const markDelivered = async (orderId: number) => {
        setProcessingId(orderId);
        try {
            await api.patch(`/orders/admin/${orderId}/status`, { status: 'delivered' });
            toast.success('Order delivered — seller payout released');
            fetchRows();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to mark delivered');
        } finally {
            setProcessingId(null);
        }
    };

    const runAutoRelease = async () => {
        setRunningAuto(true);
        try {
            const { data: result } = await api.post('/consignment/admin/escrow/run-auto-release');
            toast.success(result?.message || 'Auto-release complete');
            fetchRows();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Auto-release failed');
        } finally {
            setRunningAuto(false);
        }
    };

    const settleClawback = async (id: number, action: 'recovered' | 'waived') => {
        setSettlingClawbackId(id);
        try {
            const { data } = await api.patch(`/consignment/admin/clawbacks/${id}/settle`, { action });
            if (action === 'recovered') {
                if (data?.fully_settled) {
                    toast.success('Clawback fully recovered');
                } else if (Number(data?.recovered_now_ghs) > 0) {
                    toast.success(`Partial recovery: ₵${Number(data.recovered_now_ghs).toFixed(2)} collected, ₵${Number(data.outstanding_ghs).toFixed(2)} still owed`);
                } else {
                    toast.error('Seller has insufficient wallet balance — try again after they top up or waive');
                }
            } else {
                toast.success('Clawback waived');
            }
            fetchRows();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to settle clawback');
        } finally {
            setSettlingClawbackId(null);
        }
    };

    const heldCount = data?.summary?.held_count ?? 0;
    const totalPayout = data?.summary?.total_in_escrow_ghs ?? 0;

    return (
        <DashboardLayout isAdmin={true}>
            <div className="pb-6 md:pb-8">
                <AdminPageHeader
                    icon={Shield}
                    title="Sell for Me escrow"
                    subtitle="Payouts held until you confirm delivery with the buyer. Release by marking the order delivered."
                    actions={
                        <div className="flex flex-wrap gap-2 items-center">
                            <button
                                type="button"
                                onClick={fetchRows}
                                className="h-9 px-3 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 flex items-center gap-1.5"
                            >
                                <RefreshCw className="h-3.5 w-3.5" /> Refresh
                            </button>
                            <button
                                type="button"
                                onClick={runAutoRelease}
                                disabled={runningAuto || autoReleaseDays < 1}
                                className="h-9 px-3 rounded-lg border border-violet-200 bg-violet-50 text-xs font-semibold text-violet-800 disabled:opacity-50"
                                title={autoReleaseDays < 1 ? 'Enable in Sell for Me settings' : `Auto-deliver after ${autoReleaseDays} days shipped (also runs daily at 3:00 UTC)`}
                            >
                                {runningAuto ? 'Running…' : `Auto-release (${autoReleaseDays || 'off'}d)`}
                            </button>
                            <div className="relative min-w-0 sm:w-48">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" aria-hidden />
                                <input
                                    type="search"
                                    placeholder="Search…"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="admin-input w-full sm:w-48 pl-8"
                                />
                            </div>
                        </div>
                    }
                />

                <div className="flex flex-wrap gap-2 mb-4">
                    <button
                        type="button"
                        onClick={() => setHoldOnly(false)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${!holdOnly ? 'bg-violet-50 border-violet-200 text-violet-800' : 'bg-white border-gray-200 text-gray-600'}`}
                    >
                        All escrow
                    </button>
                    <button
                        type="button"
                        onClick={() => setHoldOnly(true)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${holdOnly ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-white border-gray-200 text-gray-600'}`}
                    >
                        On hold only
                    </button>
                    <select
                        value={orderStatus}
                        onChange={(e) => setOrderStatus(e.target.value)}
                        className="admin-input h-8 text-xs min-w-[140px]"
                    >
                        <option value="">All order statuses</option>
                        {ORDER_STATUS_FILTERS.filter(Boolean).map((s) => (
                            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                    <div className="admin-card p-4">
                        <p className="text-xs text-gray-500">Awaiting release</p>
                        <p className="text-2xl font-bold text-gray-900">{loading ? '—' : data?.total ?? 0}</p>
                    </div>
                    <div className="admin-card p-4">
                        <p className="text-xs text-gray-500">Total in escrow</p>
                        <p className="text-2xl font-bold text-violet-700">₵{Number(totalPayout).toFixed(2)}</p>
                    </div>
                    <div className="admin-card p-4">
                        <p className="text-xs text-gray-500">On dispute hold</p>
                        <p className="text-2xl font-bold text-amber-700">{heldCount}</p>
                    </div>
                </div>

                <p className="text-xs text-gray-500 mb-4">
                    Workflow: verify shipment with buyer → mark order <strong>delivered</strong> in Orders (or below).
                    Use <strong>Hold</strong> if there is a dispute. Auto-release runs daily at 3:00 UTC when enabled in{' '}
                    <Link href="/admin/consignments" className="text-brand font-semibold hover:underline">Sell for Me settings</Link>.
                </p>

                <div className="admin-table-wrap">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-50">
                                    <th className="admin-th">Item</th>
                                    <th className="admin-th">Consignor</th>
                                    <th className="admin-th">Order</th>
                                    <th className="admin-th">Payout</th>
                                    <th className="admin-th">Status</th>
                                    <th className="admin-th text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">Loading…</td></tr>
                                ) : rows.length === 0 ? (
                                    <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">No escrow payouts pending</td></tr>
                                ) : (
                                    rows.map((r) => (
                                        <tr key={r.id} className="hover:bg-gray-50/50">
                                            <td className="px-3 py-2.5">
                                                <p className="text-sm font-semibold text-gray-900">{r.name}</p>
                                                <p className="text-[10px] text-gray-500">{r.submission_number}</p>
                                            </td>
                                            <td className="px-3 py-2.5 text-xs text-gray-600">{userName(r)}</td>
                                            <td className="px-3 py-2.5 text-xs">
                                                {r.order ? (
                                                    <Link href={`/admin/orders/${r.order.id}`} className="text-brand font-semibold hover:underline inline-flex items-center gap-1">
                                                        {r.order.order_number}
                                                        <ExternalLink className="h-3 w-3" />
                                                    </Link>
                                                ) : '—'}
                                                {r.order && (
                                                    <p className="text-[10px] text-gray-400 mt-0.5 capitalize">{r.order.status.replace(/_/g, ' ')}</p>
                                                )}
                                            </td>
                                            <td className="px-3 py-2.5 text-sm font-semibold text-violet-700">₵{Number(r.expected_payout_ghs).toFixed(2)}</td>
                                            <td className="px-3 py-2.5">
                                                {r.escrow_on_hold ? (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-100">
                                                        <PauseCircle className="h-3 w-3" /> On hold
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-100">
                                                        <Clock className="h-3 w-3" /> Escrow
                                                    </span>
                                                )}
                                                {r.escrow_hold_reason && (
                                                    <p className="text-[10px] text-amber-700 mt-1 max-w-[160px]">{r.escrow_hold_reason}</p>
                                                )}
                                            </td>
                                            <td className="px-3 py-2.5 text-right">
                                                <div className="flex justify-end gap-1 flex-wrap">
                                                    <button
                                                        type="button"
                                                        onClick={() => openLedger(r.id, r.name)}
                                                        className="px-2 py-1 text-[10px] font-semibold rounded-lg bg-gray-50 text-gray-600 border border-gray-100"
                                                        title="Escrow history"
                                                    >
                                                        <History className="h-3 w-3 inline" />
                                                    </button>
                                                    {r.order && r.order.status !== 'delivered' && !r.escrow_on_hold && (
                                                        <button
                                                            type="button"
                                                            disabled={processingId !== null}
                                                            onClick={() => markDelivered(r.order!.id)}
                                                            className="px-2 py-1 text-[10px] font-semibold rounded-lg bg-green-50 text-green-700 border border-green-100"
                                                        >
                                                            Mark delivered
                                                        </button>
                                                    )}
                                                    {r.escrow_on_hold ? (
                                                        <button
                                                            type="button"
                                                            disabled={processingId === r.id}
                                                            onClick={() => releaseHold(r.id)}
                                                            className="px-2 py-1 text-[10px] font-semibold rounded-lg bg-gray-100 text-gray-700"
                                                        >
                                                            <PlayCircle className="h-3 w-3 inline" /> Release hold
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => { setHoldModal({ id: r.id, name: r.name }); setHoldReason(''); }}
                                                            className="px-2 py-1 text-[10px] font-semibold rounded-lg bg-amber-50 text-amber-800 border border-amber-100"
                                                        >
                                                            Hold
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {(data?.total_pages ?? 0) > 1 && (
                    <div className="flex items-center justify-between mt-4 text-xs text-gray-600">
                        <span>Page {data?.page} of {data?.total_pages} ({data?.total} total)</span>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                disabled={page <= 1 || loading}
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <button
                                type="button"
                                disabled={page >= (data?.total_pages ?? 1) || loading}
                                onClick={() => setPage((p) => p + 1)}
                                className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}

                {clawbacks.length > 0 && (
                    <div className="mt-8 admin-table-wrap">
                        <div className="px-4 py-3 border-b border-gray-50 bg-amber-50/50">
                            <h3 className="text-sm font-semibold text-amber-900">Pending clawbacks (post-payout refunds)</h3>
                            <p className="text-xs text-amber-700">Seller wallet was insufficient — recover manually or waive.</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-gray-50/50 border-b border-gray-50">
                                        <th className="admin-th">Item</th>
                                        <th className="admin-th">Consignor</th>
                                        <th className="admin-th">Outstanding</th>
                                        <th className="admin-th text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {clawbacks.map((c) => {
                                        const outstanding = Number(c.amount_ghs) - Number(c.recovered_ghs ?? 0);
                                        const p = c.consignor?.profile;
                                        const cName = p?.first_name || p?.last_name
                                            ? `${p?.first_name || ''} ${p?.last_name || ''}`.trim()
                                            : c.consignor?.email ?? '—';
                                        return (
                                            <tr key={c.id}>
                                                <td className="px-3 py-2.5 text-xs">
                                                    <p className="font-semibold">{c.submission?.name}</p>
                                                    <p className="text-gray-500">{c.submission?.submission_number}</p>
                                                </td>
                                                <td className="px-3 py-2.5 text-xs text-gray-600">{cName}</td>
                                                <td className="px-3 py-2.5 text-sm font-semibold text-amber-800">₵{outstanding.toFixed(2)}</td>
                                                <td className="px-3 py-2.5 text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <button
                                                            type="button"
                                                            disabled={settlingClawbackId === c.id}
                                                            onClick={() => settleClawback(c.id, 'recovered')}
                                                            className="px-2 py-1 text-[10px] font-semibold rounded-lg bg-green-50 text-green-700 border border-green-100"
                                                        >
                                                            Mark recovered
                                                        </button>
                                                        <button
                                                            type="button"
                                                            disabled={settlingClawbackId === c.id}
                                                            onClick={() => settleClawback(c.id, 'waived')}
                                                            className="px-2 py-1 text-[10px] font-semibold rounded-lg bg-gray-100 text-gray-700"
                                                        >
                                                            Waive
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {holdModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/40" onClick={() => setHoldModal(null)} aria-hidden />
                        <div className="admin-modal-panel relative max-w-md w-full p-6">
                            <h2 className="text-lg font-bold text-gray-900 mb-1">Place escrow on hold</h2>
                            <p className="text-xs text-gray-500 mb-4">{holdModal.name} — payout blocked until hold is released.</p>
                            <textarea
                                className="w-full min-h-[80px] admin-input"
                                placeholder="Dispute reason (required)"
                                value={holdReason}
                                onChange={(e) => setHoldReason(e.target.value)}
                            />
                            <div className="flex gap-2 mt-4">
                                <button type="button" disabled={processingId !== null} onClick={onHold} className="flex-1 h-10 rounded-lg bg-amber-600 text-white text-sm font-semibold">
                                    Place on hold
                                </button>
                                <button type="button" onClick={() => setHoldModal(null)} className="h-10 px-4 rounded-lg bg-gray-100 text-sm">Cancel</button>
                            </div>
                        </div>
                    </div>
                )}

                {ledgerModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/40" onClick={() => setLedgerModal(null)} aria-hidden />
                        <div className="admin-modal-panel relative max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto">
                            <h2 className="text-lg font-bold text-gray-900 mb-1">Escrow history</h2>
                            <p className="text-xs text-gray-500 mb-4">{ledgerModal.name}</p>
                            {ledgerLoading ? (
                                <p className="text-sm text-gray-500">Loading…</p>
                            ) : ledgerEntries.length === 0 ? (
                                <p className="text-sm text-gray-500">No ledger entries yet.</p>
                            ) : (
                                <ul className="space-y-3">
                                    {ledgerEntries.map((e) => (
                                        <li key={e.id} className="border border-gray-100 rounded-lg p-3 text-xs">
                                            <div className="flex justify-between gap-2">
                                                <span className="font-semibold text-gray-900">{EVENT_LABELS[e.event_type] ?? e.event_type}</span>
                                                <span className="text-gray-400">{new Date(e.created_at).toLocaleString()}</span>
                                            </div>
                                            {e.amount_ghs != null && Number(e.amount_ghs) > 0 && (
                                                <p className="text-violet-700 font-semibold mt-1">₵{Number(e.amount_ghs).toFixed(2)}</p>
                                            )}
                                            {e.note && <p className="text-gray-600 mt-1">{e.note}</p>}
                                        </li>
                                    ))}
                                </ul>
                            )}
                            <button type="button" onClick={() => setLedgerModal(null)} className="mt-4 h-10 w-full rounded-lg bg-gray-100 text-sm font-semibold">Close</button>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
