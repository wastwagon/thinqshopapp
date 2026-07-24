'use client';

import React, { useEffect, useMemo, useState } from 'react';
import api from '@/lib/axios';
import { getMediaUrl } from '@/lib/media';
import toast from 'react-hot-toast';
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
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import FormField from '@/components/ui/FormField';
import Modal from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/Badge';
import Link from 'next/link';
import { Tag, Eye, ExternalLink, TrendingUp, Calendar, Trash2 } from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';

interface Submission {
    id: number;
    submission_number: string;
    name: string;
    description?: string;
    asking_price: number | string;
    stock_quantity?: number;
    approved_price?: number | string;
    commission_pct?: number | string;
    sale_amount_ghs?: number | null;
    commission_ghs?: number | null;
    seller_payout_ghs?: number | null;
    status: string;
    condition: string;
    images?: string[];
    pickup_details?: string;
    rejection_reason?: string;
    admin_notes?: string;
    created_at: string;
    category?: { name: string };
    product?: { id: number; slug: string } | null;
    user?: {
        email: string;
        phone?: string;
        profile?: { first_name?: string; last_name?: string };
    };
}

interface CommissionStats {
    from: string;
    to: string;
    totals: {
        commission_ghs: number;
        sale_volume_ghs: number;
        seller_payout_ghs: number;
        transaction_count: number;
    };
    pending: {
        commission_ghs: number;
        sale_volume_ghs: number;
        seller_payout_ghs: number;
        count: number;
    };
    daily: Array<{
        date: string;
        commission_ghs: number;
        sale_volume_ghs: number;
        seller_payout_ghs: number;
        count: number;
    }>;
}

function isoDateDaysAgo(days: number): string {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - days);
    return d.toISOString().slice(0, 10);
}

function todayIso(): string {
    return new Date().toISOString().slice(0, 10);
}

function formatMoney(value: number | null | undefined): string {
    if (value == null || !Number.isFinite(Number(value))) return '—';
    return `₵${Number(value).toFixed(2)}`;
}

const TABS = ['', 'submitted', 'under_review', 'changes_requested', 'listed', 'delisted', 'sold', 'paid_out', 'rejected'] as const;
const FINANCIAL_STATUSES = new Set(['sold', 'paid_out']);
const NON_DELETABLE_STATUSES = new Set(['sold', 'paid_out']);

