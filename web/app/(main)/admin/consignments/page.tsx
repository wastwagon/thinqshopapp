'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { getMediaUrl } from '@/lib/media';
import toast from 'react-hot-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import Link from 'next/link';
import { Tag, Search, CheckCircle, XCircle, Eye, ExternalLink } from 'lucide-react';

interface Submission {
    id: number;
    submission_number: string;
    name: string;
    description?: string;
    asking_price: number | string;
    approved_price?: number | string;
    commission_pct?: number | string;
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

const TABS = ['', 'submitted', 'under_review', 'changes_requested', 'listed', 'delisted', 'sold', 'paid_out', 'rejected'] as const;

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
                                    <th className="admin-th">Status</th>
                                    <th className="admin-th text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr><td colSpan={5} className="py-10 text-center text-sm text-gray-500">Loading…</td></tr>
                                ) : filtered.length === 0 ? (
                                    <tr><td colSpan={5} className="py-10 text-center text-sm text-gray-500">No listings</td></tr>
                                ) : (
                                    filtered.map((s) => (
                                        <tr key={s.id} className="hover:bg-gray-50/50">
                                            <td className="px-3 py-2.5">
                                                <p className="text-xs font-semibold text-gray-900">{s.name}</p>
                                                <p className="text-[10px] text-gray-500">{s.submission_number} · {s.category?.name}</p>
                                            </td>
                                            <td className="px-3 py-2.5 text-xs text-gray-700">{userName(s)}</td>
                                            <td className="px-3 py-2.5 text-xs font-semibold">₵{Number(s.asking_price).toFixed(2)}</td>
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
