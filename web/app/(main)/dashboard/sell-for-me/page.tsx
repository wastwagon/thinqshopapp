'use client';

import { useState, useEffect, useRef } from 'react';
import api from '@/lib/axios';
import { getMediaUrl } from '@/lib/media';
import { Tag, Plus, Upload, Trash2, ChevronRight, Store, ImageIcon, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DashboardPageHeader from '@/components/dashboard/DashboardPageHeader';
import DashboardContent from '@/components/dashboard/DashboardContent';

interface Category {
    id: number;
    name: string;
    slug: string;
}

interface Submission {
    id: number;
    submission_number: string;
    name: string;
    asking_price: number | string;
    stock_quantity?: number;
    status: string;
    created_at: string;
    expected_payout_ghs?: number | string | null;
    escrow_on_hold?: boolean;
    escrow_hold_reason?: string | null;
    rejection_reason?: string;
    admin_notes?: string;
    product?: { slug: string; is_active: boolean } | null;
}

type LedgerEntry = {
    id: number;
    event_type: string;
    amount_ghs?: number | string | null;
    note?: string | null;
    created_at: string;
};

const LEDGER_LABELS: Record<string, string> = {
    locked: 'Escrow locked',
    hold_placed: 'Dispute hold',
    hold_released: 'Hold released',
    released: 'Payout released',
    voided: 'Sale voided',
    auto_released: 'Auto-released',
    clawback_pending: 'Clawback pending',
};

const CONDITION_OPTIONS = [
    { value: 'new', label: 'New' },
    { value: 'like_new', label: 'Like new' },
    { value: 'good', label: 'Good' },
    { value: 'fair', label: 'Fair' },
];

const STATUS_LABELS: Record<string, string> = {
    submitted: 'Submitted',
    under_review: 'Under review',
    changes_requested: 'Changes requested',
    listed: 'Live on shop',
    delisted: 'Taken offline',
    rejected: 'Rejected',
    sold: 'Sold · payout pending delivery',
    paid_out: 'Paid to wallet',
    sale_voided: 'Sale cancelled',
};

const USER_EDITABLE_STATUSES = new Set(['submitted', 'changes_requested', 'rejected', 'delisted', 'listed']);
const USER_DELETABLE_STATUSES = new Set(['submitted', 'under_review', 'changes_requested', 'rejected', 'delisted', 'listed']);

export default function SellForMePage() {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [serviceEnabled, setServiceEnabled] = useState(true);
    const [defaultCommissionPct, setDefaultCommissionPct] = useState(20);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [ledgerModal, setLedgerModal] = useState<{ id: number; name: string } | null>(null);
    const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
    const [ledgerLoading, setLedgerLoading] = useState(false);
    const [pendingClawback, setPendingClawback] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [form, setForm] = useState({
        name: '',
        category_id: '',
        description: '',
        short_description: '',
        asking_price: '',
        stock_quantity: '1',
        condition: 'good',
        brand: '',
        model: '',
        serial_number: '',
        pickup_details: '',
        images: [] as string[],
    });

    const openLedger = async (id: number, name: string) => {
        setLedgerModal({ id, name });
        setLedgerLoading(true);
        try {
            const { data } = await api.get(`/consignment/submissions/${id}/escrow-ledger`);
            setLedgerEntries(Array.isArray(data) ? data : []);
        } catch {
            toast.error('Could not load payout history');
            setLedgerEntries([]);
        } finally {
            setLedgerLoading(false);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const [subRes, catRes, settingsRes, clawRes] = await Promise.all([
                api.get('/consignment/submissions'),
                api.get('/products/categories'),
                api.get('/consignment/settings').catch(() => ({ data: { sell_for_me_enabled: true } })),
                api.get('/consignment/clawbacks').catch(() => ({ data: { pending_clawback_ghs: 0 } })),
            ]);
            setSubmissions(subRes.data);
            setCategories(Array.isArray(catRes.data) ? catRes.data : []);
            setServiceEnabled(settingsRes.data?.sell_for_me_enabled !== false);
            setDefaultCommissionPct(Number(settingsRes.data?.default_commission_pct ?? 20));
            setPendingClawback(Number(clawRes.data?.pending_clawback_ghs ?? 0));
        } catch {
            toast.error('Failed to load listings');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files?.length) return;
        setUploading(true);
        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                if (!file.type.startsWith('image/')) {
                    toast.error(`${file.name} is not an image`);
                    continue;
                }
                const formData = new FormData();
                formData.append('file', file);
                const { data } = await api.post('/consignment/upload-image', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                const path = data?.path ?? data?.url;
                if (path) setForm((prev) => ({ ...prev, images: [...prev.images, path] }));
            }
        } catch {
            toast.error('Upload failed');
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    const resetForm = () => {
        setForm({
            name: '',
            category_id: '',
            description: '',
            short_description: '',
            asking_price: '',
            stock_quantity: '1',
            condition: 'good',
            brand: '',
            model: '',
            serial_number: '',
            pickup_details: '',
            images: [],
        });
        setEditingId(null);
        setIsCreating(false);
    };

    const startEditing = async (id: number) => {
        try {
            const { data } = await api.get(`/consignment/submissions/${id}`);
            const specs = (data.specifications && typeof data.specifications === 'object') ? data.specifications as Record<string, string> : {};
            setForm({
                name: data.name || '',
                category_id: String(data.category_id || ''),
                description: data.description || '',
                short_description: data.short_description || '',
                asking_price: String(data.asking_price ?? ''),
                stock_quantity: String(data.stock_quantity ?? 1),
                condition: data.condition || 'good',
                brand: specs.brand || '',
                model: specs.model || '',
                serial_number: specs.serial_number || '',
                pickup_details: data.pickup_details || '',
                images: Array.isArray(data.images) ? data.images : [],
            });
            setEditingId(id);
            setIsCreating(true);
        } catch {
            toast.error('Failed to load listing for editing');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const categoryId = parseInt(form.category_id, 10);
        const price = parseFloat(form.asking_price);
        const stockQty = parseInt(form.stock_quantity, 10);
        if (!form.name.trim() || !categoryId || !form.description.trim()) {
            toast.error('Title, category, and description are required');
            return;
        }
        if (!Number.isFinite(price) || price < 1) {
            toast.error('Enter a valid asking price');
            return;
        }
        if (!Number.isFinite(stockQty) || stockQty < 1) {
            toast.error('Stock quantity must be at least 1');
            return;
        }
        if (form.images.length < 1) {
            toast.error('Upload at least one product image');
            return;
        }
        if (!form.pickup_details.trim()) {
            toast.error('Pickup / handover details are required');
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                name: form.name.trim(),
                category_id: categoryId,
                description: form.description.trim(),
                short_description: form.short_description.trim() || undefined,
                asking_price: price,
                stock_quantity: stockQty,
                condition: form.condition,
                images: form.images,
                pickup_details: form.pickup_details.trim(),
                brand: form.brand.trim() || undefined,
                model: form.model.trim() || undefined,
                serial_number: form.serial_number.trim() || undefined,
            };
            if (editingId) {
                await api.patch(`/consignment/submissions/${editingId}`, payload);
                const editingRow = submissions.find((s) => s.id === editingId);
                toast.success(
                    editingRow && editingRow.status === 'listed'
                        ? 'Listing updated on shop'
                        : 'Listing updated and resubmitted',
                );
            } else {
                await api.post('/consignment/submissions', payload);
                toast.success('Listing submitted for review');
            }
            resetForm();
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Submission failed');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (s: Submission) => {
        if (!USER_DELETABLE_STATUSES.has(s.status)) {
            toast.error('This listing cannot be deleted');
            return;
        }
        if (!window.confirm(`Delete "${s.name}"? This cannot be undone.`)) return;
        try {
            await api.delete(`/consignment/submissions/${s.id}`);
            toast.success('Listing deleted');
            if (editingId === s.id) resetForm();
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Delete failed');
        }
    };

    return (
        <DashboardLayout>
            <DashboardContent wide>
                <DashboardPageHeader
                    title="Sell for Me"
                    subtitle="List items for ThinQShop to sell — earnings go to your wallet"
                    accent="orange"
                    action={
                        <button
                            type="button"
                            onClick={() => setIsCreating(true)}
                            disabled={!serviceEnabled}
                            className="h-10 px-4 bg-blue-600 text-white rounded-xl font-semibold text-xs flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                            <Plus className="h-4 w-4" />
                            New listing
                        </button>
                    }
                />

                {!serviceEnabled && (
                    <div className="flat-card p-4 mb-4 border border-amber-200 bg-amber-50 text-sm text-amber-800">
                        Sell for Me is temporarily paused. Check back soon or contact support.
                    </div>
                )}

                {pendingClawback > 0 && (
                    <div className="flat-card p-4 mb-4 border border-amber-200 bg-amber-50/80 text-sm text-amber-900">
                        <p className="font-semibold">Payout adjustment due: ₵{pendingClawback.toFixed(2)}</p>
                        <p className="text-xs text-amber-800 mt-1">
                            A buyer refund occurred after a payout was credited. This reduces your withdrawable wallet balance.{' '}
                            <Link href="/dashboard/wallet" className="text-blue-600 font-semibold hover:underline">View wallet</Link>
                        </p>
                    </div>
                )}

                {isCreating && serviceEnabled && (
                    <div className="flat-card p-4 md:p-6 mb-6 border border-blue-200">
                        <h2 className="text-sm font-semibold text-gray-900 mb-1">
                            {editingId ? 'Update your listing' : 'Submit a product listing'}
                        </h2>
                        {!editingId && (
                            <p className="text-xs text-gray-500 mb-4">
                                ThinQShop keeps {defaultCommissionPct}% commission on successful sales. The rest is credited to your wallet after delivery.
                            </p>
                        )}
                        {editingId && <div className="mb-4" />}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-medium text-gray-600 block mb-1">Product title *</label>
                                    <input
                                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm"
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-600 block mb-1">Category *</label>
                                    <select
                                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm"
                                        value={form.category_id}
                                        onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                                        required
                                    >
                                        <option value="">Select category</option>
                                        {categories.map((c) => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-600 block mb-1">Asking price (GHS) *</label>
                                    <input
                                        type="number"
                                        min="1"
                                        step="0.01"
                                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm"
                                        value={form.asking_price}
                                        onChange={(e) => setForm({ ...form, asking_price: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-600 block mb-1">Stock (quantity) *</label>
                                    <input
                                        type="number"
                                        min="1"
                                        step="1"
                                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm"
                                        value={form.stock_quantity}
                                        onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })}
                                        required
                                    />
                                    <p className="text-[10px] text-gray-400 mt-1">How many units you are listing for sale</p>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-600 block mb-1">Condition *</label>
                                    <select
                                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm"
                                        value={form.condition}
                                        onChange={(e) => setForm({ ...form, condition: e.target.value })}
                                    >
                                        {CONDITION_OPTIONS.map((o) => (
                                            <option key={o.value} value={o.value}>{o.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-medium text-gray-600 block mb-1">Description *</label>
                                <textarea
                                    rows={4}
                                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm"
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <input
                                    className="px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm"
                                    placeholder="Brand (optional)"
                                    value={form.brand}
                                    onChange={(e) => setForm({ ...form, brand: e.target.value })}
                                />
                                <input
                                    className="px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm"
                                    placeholder="Model (optional)"
                                    value={form.model}
                                    onChange={(e) => setForm({ ...form, model: e.target.value })}
                                />
                                <input
                                    className="px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm"
                                    placeholder="Serial no. (optional)"
                                    value={form.serial_number}
                                    onChange={(e) => setForm({ ...form, serial_number: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="text-xs font-medium text-gray-600 block mb-1">Pickup / handover details *</label>
                                <textarea
                                    rows={2}
                                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm"
                                    placeholder="Where and how we can collect the item when sold"
                                    value={form.pickup_details}
                                    onChange={(e) => setForm({ ...form, pickup_details: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <label className="text-xs font-medium text-gray-600 block mb-2">Photos *</label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {form.images.map((img, i) => (
                                        <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-100">
                                            <img src={getMediaUrl(img)} alt="" className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => setForm((p) => ({ ...p, images: p.images.filter((_, j) => j !== i) }))}
                                                className="absolute top-0.5 right-0.5 p-1 bg-black/50 rounded text-white"
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileUpload} />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                    className="h-9 px-4 border border-dashed border-gray-300 rounded-xl text-xs font-medium text-gray-600 flex items-center gap-2 hover:border-blue-300"
                                >
                                    {uploading ? <Upload className="h-4 w-4 animate-pulse" /> : <ImageIcon className="h-4 w-4" />}
                                    {uploading ? 'Uploading…' : 'Add images'}
                                </button>
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button type="submit" disabled={submitting} className="h-10 px-5 bg-blue-600 text-white rounded-xl text-xs font-semibold disabled:opacity-50">
                                    {submitting
                                        ? 'Saving…'
                                        : editingId
                                          ? submissions.find((s) => s.id === editingId)?.status === 'listed'
                                              ? 'Save changes'
                                              : 'Resubmit for review'
                                          : 'Submit for review'}
                                </button>
                                <button type="button" onClick={resetForm} className="h-10 px-5 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="space-y-3">
                    <h2 className="text-sm font-semibold text-gray-900">My listings</h2>
                    {loading ? (
                        <p className="text-sm text-gray-500">Loading…</p>
                    ) : submissions.length === 0 ? (
                        <div className="flat-card p-8 text-center text-gray-500">
                            <Store className="h-10 w-10 mx-auto mb-2 text-gray-200" />
                            <p className="text-sm">No listings yet. Submit your first item above.</p>
                        </div>
                    ) : (
                        submissions.map((s) => (
                            <div key={s.id} className="flat-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 truncate">{s.name}</p>
                                    <p className="text-xs text-gray-500">
                                        {s.submission_number} · ₵{Number(s.asking_price).toFixed(2)} · Qty {s.stock_quantity ?? 1}
                                    </p>
                                    <p className="text-xs text-blue-600 font-medium mt-1">{STATUS_LABELS[s.status] || s.status}</p>
                                    {s.status === 'sold' && s.expected_payout_ghs != null && (
                                        <p className="text-xs text-violet-700 mt-1">
                                            ₵{Number(s.expected_payout_ghs).toFixed(2)} in escrow until delivery confirmed
                                            {s.escrow_on_hold && (
                                                <span className="block text-amber-700">On hold — {s.escrow_hold_reason || 'under review'}</span>
                                            )}
                                        </p>
                                    )}
                                    {s.rejection_reason && (
                                        <p className="text-xs text-red-600 mt-1">Rejected: {s.rejection_reason}</p>
                                    )}
                                    {s.admin_notes && s.status === 'changes_requested' && (
                                        <p className="text-xs text-amber-700 mt-1">Admin: {s.admin_notes}</p>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                                    {USER_EDITABLE_STATUSES.has(s.status) && (
                                        <button
                                            type="button"
                                            onClick={() => startEditing(s.id)}
                                            className="text-xs font-semibold text-blue-600 hover:underline inline-flex items-center gap-1"
                                        >
                                            <Pencil className="h-3 w-3" /> Edit
                                        </button>
                                    )}
                                    {USER_DELETABLE_STATUSES.has(s.status) && (
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(s)}
                                            className="text-xs font-semibold text-red-600 hover:underline inline-flex items-center gap-1"
                                        >
                                            <Trash2 className="h-3 w-3" /> Delete
                                        </button>
                                    )}
                                    {s.product?.slug && s.status === 'listed' && (
                                        <Link
                                            href={`/products/${s.product.slug}`}
                                            className="text-xs font-semibold text-blue-600 flex items-center gap-1 hover:underline"
                                        >
                                            View on shop <ChevronRight className="h-3 w-3" />
                                        </Link>
                                    )}
                                    {(s.status === 'paid_out' || s.status === 'sold' || s.status === 'sale_voided') && (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() => openLedger(s.id, s.name)}
                                                className="text-xs font-semibold text-gray-600 hover:text-blue-600"
                                            >
                                                History
                                            </button>
                                            <Link href="/dashboard/wallet" className="text-xs font-semibold text-gray-600 hover:text-blue-600">
                                                Wallet
                                            </Link>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </DashboardContent>

            {ledgerModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setLedgerModal(null)} aria-hidden />
                    <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6 max-h-[80vh] overflow-y-auto">
                        <h2 className="text-lg font-bold text-gray-900 mb-1">Payout history</h2>
                        <p className="text-xs text-gray-500 mb-4">{ledgerModal.name}</p>
                        {ledgerLoading ? (
                            <p className="text-sm text-gray-500">Loading…</p>
                        ) : ledgerEntries.length === 0 ? (
                            <p className="text-sm text-gray-500">No events recorded yet.</p>
                        ) : (
                            <ul className="space-y-2">
                                {ledgerEntries.map((e) => (
                                    <li key={e.id} className="border border-gray-100 rounded-lg p-3 text-xs">
                                        <div className="flex justify-between gap-2">
                                            <span className="font-semibold">{LEDGER_LABELS[e.event_type] ?? e.event_type}</span>
                                            <span className="text-gray-400">{new Date(e.created_at).toLocaleString()}</span>
                                        </div>
                                        {e.note && <p className="text-gray-600 mt-1">{e.note}</p>}
                                    </li>
                                ))}
                            </ul>
                        )}
                        <button type="button" onClick={() => setLedgerModal(null)} className="mt-4 w-full h-10 rounded-xl bg-gray-100 text-sm font-semibold">Close</button>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