export default function AdminConsignmentsPage() {
    const { confirm, confirmDialog } = useConfirmDialog();
    const [rows, setRows] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('submitted');
    const [searchTerm, setSearchTerm] = useState('');
    const [selected, setSelected] = useState<Submission | null>(null);
    const [approveForm, setApproveForm] = useState({
        approved_price: '',
        commission_pct: '20',
        compare_price: '',
        stock_quantity: '1',
    });
    const [rejectReason, setRejectReason] = useState('');
    const [changesNote, setChangesNote] = useState('');
    const [delistReason, setDelistReason] = useState('');
    const [modal, setModal] = useState<'approve' | 'reject' | 'changes' | 'view' | 'delist' | null>(null);
    const [processing, setProcessing] = useState(false);
    const [platformSettings, setPlatformSettings] = useState({
        default_commission_pct: '20',
        sell_for_me_enabled: true,
        auto_release_days_after_shipped: '0',
    });
    const [savingSettings, setSavingSettings] = useState(false);
    const [commissionFrom, setCommissionFrom] = useState(isoDateDaysAgo(29));
    const [commissionTo, setCommissionTo] = useState(todayIso());
    const [commissionStats, setCommissionStats] = useState<CommissionStats | null>(null);
    const [loadingCommission, setLoadingCommission] = useState(true);
    const [chartMounted, setChartMounted] = useState(false);

    useEffect(() => {
        setChartMounted(true);
    }, []);

    const fetchCommissionStats = async (from = commissionFrom, to = commissionTo) => {
        setLoadingCommission(true);
        try {
            const { data } = await api.get('/consignment/admin/commission-stats', { params: { from, to } });
            setCommissionStats(data);
        } catch {
            toast.error('Failed to load commission stats');
        } finally {
            setLoadingCommission(false);
        }
    };

    const commissionChartData = useMemo(() => {
        if (!commissionStats?.daily?.length) return [];
        return commissionStats.daily.map((row) => ({
            name: row.date.slice(8, 10),
            fullDate: row.date,
            commission: row.commission_ghs,
            sales: row.sale_volume_ghs,
            count: row.count,
        }));
    }, [commissionStats]);

    const hasCommissionChart = commissionChartData.some((d) => d.commission > 0);
    const showFinancialColumns = statusFilter === '' || FINANCIAL_STATUSES.has(statusFilter);

    const fetchRows = async () => {
        setLoading(true);
        try {
            const params = statusFilter ? { status: statusFilter } : {};
            const { data } = await api.get('/consignment/admin/list', { params });
            setRows(Array.isArray(data) ? data : []);
        } catch {
            toast.error('Failed to load consignments');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRows();
        api.get('/consignment/admin/settings')
            .then(({ data }) => {
                setPlatformSettings({
                    default_commission_pct: String(data.default_commission_pct ?? 20),
                    sell_for_me_enabled: data.sell_for_me_enabled !== false,
                    auto_release_days_after_shipped: String(data.auto_release_days_after_shipped ?? 0),
                });
                setApproveForm((f) => ({ ...f, commission_pct: String(data.default_commission_pct ?? 20) }));
            })
            .catch(() => {});
    }, [statusFilter]);

    useEffect(() => {
        fetchCommissionStats();
    }, []);

    const userName = (s: Submission) => {
        const p = s.user?.profile;
        if (p?.first_name || p?.last_name) return `${p.first_name || ''} ${p.last_name || ''}`.trim();
        return s.user?.email ?? '—';
    };

    const filtered = rows.filter((s) => {
        if (!searchTerm.trim()) return true;
        const q = searchTerm.toLowerCase();
        return (
            s.name.toLowerCase().includes(q) ||
            s.submission_number.toLowerCase().includes(q) ||
            userName(s).toLowerCase().includes(q)
        );
    });

    const openApprove = (s: Submission) => {
        setSelected(s);
        setApproveForm({
            approved_price: String(Number(s.asking_price)),
            commission_pct: platformSettings.default_commission_pct,
            compare_price: '',
            stock_quantity: String(s.stock_quantity ?? 1),
        });
        setModal('approve');
    };

    const savePlatformSettings = async () => {
        setSavingSettings(true);
        try {
            const { data } = await api.patch('/consignment/admin/settings', {
                default_commission_pct: parseFloat(platformSettings.default_commission_pct),
                sell_for_me_enabled: platformSettings.sell_for_me_enabled,
                auto_release_days_after_shipped: parseInt(platformSettings.auto_release_days_after_shipped, 10) || 0,
            });
            setPlatformSettings({
                default_commission_pct: String(data.default_commission_pct ?? 20),
                sell_for_me_enabled: data.sell_for_me_enabled !== false,
                auto_release_days_after_shipped: String(data.auto_release_days_after_shipped ?? 0),
            });
            toast.success('Sell for Me settings saved');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to save settings');
        } finally {
            setSavingSettings(false);
        }
    };

    const handleApprove = async () => {
        if (!selected) return;
        const stockQty = parseInt(approveForm.stock_quantity, 10);
        if (!Number.isFinite(stockQty) || stockQty < 1) {
            toast.error('Stock quantity must be at least 1');
            return;
        }
        setProcessing(true);
        try {
            const payload: Record<string, number | string> = {};
            const price = parseFloat(approveForm.approved_price);
            const commission = parseFloat(approveForm.commission_pct);
            const stockQty = parseInt(approveForm.stock_quantity, 10);
            if (Number.isFinite(price)) payload.approved_price = price;
            if (Number.isFinite(commission)) payload.commission_pct = commission;
            if (Number.isFinite(stockQty) && stockQty >= 1) payload.stock_quantity = stockQty;
            if (approveForm.compare_price) {
                const cp = parseFloat(approveForm.compare_price);
                if (Number.isFinite(cp)) payload.compare_price = cp;
            }
            const { data } = await api.patch(`/consignment/admin/${selected.id}/approve`, payload);
            toast.success(`Live on shop: /products/${data.product.slug}`);
            setModal(null);
            setSelected(null);
            fetchRows();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Approve failed');
        } finally {
            setProcessing(false);
        }
    };

    const handleReject = async () => {
        if (!selected || !rejectReason.trim()) {
            toast.error('Rejection reason required');
            return;
        }
        setProcessing(true);
        try {
            await api.patch(`/consignment/admin/${selected.id}/reject`, { rejection_reason: rejectReason.trim() });
            toast.success('Listing rejected');
            setModal(null);
            setSelected(null);
            setRejectReason('');
            fetchRows();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Reject failed');
        } finally {
            setProcessing(false);
        }
    };

    const handleRequestChanges = async () => {
        if (!selected || !changesNote.trim()) return;
        setProcessing(true);
        try {
            await api.patch(`/consignment/admin/${selected.id}/request-changes`, { admin_notes: changesNote.trim() });
            toast.success('Changes requested');
            setModal(null);
            setChangesNote('');
            fetchRows();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed');
        } finally {
            setProcessing(false);
        }
    };

    const handleDelist = async () => {
        if (!selected) return;
        setProcessing(true);
        try {
            await api.patch(`/consignment/admin/${selected.id}/delist`, {
                reason: delistReason.trim() || undefined,
            });
            toast.success('Listing removed from shop');
            setModal(null);
            setSelected(null);
            setDelistReason('');
            fetchRows();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Delist failed');
        } finally {
            setProcessing(false);
        }
    };

    const handleRelist = async (id: number) => {
        setProcessing(true);
        try {
            await api.patch(`/consignment/admin/${id}/relist`);
            toast.success('Listing is live on the shop again');
            fetchRows();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Re-list failed');
        } finally {
            setProcessing(false);
        }
    };

    const handleReview = async (id: number) => {
        try {
            await api.patch(`/consignment/admin/${id}/review`);
            toast.success('Marked under review');
            fetchRows();
        } catch {
            toast.error('Failed to update');
        }
    };

    const handleDelete = async (s: Submission) => {
        if (NON_DELETABLE_STATUSES.has(s.status)) {
            toast.error('Cannot delete listings with sales or payout history');
            return;
        }
        const label = s.name || s.submission_number;
        const ok = await confirm({
            title: `Permanently delete "${label}"?`,
            description: 'This removes the listing and shop product if present.',
            confirmLabel: 'Delete',
        });
        if (!ok) {
            return;
        }
        setProcessing(true);
        try {
            await api.delete(`/consignment/admin/${s.id}`);
            toast.success('Listing deleted');
            if (selected?.id === s.id) {
                setModal(null);
                setSelected(null);
            }
            fetchRows();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Delete failed');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <DashboardLayout isAdmin={true}>
            <div className="pb-6 md:pb-8">
                <AdminPageHeader
                    icon={Tag}
                    title="Sell for Me"
                    subtitle="Review listings — approve to publish live on the shop automatically"
                    actions={
                        <AdminToolbar
                            searchValue={searchTerm}
                            onSearchChange={setSearchTerm}
                            searchPlaceholder="Search listings…"
                            searchAriaLabel="Search listings"
                        />
                    }
                />

                <div className="admin-card p-5 mb-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-brand/5 blur-[60px] pointer-events-none" />
                    <div className="relative z-10">
                        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-4">
                            <div>
                                <p className="text-xs font-semibold text-gray-500 mb-0.5 flex items-center gap-1.5">
                                    <TrendingUp className="h-3.5 w-3.5" aria-hidden />
                                    Platform commission
                                </p>
                                <p className="text-base font-bold text-gray-900">Earned when escrow is released to sellers</p>
                            </div>
                            <div className="flex flex-wrap items-end gap-2">
                                <div>
                                    <label className="text-[10px] font-semibold text-gray-500 block mb-1">From</label>
                                    <Input
                                        type="date"
                                        value={commissionFrom}
                                        onChange={(e) => setCommissionFrom(e.target.value)}
                                        className="h-9 min-h-[36px] text-xs"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-semibold text-gray-500 block mb-1">To</label>
                                    <Input
                                        type="date"
                                        value={commissionTo}
                                        onChange={(e) => setCommissionTo(e.target.value)}
                                        className="h-9 min-h-[36px] text-xs"
                                    />
                                </div>
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => fetchCommissionStats(commissionFrom, commissionTo)}
                                    loading={loadingCommission}
                                    disabled={loadingCommission}
                                    leftIcon={<Calendar className="h-3.5 w-3.5" aria-hidden />}
                                >
                                    Apply
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                            <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3">
                                <p className="text-[10px] font-semibold text-blue-700 uppercase tracking-wide">Commission earned</p>
                                <p className="text-xl font-bold text-blue-900 mt-1">
                                    {loadingCommission ? '—' : formatMoney(commissionStats?.totals.commission_ghs)}
                                </p>
                                <p className="text-[10px] text-blue-600 mt-0.5">
                                    {loadingCommission ? '' : `${commissionStats?.totals.transaction_count ?? 0} releases`}
                                </p>
                            </div>
                            <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-3">
                                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Gross sales</p>
                                <p className="text-xl font-bold text-gray-900 mt-1">
                                    {loadingCommission ? '—' : formatMoney(commissionStats?.totals.sale_volume_ghs)}
                                </p>
                            </div>
                            <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-3">
                                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Seller payouts</p>
                                <p className="text-xl font-bold text-gray-900 mt-1">
                                    {loadingCommission ? '—' : formatMoney(commissionStats?.totals.seller_payout_ghs)}
                                </p>
                            </div>
                            <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-3">
                                <p className="text-[10px] font-semibold text-amber-800 uppercase tracking-wide">Pending in escrow</p>
                                <p className="text-xl font-bold text-amber-900 mt-1">
                                    {loadingCommission ? '—' : formatMoney(commissionStats?.pending.commission_ghs)}
                                </p>
                                <p className="text-[10px] text-amber-700 mt-0.5">
                                    {loadingCommission ? '' : `${commissionStats?.pending.count ?? 0} sold · not released yet`}
                                </p>
                            </div>
                        </div>

                        <div className="w-full" style={{ minHeight: 200 }}>
                            {loadingCommission ? (
                                <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">Loading chart…</div>
                            ) : !hasCommissionChart ? (
                                <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">
                                    No commission releases in this period
                                </div>
                            ) : (
                                <div className="h-[200px] w-full min-w-0">
                                    {chartMounted && (
                                    <ResponsiveContainer width="100%" height={200} minWidth={200}>
                                        <AreaChart data={commissionChartData}>
                                            <defs>
                                                <linearGradient id="colorCommission" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.15} />
                                                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis
                                                dataKey="name"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                                                dy={10}
                                            />
                                            <YAxis hide />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: '#111827',
                                                    border: 'none',
                                                    borderRadius: '12px',
                                                    padding: '10px 12px',
                                                }}
                                                formatter={(value) => [`₵${Number(value ?? 0).toFixed(2)}`, 'Commission']}
                                                labelFormatter={(_, payload) => {
                                                    const row = payload?.[0]?.payload;
                                                    return row?.fullDate ?? '';
                                                }}
                                                labelStyle={{ color: '#9ca3af', fontSize: '10px' }}
                                                itemStyle={{ color: '#fff', fontSize: '10px', fontWeight: '600' }}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="commission"
                                                stroke="#7c3aed"
                                                strokeWidth={3}
                                                fillOpacity={1}
                                                fill="url(#colorCommission)"
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                    {TABS.map((tab) => (
                        <Button
                            key={tab || 'all'}
                            type="button"
                            size="sm"
                            variant={statusFilter === tab ? 'primary' : 'secondary'}
                            onClick={() => setStatusFilter(tab)}
                            className="capitalize"
                        >
                            {tab === '' ? 'All' : tab.replace(/_/g, ' ')}
                        </Button>
                    ))}
                </div>

                <div className="admin-card p-4 mb-4 flex flex-col sm:flex-row sm:items-end gap-4 justify-between">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
                        <FormField label="Default commission %">
                            <Input
                                type="number"
                                step="0.1"
                                className="max-w-[140px]"
                                value={platformSettings.default_commission_pct}
                                onChange={(e) => setPlatformSettings({ ...platformSettings, default_commission_pct: e.target.value })}
                            />
                        </FormField>
                        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer pt-6">
                            <input
                                type="checkbox"
                                checked={platformSettings.sell_for_me_enabled}
                                onChange={(e) => setPlatformSettings({ ...platformSettings, sell_for_me_enabled: e.target.checked })}
                                className="rounded border-gray-300 text-brand focus:ring-brand"
                            />
                            Accept new submissions
                        </label>
                        <FormField
                            label="Auto-release after shipped (days)"
                            hint="0 = disabled. When set, auto-release also runs daily at 3:00 UTC; admins can trigger manually from Escrow payouts."
                        >
                            <Input
                                type="number"
                                min={0}
                                max={365}
                                className="max-w-[140px]"
                                value={platformSettings.auto_release_days_after_shipped}
                                onChange={(e) => setPlatformSettings({ ...platformSettings, auto_release_days_after_shipped: e.target.value })}
                            />
                        </FormField>
                    </div>
                    <Button
                        type="button"
                        size="sm"
                        onClick={savePlatformSettings}
                        loading={savingSettings}
                        disabled={savingSettings}
                        className="shrink-0"
                    >
                        Save settings
                    </Button>
                </div>

                <AdminTable>
                    <AdminTableHead>
                        <AdminTh>Listing</AdminTh>
                        <AdminTh>Consignor</AdminTh>
                        <AdminTh>Price</AdminTh>
                        <AdminTh>Stock</AdminTh>
                        {showFinancialColumns && (
                            <>
                                <AdminTh>Sale</AdminTh>
                                <AdminTh>Commission</AdminTh>
                                <AdminTh>Seller</AdminTh>
                            </>
                        )}
                        <AdminTh>Status</AdminTh>
                        <AdminTh align="right">Actions</AdminTh>
                    </AdminTableHead>
                    <AdminTableBody>
                        {loading ? (
                            <AdminTableLoading colSpan={showFinancialColumns ? 9 : 6} />
                        ) : filtered.length === 0 ? (
                            <AdminTableEmpty
                                colSpan={showFinancialColumns ? 9 : 6}
                                icon={<Tag className="h-10 w-10 mx-auto mb-2 text-gray-200" />}
                                message="No listings"
                            />
                        ) : (
                            filtered.map((s) => (
                                <AdminTr key={s.id}>
                                    <AdminTd>
                                        <p className="text-xs font-semibold text-gray-900">{s.name}</p>
                                        <p className="text-[10px] text-gray-500">{s.submission_number} · {s.category?.name} · Qty {s.stock_quantity ?? 1}</p>
                                    </AdminTd>
                                    <AdminTd className="text-xs text-gray-700">{userName(s)}</AdminTd>
                                    <AdminTd className="text-xs font-semibold">₵{Number(s.asking_price).toFixed(2)}</AdminTd>
                                    <AdminTd className="text-xs text-gray-700 tabular-nums">{s.stock_quantity ?? 1}</AdminTd>
                                    {showFinancialColumns && (
                                        <>
                                            <AdminTd className="text-xs font-semibold text-gray-900">
                                                {FINANCIAL_STATUSES.has(s.status) ? formatMoney(s.sale_amount_ghs) : '—'}
                                            </AdminTd>
                                            <AdminTd>
                                                {FINANCIAL_STATUSES.has(s.status) && s.commission_ghs != null ? (
                                                    <div>
                                                        <p className="text-xs font-semibold text-blue-700">{formatMoney(s.commission_ghs)}</p>
                                                        <p className="text-[10px] text-gray-500">{Number(s.commission_pct ?? 0).toFixed(1)}%</p>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-400">—</span>
                                                )}
                                            </AdminTd>
                                            <AdminTd className="text-xs font-semibold text-gray-700">
                                                {FINANCIAL_STATUSES.has(s.status) ? formatMoney(s.seller_payout_ghs) : '—'}
                                            </AdminTd>
                                        </>
                                    )}
                                    <AdminTd>
                                        <StatusBadge status={s.status} />
                                    </AdminTd>
                                    <AdminTd className="text-right">
                                        <div className="flex justify-end gap-1 flex-wrap">
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => { setSelected(s); setModal('view'); }}
                                                leftIcon={<Eye className="h-3 w-3" />}
                                                className="h-8 min-h-[32px] px-2 text-xs"
                                            >
                                                View
                                            </Button>
                                            {s.product?.slug && (
                                                <Link
                                                    href={`/products/${s.product.slug}`}
                                                    target="_blank"
                                                    className="px-2 py-1 text-[10px] font-semibold rounded-lg border border-blue-300 text-blue-600 inline-flex items-center gap-1"
                                                >
                                                    Shop <ExternalLink className="h-3 w-3" />
                                                </Link>
                                            )}
                                            {s.status === 'delisted' && (
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    disabled={processing}
                                                    onClick={() => handleRelist(s.id)}
                                                    className="h-8 min-h-[32px] px-2 text-xs bg-emerald-600 hover:bg-emerald-700"
                                                >
                                                    Re-list
                                                </Button>
                                            )}
                                            {s.status === 'listed' && (
                                                <Button
                                                    type="button"
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => { setSelected(s); setDelistReason(''); setModal('delist'); }}
                                                    className="h-8 min-h-[32px] px-2 text-xs"
                                                >
                                                    Delist
                                                </Button>
                                            )}
                                            {['submitted', 'changes_requested'].includes(s.status) && (
                                                <Button
                                                    type="button"
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => handleReview(s.id)}
                                                    className="h-8 min-h-[32px] px-2 text-xs"
                                                >
                                                    Review
                                                </Button>
                                            )}
                                            {['submitted', 'under_review', 'changes_requested'].includes(s.status) && (
                                                <>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        onClick={() => openApprove(s)}
                                                        className="h-8 min-h-[32px] px-2 text-xs bg-emerald-600 hover:bg-emerald-700"
                                                    >
                                                        Approve
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="secondary"
                                                        size="sm"
                                                        onClick={() => { setSelected(s); setChangesNote(s.admin_notes || ''); setModal('changes'); }}
                                                        className="h-8 min-h-[32px] px-2 text-xs bg-amber-50 text-amber-800 border-amber-100 hover:bg-amber-100"
                                                    >
                                                        Changes
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="danger"
                                                        size="sm"
                                                        onClick={() => { setSelected(s); setModal('reject'); }}
                                                        className="h-8 min-h-[32px] px-2 text-xs"
                                                    >
                                                        Reject
                                                    </Button>
                                                </>
                                            )}
                                            {!NON_DELETABLE_STATUSES.has(s.status) && (
                                                <Button
                                                    type="button"
                                                    variant="danger"
                                                    size="sm"
                                                    disabled={processing}
                                                    onClick={() => void handleDelete(s)}
                                                    leftIcon={<Trash2 className="h-3 w-3" />}
                                                    className="h-8 min-h-[32px] px-2 text-xs"
                                                >
                                                    Delete
                                                </Button>
                                            )}
                                        </div>
                                    </AdminTd>
                                </AdminTr>
                            ))
                        )}
                    </AdminTableBody>
                </AdminTable>

                <Modal
                    open={!!(modal && selected)}
                    onClose={() => {
                        if (!processing) setModal(null);
                    }}
                    size={modal === 'approve' || modal === 'view' ? 'lg' : 'md'}
                    title={
                        modal === 'view'
                            ? selected?.name
                            : modal === 'approve'
                              ? 'Approve & publish'
                              : modal === 'reject'
                                ? 'Reject listing'
                                : modal === 'changes'
                                  ? 'Request changes'
                                  : modal === 'delist'
                                    ? 'Remove from shop'
                                    : undefined
                    }
                    description={
                        modal === 'view'
                            ? selected?.submission_number
                            : modal === 'approve'
                              ? 'Creates a live product on /shop immediately.'
                              : modal === 'delist'
                                ? 'Takes the product offline. The consignor can contact support to re-list.'
                                : undefined
                    }
                    footer={
                        modal === 'view' ? undefined : modal === 'approve' ? (
                            <>
                                <Button type="button" variant="secondary" size="sm" disabled={processing} onClick={() => setModal(null)}>
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    loading={processing}
                                    disabled={processing}
                                    onClick={handleApprove}
                                    className="bg-emerald-600 hover:bg-emerald-700"
                                >
                                    Approve & go live
                                </Button>
                            </>
                        ) : modal === 'reject' ? (
                            <>
                                <Button type="button" variant="secondary" size="sm" disabled={processing} onClick={() => setModal(null)}>
                                    Cancel
                                </Button>
                                <Button type="button" variant="danger" size="sm" loading={processing} disabled={processing} onClick={handleReject}>
                                    Reject
                                </Button>
                            </>
                        ) : modal === 'changes' ? (
                            <Button type="button" size="sm" loading={processing} disabled={processing} onClick={handleRequestChanges}>
                                Send
                            </Button>
                        ) : modal === 'delist' ? (
                            <>
                                <Button type="button" variant="secondary" size="sm" onClick={() => setModal(null)}>
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    loading={processing}
                                    disabled={processing}
                                    onClick={handleDelist}
                                    className="bg-gray-800 hover:bg-gray-900"
                                >
                                    Delist from shop
                                </Button>
                            </>
                        ) : undefined
                    }
                >
                    {modal === 'view' && selected && (
                        <>
                            {Array.isArray(selected.images) && selected.images.length > 0 && (
                                <div className="flex gap-2 flex-wrap mb-4">
                                    {selected.images.map((img, i) => (
                                        <img key={i} src={getMediaUrl(img)} alt="" className="w-16 h-16 rounded-lg object-cover border" />
                                    ))}
                                </div>
                            )}
                            <p className="text-sm text-gray-700 whitespace-pre-wrap mb-3">{selected.description}</p>
                            <p className="text-xs text-gray-500 mb-1"><strong>Pickup:</strong> {selected.pickup_details}</p>
                            <p className="text-xs text-gray-500 mb-1"><strong>Stock:</strong> {selected.stock_quantity ?? 1} unit{(selected.stock_quantity ?? 1) === 1 ? '' : 's'}</p>
                            <p className="text-xs text-gray-500"><strong>Consignor:</strong> {userName(selected)} · {selected.user?.email}</p>
                        </>
                    )}

                    {modal === 'approve' && (
                        <div className="space-y-3">
                            <FormField label="Sale price (GHS)">
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={approveForm.approved_price}
                                    onChange={(e) => setApproveForm({ ...approveForm, approved_price: e.target.value })}
                                />
                            </FormField>
                            <FormField label="Commission %">
                                <Input
                                    type="number"
                                    step="0.1"
                                    value={approveForm.commission_pct}
                                    onChange={(e) => setApproveForm({ ...approveForm, commission_pct: e.target.value })}
                                />
                            </FormField>
                            <FormField label="Stock quantity" hint="Units available on the shop after approval">
                                <Input
                                    type="number"
                                    min={1}
                                    step={1}
                                    value={approveForm.stock_quantity}
                                    onChange={(e) => setApproveForm({ ...approveForm, stock_quantity: e.target.value })}
                                />
                            </FormField>
                            <FormField label="Compare price (optional)">
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={approveForm.compare_price}
                                    onChange={(e) => setApproveForm({ ...approveForm, compare_price: e.target.value })}
                                />
                            </FormField>
                        </div>
                    )}

                    {modal === 'reject' && (
                        <FormField label="Rejection reason" htmlFor="reject-reason" required>
                            <Textarea
                                id="reject-reason"
                                placeholder="Reason for rejection"
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                            />
                        </FormField>
                    )}

                    {modal === 'changes' && (
                        <FormField label="Notes for consignor" htmlFor="changes-note">
                            <Textarea
                                id="changes-note"
                                value={changesNote}
                                onChange={(e) => setChangesNote(e.target.value)}
                            />
                        </FormField>
                    )}

                    {modal === 'delist' && (
                        <FormField label="Note to consignor (optional)" htmlFor="delist-reason">
                            <Textarea
                                id="delist-reason"
                                placeholder="Optional note to consignor"
                                value={delistReason}
                                onChange={(e) => setDelistReason(e.target.value)}
                            />
                        </FormField>
                    )}
                </Modal>
            </div>
            {confirmDialog}
        </DashboardLayout>
    );
}
