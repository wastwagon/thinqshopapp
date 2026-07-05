'use client';

import React, { useEffect, useMemo, useState } from 'react';
import api from '@/lib/axios';
import { getMediaUrl } from '@/lib/media';
import toast from 'react-hot-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import Link from 'next/link';
import { Tag, Search, CheckCircle, XCircle, Eye, ExternalLink, TrendingUp, Calendar } from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';

interface Submission {
    id: number;
    submission_number: string;
    name: string;
    description?: string;
    asking_price: number | string;
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

export default function AdminConsignmentsPage() {
    const [rows, setRows] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('submitted');
    const [searchTerm, setSearchTerm] = useState('');
    const [selected, setSelected] = useState<Submission | null>(null);
    const [approveForm, setApproveForm] = useState({
        approved_price: '',
        commission_pct: '20',
        compare_price: '',
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
        setProcessing(true);
        try {
            const payload: Record<string, number | string> = {};
            const price = parseFloat(approveForm.approved_price);
            const commission = parseFloat(approveForm.commission_pct);
            if (Number.isFinite(price)) payload.approved_price = price;
            if (Number.isFinite(commission)) payload.commission_pct = commission;
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

    return (
        <DashboardLayout isAdmin={true}>
            <div className="pb-6 md:pb-8">
                <AdminPageHeader
                    icon={Tag}
                    title="Sell for Me"
                    subtitle="Review listings — approve to publish live on the shop automatically"
                    actions={
                        <div className="relative min-w-0 sm:w-56">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" aria-hidden />
                            <input
                                type="search"
                                placeholder="Search listings..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="admin-input w-full sm:w-56 pl-8"
                            />
                        </div>
                    }
                />

                <div className="admin-card p-5 mb-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-violet-500/5 blur-[60px] pointer-events-none" />
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
                                    <input
                                        type="date"
                                        value={commissionFrom}
                                        onChange={(e) => setCommissionFrom(e.target.value)}
                                        className="admin-input h-9 text-xs"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-semibold text-gray-500 block mb-1">To</label>
                                    <input
                                        type="date"
                                        value={commissionTo}
                                        onChange={(e) => setCommissionTo(e.target.value)}
                                        className="admin-input h-9 text-xs"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => fetchCommissionStats(commissionFrom, commissionTo)}
                                    disabled={loadingCommission}
                                    className="admin-btn-primary h-9 px-4 text-xs disabled:opacity-50 inline-flex items-center gap-1.5"
                                >
                                    <Calendar className="h-3.5 w-3.5" aria-hidden />
                                    {loadingCommission ? 'Loading…' : 'Apply'}
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                            <div className="rounded-xl border border-violet-100 bg-violet-50/60 p-3">
                                <p className="text-[10px] font-semibold text-violet-700 uppercase tracking-wide">Commission earned</p>
                                <p className="text-xl font-bold text-violet-900 mt-1">
                                    {loadingCommission ? '—' : formatMoney(commissionStats?.totals.commission_ghs)}
                                </p>
                                <p className="text-[10px] text-violet-600 mt-0.5">
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
                                <div className="h-[200px] w-full">
                                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={100}>
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
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                    {TABS.map((tab) => (
                        <button
                            key={tab || 'all'}
                            type="button"
                            onClick={() => setStatusFilter(tab)}
                            className={`h-8 px-3 rounded-lg text-xs font-semibold border ${
                                statusFilter === tab ? 'bg-brand text-white border-brand' : 'bg-white text-gray-600 border-gray-200'
                            }`}
                        >
                            {tab === '' ? 'All' : tab.replace(/_/g, ' ')}
                        </button>
                    ))}
                </div>

                <div className="admin-card p-4 mb-4 flex flex-col sm:flex-row sm:items-end gap-4 justify-between">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
                        <div>
                            <label className="text-xs font-semibold text-gray-500 block mb-1">Default commission %</label>
                            <input
                                type="number"
                                step="0.1"
                                className="admin-input w-full max-w-[140px]"
                                value={platformSettings.default_commission_pct}
                                onChange={(e) => setPlatformSettings({ ...platformSettings, default_commission_pct: e.target.value })}
                            />
                        </div>
                        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer pt-6">
                            <input
                                type="checkbox"
                                checked={platformSettings.sell_for_me_enabled}
                                onChange={(e) => setPlatformSettings({ ...platformSettings, sell_for_me_enabled: e.target.checked })}
                                className="rounded border-gray-300 text-brand focus:ring-brand"
                            />
                            Accept new submissions
                        </label>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 block mb-1">Auto-release after shipped (days)</label>
                            <input
                                type="number"
                                min={0}
                                max={365}
                                className="admin-input w-full max-w-[140px]"
                                value={platformSettings.auto_release_days_after_shipped}
                                onChange={(e) => setPlatformSettings({ ...platformSettings, auto_release_days_after_shipped: e.target.value })}
                            />
                            <p className="text-[10px] text-gray-400 mt-1">0 = disabled. When set, auto-release also runs daily at 3:00 UTC; admins can trigger manually from Escrow payouts.</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={savePlatformSettings}
                        disabled={savingSettings}
                        className="admin-btn-primary h-9 px-4 shrink-0 disabled:opacity-50"
                    >
                        {savingSettings ? 'Saving…' : 'Save settings'}
                    </button>
                </div>

                <div className="admin-table-wrap">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-50">
                                    <th className="admin-th">Listing</th>
                                    <th className="admin-th">Consignor</th>
                                    <th className="admin-th">Price</th>
                                    {showFinancialColumns && (
                                        <>
                                            <th className="admin-th">Sale</th>
                                            <th className="admin-th">Commission</th>
                                            <th className="admin-th">Seller</th>
                                        </>
                                    )}
                                    <th className="admin-th">Status</th>
                                    <th className="admin-th text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr><td colSpan={showFinancialColumns ? 8 : 5} className="py-10 text-center text-sm text-gray-500">Loading…</td></tr>
                                ) : filtered.length === 0 ? (
                                    <tr><td colSpan={showFinancialColumns ? 8 : 5} className="py-10 text-center text-sm text-gray-500">No listings</td></tr>
                                ) : (
                                    filtered.map((s) => (
                                        <tr key={s.id} className="hover:bg-gray-50/50">
                                            <td className="px-3 py-2.5">
                                                <p className="text-xs font-semibold text-gray-900">{s.name}</p>
                                                <p className="text-[10px] text-gray-500">{s.submission_number} · {s.category?.name}</p>
                                            </td>
                                            <td className="px-3 py-2.5 text-xs text-gray-700">{userName(s)}</td>
                                            <td className="px-3 py-2.5 text-xs font-semibold">₵{Number(s.asking_price).toFixed(2)}</td>
                                            {showFinancialColumns && (
                                                <>
                                                    <td className="px-3 py-2.5 text-xs font-semibold text-gray-900">
                                                        {FINANCIAL_STATUSES.has(s.status) ? formatMoney(s.sale_amount_ghs) : '—'}
                                                    </td>
                                                    <td className="px-3 py-2.5">
                                                        {FINANCIAL_STATUSES.has(s.status) && s.commission_ghs != null ? (
                                                            <div>
                                                                <p className="text-xs font-semibold text-violet-700">{formatMoney(s.commission_ghs)}</p>
                                                                <p className="text-[10px] text-gray-500">{Number(s.commission_pct ?? 0).toFixed(1)}%</p>
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-gray-400">—</span>
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-2.5 text-xs font-semibold text-gray-700">
                                                        {FINANCIAL_STATUSES.has(s.status) ? formatMoney(s.seller_payout_ghs) : '—'}
                                                    </td>
                                                </>
                                            )}
                                            <td className="px-3 py-2.5">
                                                <span className="text-[10px] font-semibold capitalize px-2 py-0.5 rounded-md bg-gray-100 text-gray-700">
                                                    {s.status.replace(/_/g, ' ')}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2.5 text-right">
                                                <div className="flex justify-end gap-1 flex-wrap">
                                                    <button
                                                        type="button"
                                                        onClick={() => { setSelected(s); setModal('view'); }}
                                                        className="px-2 py-1 text-[10px] font-semibold rounded-lg border border-gray-200 text-gray-600"
                                                    >
                                                        <Eye className="h-3 w-3 inline" /> View
                                                    </button>
                                                    {s.product?.slug && (
                                                        <Link
                                                            href={`/products/${s.product.slug}`}
                                                            target="_blank"
                                                            className="px-2 py-1 text-[10px] font-semibold rounded-lg border border-brand/30 text-brand inline-flex items-center gap-1"
                                                        >
                                                            Shop <ExternalLink className="h-3 w-3" />
                                                        </Link>
                                                    )}
                                                    {s.status === 'delisted' && (
                                                        <button
                                                            type="button"
                                                            disabled={processing}
                                                            onClick={() => handleRelist(s.id)}
                                                            className="px-2 py-1 text-[10px] font-semibold rounded-lg bg-green-50 text-green-700 border border-green-100"
                                                        >
                                                            Re-list
                                                        </button>
                                                    )}
                                                    {s.status === 'listed' && (
                                                        <button
                                                            type="button"
                                                            onClick={() => { setSelected(s); setDelistReason(''); setModal('delist'); }}
                                                            className="px-2 py-1 text-[10px] font-semibold rounded-lg bg-gray-100 text-gray-700 border border-gray-200"
                                                        >
                                                            Delist
                                                        </button>
                                                    )}
                                                    {['submitted', 'changes_requested'].includes(s.status) && (
                                                        <button type="button" onClick={() => handleReview(s.id)} className="px-2 py-1 text-[10px] font-semibold rounded-lg bg-gray-100 text-gray-700">
                                                            Review
                                                        </button>
                                                    )}
                                                    {['submitted', 'under_review', 'changes_requested'].includes(s.status) && (
                                                        <>
                                                            <button type="button" onClick={() => openApprove(s)} className="px-2 py-1 text-[10px] font-semibold rounded-lg bg-green-50 text-green-700 border border-green-100">
                                                                Approve
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => { setSelected(s); setChangesNote(s.admin_notes || ''); setModal('changes'); }}
                                                                className="px-2 py-1 text-[10px] font-semibold rounded-lg bg-amber-50 text-amber-800 border border-amber-100"
                                                            >
                                                                Changes
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => { setSelected(s); setModal('reject'); }}
                                                                className="px-2 py-1 text-[10px] font-semibold rounded-lg bg-red-50 text-red-600 border border-red-100"
                                                            >
                                                                Reject
                                                            </button>
                                                        </>
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

                {modal && selected && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/40" onClick={() => !processing && setModal(null)} aria-hidden />
                        <div className="admin-modal-panel relative max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
                            {modal === 'view' && (
                                <>
                                    <h2 className="text-lg font-bold text-gray-900 mb-2">{selected.name}</h2>
                                    <p className="text-xs text-gray-500 mb-4">{selected.submission_number}</p>
                                    {Array.isArray(selected.images) && selected.images.length > 0 && (
                                        <div className="flex gap-2 flex-wrap mb-4">
                                            {selected.images.map((img, i) => (
                                                <img key={i} src={getMediaUrl(img)} alt="" className="w-16 h-16 rounded-lg object-cover border" />
                                            ))}
                                        </div>
                                    )}
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap mb-3">{selected.description}</p>
                                    <p className="text-xs text-gray-500 mb-1"><strong>Pickup:</strong> {selected.pickup_details}</p>
                                    <p className="text-xs text-gray-500"><strong>Consignor:</strong> {userName(selected)} · {selected.user?.email}</p>
                                    <button type="button" onClick={() => setModal(null)} className="mt-4 h-9 px-4 rounded-lg text-sm font-semibold bg-gray-100">Close</button>
                                </>
                            )}

                            {modal === 'approve' && (
                                <>
                                    <h2 className="text-lg font-bold text-gray-900 mb-1">Approve & publish</h2>
                                    <p className="text-xs text-gray-500 mb-4">Creates a live product on /shop immediately.</p>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-xs font-semibold text-gray-500">Sale price (GHS)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                className="admin-input w-full mt-1"
                                                value={approveForm.approved_price}
                                                onChange={(e) => setApproveForm({ ...approveForm, approved_price: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-gray-500">Commission %</label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                className="admin-input w-full mt-1"
                                                value={approveForm.commission_pct}
                                                onChange={(e) => setApproveForm({ ...approveForm, commission_pct: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-gray-500">Compare price (optional)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                className="admin-input w-full mt-1"
                                                value={approveForm.compare_price}
                                                onChange={(e) => setApproveForm({ ...approveForm, compare_price: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-2 mt-4">
                                        <button type="button" disabled={processing} onClick={handleApprove} className="flex-1 h-10 rounded-lg bg-green-600 text-white text-sm font-semibold disabled:opacity-50">
                                            {processing ? 'Publishing…' : 'Approve & go live'}
                                        </button>
                                        <button type="button" onClick={() => setModal(null)} className="h-10 px-4 rounded-lg bg-gray-100 text-sm font-semibold">Cancel</button>
                                    </div>
                                </>
                            )}

                            {modal === 'reject' && (
                                <>
                                    <h2 className="text-lg font-bold text-gray-900 mb-4">Reject listing</h2>
                                    <textarea
                                        className="w-full min-h-[80px] admin-input"
                                        placeholder="Reason for rejection"
                                        value={rejectReason}
                                        onChange={(e) => setRejectReason(e.target.value)}
                                    />
                                    <div className="flex gap-2 mt-4">
                                        <button type="button" disabled={processing} onClick={handleReject} className="flex-1 h-10 rounded-lg bg-red-600 text-white text-sm font-semibold">Reject</button>
                                        <button type="button" onClick={() => setModal(null)} className="h-10 px-4 rounded-lg bg-gray-100 text-sm">Cancel</button>
                                    </div>
                                </>
                            )}

                            {modal === 'changes' && (
                                <>
                                    <h2 className="text-lg font-bold text-gray-900 mb-4">Request changes</h2>
                                    <textarea
                                        className="w-full min-h-[80px] admin-input"
                                        value={changesNote}
                                        onChange={(e) => setChangesNote(e.target.value)}
                                    />
                                    <button type="button" disabled={processing} onClick={handleRequestChanges} className="mt-4 h-10 px-4 rounded-lg bg-brand text-white text-sm font-semibold">Send</button>
                                </>
                            )}

                            {modal === 'delist' && (
                                <>
                                    <h2 className="text-lg font-bold text-gray-900 mb-1">Remove from shop</h2>
                                    <p className="text-xs text-gray-500 mb-4">Takes the product offline. The consignor can contact support to re-list.</p>
                                    <textarea
                                        className="w-full min-h-[80px] admin-input"
                                        placeholder="Optional note to consignor"
                                        value={delistReason}
                                        onChange={(e) => setDelistReason(e.target.value)}
                                    />
                                    <div className="flex gap-2 mt-4">
                                        <button type="button" disabled={processing} onClick={handleDelist} className="flex-1 h-10 rounded-lg bg-gray-800 text-white text-sm font-semibold">
                                            {processing ? 'Removing…' : 'Delist from shop'}
                                        </button>
                                        <button type="button" onClick={() => setModal(null)} className="h-10 px-4 rounded-lg bg-gray-100 text-sm">Cancel</button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
