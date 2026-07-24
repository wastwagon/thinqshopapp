'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
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
import Textarea from '@/components/ui/Textarea';
import FormField from '@/components/ui/FormField';
import Modal from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/Badge';
import { Shield, Clock, PauseCircle, PlayCircle, ExternalLink, RefreshCw, History } from 'lucide-react';

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
                        <AdminToolbar
                            searchValue={searchTerm}
                            onSearchChange={setSearchTerm}
                            searchPlaceholder="Search…"
                            searchAriaLabel="Search escrow"
                        >
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={fetchRows}
                                leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
                            >
                                Refresh
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                onClick={runAutoRelease}
                                loading={runningAuto}
                                disabled={runningAuto || autoReleaseDays < 1}
                                title={autoReleaseDays < 1 ? 'Enable in Sell for Me settings' : `Auto-deliver after ${autoReleaseDays} days shipped (also runs daily at 3:00 UTC)`}
                            >
                                Auto-release ({autoReleaseDays || 'off'}d)
                            </Button>
                        </AdminToolbar>
                    }
                />

                <div className="flex flex-wrap gap-2 mb-4">
                    <Button
                        type="button"
                        size="sm"
                        variant={!holdOnly ? 'primary' : 'secondary'}
                        onClick={() => setHoldOnly(false)}
                    >
                        All escrow
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => setHoldOnly(true)}
                        className={holdOnly ? 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-50' : undefined}
                    >
                        On hold only
                    </Button>
                    <Select
                        value={orderStatus}
                        onChange={(e) => setOrderStatus(e.target.value)}
                        aria-label="Filter by order status"
                        className="h-9 min-h-[36px] text-xs w-auto min-w-[9rem]"
                    >
                        <option value="">All order statuses</option>
                        {ORDER_STATUS_FILTERS.filter(Boolean).map((s) => (
                            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                        ))}
                    </Select>
                </div>

                <AdminStatGrid
                    columns={3}
                    items={[
                        {
                            label: 'Awaiting release',
                            value: loading ? '—' : data?.total ?? 0,
                            icon: Clock,
                            color: 'text-blue-600',
                            bg: 'bg-blue-50',
                            border: 'border-blue-200',
                        },
                        {
                            label: 'Total in escrow',
                            value: `₵${Number(totalPayout).toFixed(2)}`,
                            icon: Shield,
                            color: 'text-blue-700',
                            bg: 'bg-blue-50',
                            border: 'border-blue-100',
                        },
                        {
                            label: 'On dispute hold',
                            value: heldCount,
                            icon: PauseCircle,
                            color: 'text-amber-700',
                            bg: 'bg-amber-50',
                            border: 'border-amber-100',
                        },
                    ]}
                />

                <p className="text-xs text-gray-500 mb-4">
                    Workflow: verify shipment with buyer → mark order <strong>delivered</strong> in Orders (or below).
                    Use <strong>Hold</strong> if there is a dispute. Auto-release runs daily at 3:00 UTC when enabled in{' '}
                    <Link href="/admin/consignments" className="text-blue-600 font-semibold hover:underline">Sell for Me settings</Link>.
                </p>

                <AdminTable>
                    <AdminTableHead>
                        <AdminTh>Item</AdminTh>
                        <AdminTh>Consignor</AdminTh>
                        <AdminTh>Order</AdminTh>
                        <AdminTh>Payout</AdminTh>
                        <AdminTh>Status</AdminTh>
                        <AdminTh align="right">Actions</AdminTh>
                    </AdminTableHead>
                    <AdminTableBody>
                        {loading ? (
                            <AdminTableLoading colSpan={6} />
                        ) : rows.length === 0 ? (
                            <AdminTableEmpty
                                colSpan={6}
                                icon={<Shield className="h-10 w-10 mx-auto mb-2 text-gray-200" />}
                                message="No escrow payouts pending"
                            />
                        ) : (
                            rows.map((r) => (
                                <AdminTr key={r.id}>
                                    <AdminTd>
                                        <p className="text-xs font-semibold text-gray-900">{r.name}</p>
                                        <p className="text-[10px] text-gray-500">{r.submission_number}</p>
                                    </AdminTd>
                                    <AdminTd className="text-xs text-gray-600">{userName(r)}</AdminTd>
                                    <AdminTd>
                                        {r.order ? (
                                            <Link href={`/admin/orders/${r.order.id}`} className="text-xs text-brand font-semibold hover:underline inline-flex items-center gap-1">
                                                {r.order.order_number}
                                                <ExternalLink className="h-3 w-3" />
                                            </Link>
                                        ) : <span className="text-xs text-gray-400">—</span>}
                                        {r.order && (
                                            <p className="text-[10px] text-gray-400 mt-0.5 capitalize">{r.order.status.replace(/_/g, ' ')}</p>
                                        )}
                                    </AdminTd>
                                    <AdminTd className="text-xs font-semibold text-blue-700 tabular-nums">₵{Number(r.expected_payout_ghs).toFixed(2)}</AdminTd>
                                    <AdminTd>
                                        <StatusBadge status={r.escrow_on_hold ? 'on_hold' : 'pending'}>
                                            {r.escrow_on_hold ? (
                                                <><PauseCircle className="h-3 w-3" /> On hold</>
                                            ) : (
                                                <><Clock className="h-3 w-3" /> Escrow</>
                                            )}
                                        </StatusBadge>
                                        {r.escrow_hold_reason && (
                                            <p className="text-[10px] text-amber-700 mt-1 max-w-[160px]">{r.escrow_hold_reason}</p>
                                        )}
                                    </AdminTd>
                                    <AdminTd className="text-right">
                                        <div className="flex justify-end gap-1 flex-wrap">
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => openLedger(r.id, r.name)}
                                                className="h-8 min-h-[32px] px-2 text-xs"
                                                title="Escrow history"
                                            >
                                                <History className="h-3 w-3" />
                                            </Button>
                                            {r.order && r.order.status !== 'delivered' && !r.escrow_on_hold && (
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    disabled={processingId !== null}
                                                    onClick={() => markDelivered(r.order!.id)}
                                                    className="h-8 min-h-[32px] px-2 text-xs bg-emerald-600 hover:bg-emerald-700"
                                                >
                                                    Mark delivered
                                                </Button>
                                            )}
                                            {r.escrow_on_hold ? (
                                                <Button
                                                    type="button"
                                                    variant="secondary"
                                                    size="sm"
                                                    disabled={processingId === r.id}
                                                    onClick={() => releaseHold(r.id)}
                                                    leftIcon={<PlayCircle className="h-3 w-3" />}
                                                    className="h-8 min-h-[32px] px-2 text-xs"
                                                >
                                                    Release hold
                                                </Button>
                                            ) : (
                                                <Button
                                                    type="button"
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => { setHoldModal({ id: r.id, name: r.name }); setHoldReason(''); }}
                                                    className="h-8 min-h-[32px] px-2 text-xs bg-amber-50 text-amber-800 border-amber-100 hover:bg-amber-100"
                                                >
                                                    Hold
                                                </Button>
                                            )}
                                        </div>
                                    </AdminTd>
                                </AdminTr>
                            ))
                        )}
                    </AdminTableBody>
                </AdminTable>

                {(data?.total_pages ?? 0) > 1 && (
                    <div className="flex items-center justify-between mt-4 text-xs text-gray-600">
                        <span>Page {data?.page} of {data?.total_pages} ({data?.total} total)</span>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                disabled={page <= 1 || loading}
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                            >
                                Previous
                            </Button>
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                disabled={page >= (data?.total_pages ?? 1) || loading}
                                onClick={() => setPage((p) => p + 1)}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}

                {clawbacks.length > 0 && (
                    <div className="mt-8">
                        <div className="px-4 py-3 rounded-t-xl border border-b-0 border-gray-200/90 bg-amber-50/50">
                            <h3 className="text-sm font-semibold text-amber-900">Pending clawbacks (post-payout refunds)</h3>
                            <p className="text-xs text-amber-700">Seller wallet was insufficient — recover manually or waive.</p>
                        </div>
                        <AdminTable className="rounded-t-none">
                            <AdminTableHead>
                                <AdminTh>Item</AdminTh>
                                <AdminTh>Consignor</AdminTh>
                                <AdminTh>Outstanding</AdminTh>
                                <AdminTh align="right">Actions</AdminTh>
                            </AdminTableHead>
                            <AdminTableBody>
                                {clawbacks.map((c) => {
                                    const outstanding = Number(c.amount_ghs) - Number(c.recovered_ghs ?? 0);
                                    const p = c.consignor?.profile;
                                    const cName = p?.first_name || p?.last_name
                                        ? `${p?.first_name || ''} ${p?.last_name || ''}`.trim()
                                        : c.consignor?.email ?? '—';
                                    return (
                                        <AdminTr key={c.id}>
                                            <AdminTd>
                                                <p className="text-xs font-semibold text-gray-900">{c.submission?.name}</p>
                                                <p className="text-[10px] text-gray-500">{c.submission?.submission_number}</p>
                                            </AdminTd>
                                            <AdminTd className="text-xs text-gray-600">{cName}</AdminTd>
                                            <AdminTd className="text-xs font-semibold text-amber-800 tabular-nums">₵{outstanding.toFixed(2)}</AdminTd>
                                            <AdminTd className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        disabled={settlingClawbackId === c.id}
                                                        onClick={() => settleClawback(c.id, 'recovered')}
                                                        className="h-8 min-h-[32px] px-2 text-xs bg-emerald-600 hover:bg-emerald-700"
                                                    >
                                                        Mark recovered
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="secondary"
                                                        size="sm"
                                                        disabled={settlingClawbackId === c.id}
                                                        onClick={() => settleClawback(c.id, 'waived')}
                                                        className="h-8 min-h-[32px] px-2 text-xs"
                                                    >
                                                        Waive
                                                    </Button>
                                                </div>
                                            </AdminTd>
                                        </AdminTr>
                                    );
                                })}
                            </AdminTableBody>
                        </AdminTable>
                    </div>
                )}

                <Modal
                    open={!!holdModal}
                    onClose={() => {
                        if (processingId === null) setHoldModal(null);
                    }}
                    title="Place escrow on hold"
                    description={holdModal ? `${holdModal.name} — payout blocked until hold is released.` : undefined}
                    footer={
                        <>
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                disabled={processingId !== null}
                                onClick={() => setHoldModal(null)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                loading={processingId !== null}
                                disabled={processingId !== null}
                                onClick={onHold}
                                className="bg-amber-600 hover:bg-amber-700"
                            >
                                Place on hold
                            </Button>
                        </>
                    }
                >
                    <FormField label="Dispute reason" htmlFor="escrow-hold-reason" required>
                        <Textarea
                            id="escrow-hold-reason"
                            placeholder="Dispute reason (required)"
                            value={holdReason}
                            onChange={(e) => setHoldReason(e.target.value)}
                        />
                    </FormField>
                </Modal>

                <Modal
                    open={!!ledgerModal}
                    onClose={() => setLedgerModal(null)}
                    title="Escrow history"
                    description={ledgerModal?.name}
                    size="lg"
                    footer={
                        <Button type="button" variant="secondary" size="sm" onClick={() => setLedgerModal(null)}>
                            Close
                        </Button>
                    }
                >
                    {ledgerLoading ? (
                        <p className="text-sm text-gray-500">Loading…</p>
                    ) : ledgerEntries.length === 0 ? (
                        <p className="text-sm text-gray-500">No ledger entries yet.</p>
                    ) : (
                        <ul className="space-y-3 max-h-[60vh] overflow-y-auto">
                            {ledgerEntries.map((e) => (
                                <li key={e.id} className="border border-gray-100 rounded-lg p-3 text-xs">
                                    <div className="flex justify-between gap-2">
                                        <span className="font-semibold text-gray-900">{EVENT_LABELS[e.event_type] ?? e.event_type}</span>
                                        <span className="text-gray-400">{new Date(e.created_at).toLocaleString()}</span>
                                    </div>
                                    {e.amount_ghs != null && Number(e.amount_ghs) > 0 && (
                                        <p className="text-blue-700 font-semibold mt-1">₵{Number(e.amount_ghs).toFixed(2)}</p>
                                    )}
                                    {e.note && <p className="text-gray-600 mt-1">{e.note}</p>}
                                </li>
                            ))}
                        </ul>
                    )}
                </Modal>
            </div>
        </DashboardLayout>
    );
}
