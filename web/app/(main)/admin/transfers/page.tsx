'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Send, Search, History, ChevronRight, Calendar, ArrowRight, QrCode, Upload, ImagePlus, Download, CheckCircle, Loader2, FileText, Clock, Package } from 'lucide-react';

type QrCodeEntry = { image: string; amount_ghs?: number; amount_cny?: number; recipient_name?: string };
type QrFulfillment = { qr_index: number; status: string; confirmation_image?: string; admin_notes?: string; fulfilled_at?: string };

interface Transfer {
    id: number;
    token: string;
    amount_ghs: string;
    amount_cny: string;
    status: string;
    recipient_name: string;
    recipient_type: string;
    admin_reply_images?: string[];
    admin_notes?: string;
    qr_fulfillments?: QrFulfillment[];
    user: {
        email: string;
        profile?: {
            first_name?: string;
            last_name?: string;
        }
    };
    created_at: string;
    qr_codes?: string[] | QrCodeEntry[];
}

export default function AdminTransfersPage() {
    const [transfers, setTransfers] = useState<Transfer[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<number | null>(null);
    const [uploadingId, setUploadingId] = useState<number | null>(null);
    const [feedbackUrl, setFeedbackUrl] = useState<Record<number, string>>({});
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [qrModalTransferId, setQrModalTransferId] = useState<number | null>(null);
    const [fulfillingKey, setFulfillingKey] = useState<string | null>(null);
    const [fulfillmentDraft, setFulfillmentDraft] = useState<Record<string, { image: string; notes: string }>>({});

    const normalizeQrCodes = (transfer: Transfer): QrCodeEntry[] => {
        const raw = transfer.qr_codes;
        if (!raw?.length) return [];
        if (typeof raw[0] === 'string') return (raw as string[]).map((url) => ({ image: url }));
        return raw as QrCodeEntry[];
    };

    const getFulfillment = (transfer: Transfer, qrIndex: number): QrFulfillment | undefined => {
        const list = (transfer.qr_fulfillments || []) as QrFulfillment[];
        return list.find((f) => f.qr_index === qrIndex) || list[qrIndex];
    };

    const handleSaveFulfillment = async (transferId: number, qrIndex: number, image: string, notes: string) => {
        if (!image.trim()) {
            toast.error('Add a confirmation image (upload or URL)');
            return;
        }
        const key = `${transferId}-${qrIndex}`;
        setFulfillingKey(key);
        try {
            await api.patch(`/finance/transfers/admin/${transferId}/fulfillment/${qrIndex}`, {
                confirmation_image: image.trim(),
                admin_notes: notes.trim() || undefined
            });
            toast.success(`QR #${qrIndex + 1} marked as fulfilled`);
            setFulfillmentDraft((prev) => ({ ...prev, [key]: { image: '', notes: '' } }));
            fetchTransfers();
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Failed to save');
        } finally {
            setFulfillingKey(null);
        }
    };

    const handleFulfillmentFile = (transferId: number, qrIndex: number, file: File | null) => {
        if (!file || !file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = () => {
            const key = `${transferId}-${qrIndex}`;
            setFulfillmentDraft((prev) => ({ ...prev, [key]: { ...prev[key], image: reader.result as string } }));
        };
        reader.readAsDataURL(file);
    };

    useEffect(() => {
        fetchTransfers();
    }, []);

    const fetchTransfers = async () => {
        try {
            const { data } = await api.get('/finance/transfers/admin/all');
            setTransfers(Array.isArray(data) ? data : data?.data ?? []);
        } catch {
            toast.error('Failed to load transfers');
        } finally {
            setLoading(false);
        }
    };

    const filteredTransfers = transfers.filter(
        (t) =>
            (t.token ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (t.recipient_name ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (t.user?.email ?? '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const pendingCount = transfers.filter((t) => t.status === 'pending').length;
    const inProgressCount = transfers.filter((t) => ['payment_received', 'processing', 'sent_to_partner'].includes(t.status)).length;
    const completedCount = transfers.filter((t) => t.status === 'completed').length;
    const inProgressAmount = transfers
        .filter((t) => t.status !== 'completed' && t.status !== 'failed' && t.status !== 'cancelled')
        .reduce((acc, t) => acc + Number(t.amount_ghs || 0), 0);
    const completionRate = transfers.length > 0 ? Math.round((completedCount / transfers.length) * 100) : 0;

    const handleStatusUpdate = async (id: number, newStatus: string, adminNotes?: string) => {
        if (!confirm(`Update transfer status to ${newStatus}?`)) return;

        setUpdatingId(id);
        try {
            await api.patch(`/finance/transfers/admin/${id}/status`, { status: newStatus, admin_notes: adminNotes });
            toast.success('Status updated successfully');
            fetchTransfers();
        } catch {
            toast.error('Failed to update status');
        } finally {
            setUpdatingId(null);
        }
    };

    const handleAddFeedbackImage = async (id: number) => {
        const url = feedbackUrl[id]?.trim();
        if (!url) {
            toast.error('Enter image URL');
            return;
        }
        setUploadingId(id);
        try {
            await api.post(`/finance/transfers/admin/${id}/reply-image`, { imageUrl: url });
            toast.success('Confirmation image added');
            setFeedbackUrl((prev) => ({ ...prev, [id]: '' }));
            setExpandedId(null);
            fetchTransfers();
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Failed to add image');
        } finally {
            setUploadingId(null);
        }
    };

    const StatusBadge = ({ status }: { status: string }) => {
        const colors: Record<string, string> = {
            pending: 'bg-amber-50 text-amber-700 border-amber-200',
            payment_received: 'bg-blue-50 text-blue-700 border-blue-200',
            processing: 'bg-indigo-50 text-indigo-700 border-indigo-200',
            sent_to_partner: 'bg-purple-50 text-purple-700 border-purple-200',
            completed: 'bg-green-50 text-green-700 border-green-200',
            failed: 'bg-red-50 text-red-700 border-red-200',
            cancelled: 'bg-gray-50 text-gray-600 border-gray-200'
        };
        return (
            <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-lg border ${colors[status] || 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                {status.replace(/_/g, ' ')}
            </span>
        );
    };

    const stats = [
        { label: 'Total', value: transfers.length, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
        { label: 'Pending', value: pendingCount, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
        { label: 'In progress', value: inProgressCount, icon: Package, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
        { label: 'Completed', value: completedCount, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' }
    ];

    return (
        <DashboardLayout isAdmin={true}>
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                    <Send className="h-7 w-7 text-blue-600" />
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Transfers</h1>
                        <p className="text-xs text-gray-500 mt-0.5">Manage remittances</p>
                    </div>
                </div>
                <div className="relative min-w-0 sm:w-56">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by reference or recipient..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full h-9 pl-9 pr-3 bg-white border border-gray-100 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {stats.map((s, i) => (
                    <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                        <div className={`w-9 h-9 rounded-lg ${s.bg} ${s.border} border flex items-center justify-center ${s.color} mb-2`}>
                            <s.icon className="h-4 w-4" />
                        </div>
                        <p className="text-[10px] font-semibold text-gray-500 mb-0.5">{s.label}</p>
                        <p className="text-xl font-bold text-gray-900">{s.value}</p>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-4">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-50">
                                <th className="px-3 py-2.5 text-[10px] font-semibold text-gray-500">Reference</th>
                                <th className="px-3 py-2.5 text-[10px] font-semibold text-gray-500 text-center">Amount</th>
                                <th className="px-3 py-2.5 text-[10px] font-semibold text-gray-500">Customer</th>
                                <th className="px-3 py-2.5 text-[10px] font-semibold text-gray-500 text-center">Status</th>
                                <th className="px-3 py-2.5 text-[10px] font-semibold text-gray-500">Proof</th>
                                <th className="px-3 py-2.5 text-[10px] font-semibold text-gray-500 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="py-10 text-center">
                                        <div className="animate-spin h-7 w-7 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2" />
                                        <p className="text-sm text-gray-500">Loading...</p>
                                    </td>
                                </tr>
                            ) : filteredTransfers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-10 text-center text-gray-500">
                                        <History className="h-10 w-10 mx-auto mb-2 text-gray-200" />
                                        <p className="text-sm">No transfers found</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredTransfers.map((transfer) => (
                                    <tr key={transfer.id} className="hover:bg-gray-50/50 transition-all group">
                                        <td className="px-3 py-2.5">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate max-w-[120px]">{transfer.token}</span>
                                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {new Date(transfer.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-3 py-2.5 text-center">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <span className="text-xs font-semibold text-gray-900">₵{Number(transfer.amount_ghs).toFixed(2)}</span>
                                                <ArrowRight className="h-3 w-3 text-gray-300" />
                                                <span className="text-xs font-semibold text-blue-600">¥{Number(transfer.amount_cny).toFixed(2)}</span>
                                            </div>
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <div className="space-y-1">
                                                <p className="text-xs font-medium text-gray-700 truncate max-w-[140px]">
                                                    {transfer.user.profile?.first_name} {transfer.user.profile?.last_name || '—'}
                                                </p>
                                                <p className="text-xs text-blue-600 truncate max-w-[140px]">{transfer.recipient_name}</p>
                                            </div>
                                        </td>
                                        <td className="px-3 py-2.5 text-center">
                                            <StatusBadge status={transfer.status} />
                                            {transfer.qr_codes && transfer.qr_codes.length > 0 && (
                                                <button
                                                    type="button"
                                                    onClick={() => setQrModalTransferId(transfer.id)}
                                                    className="mt-1 inline-flex items-center text-[9px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 py-0.5 rounded px-1.5"
                                                >
                                                    <QrCode className="h-2.5 w-2.5 mr-1" /> QR ({transfer.qr_codes.length})
                                                </button>
                                            )}
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <div className="space-y-1.5">
                                                {transfer.admin_reply_images && transfer.admin_reply_images.length > 0 && (
                                                    <div className="flex gap-1.5 flex-wrap">
                                                        {transfer.admin_reply_images.map((img, i) => (
                                                            <a key={i} href={img} target="_blank" rel="noopener noreferrer" className="block w-10 h-10 rounded-lg overflow-hidden border border-gray-100 bg-gray-50 hover:ring-2 hover:ring-blue-500">
                                                                <img src={img} alt="Proof" className="w-full h-full object-cover" />
                                                            </a>
                                                        ))}
                                                    </div>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => setExpandedId(expandedId === transfer.id ? null : transfer.id)}
                                                    className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800"
                                                >
                                                    <ImagePlus className="h-3 w-3" />
                                                    {transfer.admin_reply_images?.length ? 'Add more' : 'Add proof'}
                                                </button>
                                                {expandedId === transfer.id && (
                                                    <div className="flex gap-2 mt-1.5 p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                                                        <input
                                                            type="url"
                                                            value={feedbackUrl[transfer.id] || ''}
                                                            onChange={(e) => setFeedbackUrl((prev) => ({ ...prev, [transfer.id]: e.target.value }))}
                                                            placeholder="Image URL"
                                                            className="flex-1 min-w-0 px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => handleAddFeedbackImage(transfer.id)}
                                                            disabled={uploadingId === transfer.id || !feedbackUrl[transfer.id]?.trim()}
                                                            className="px-3 py-1.5 bg-blue-600 text-white text-[10px] font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1 shrink-0"
                                                        >
                                                            {uploadingId === transfer.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Upload className="h-3 w-3" /> Add</>}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-3 py-2.5 text-right">
                                            {transfer.status === 'pending' ? (
                                                <div className="flex justify-end gap-1.5">
                                                    <button
                                                        type="button"
                                                        disabled={updatingId === transfer.id}
                                                        onClick={() => handleStatusUpdate(transfer.id, 'payment_received')}
                                                        className="h-8 px-3 bg-blue-600 text-white rounded-lg font-semibold text-xs hover:bg-gray-900 transition-all"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={updatingId === transfer.id}
                                                        onClick={() => handleStatusUpdate(transfer.id, 'failed')}
                                                        className="h-8 px-3 border border-gray-200 text-gray-500 rounded-lg font-semibold text-xs hover:text-red-600 hover:border-red-200 transition-all"
                                                    >
                                                        Decline
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="relative inline-block">
                                                    <select
                                                        disabled={updatingId === transfer.id}
                                                        className="appearance-none bg-gray-50 border border-gray-100 text-gray-700 text-xs font-semibold rounded-lg py-2 pl-2.5 pr-8 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                                                        value={transfer.status}
                                                        onChange={(e) => handleStatusUpdate(transfer.id, e.target.value)}
                                                    >
                                                        <option value="pending">Pending</option>
                                                        <option value="payment_received">Payment received</option>
                                                        <option value="processing">Processing</option>
                                                        <option value="sent_to_partner">Sent to partner</option>
                                                        <option value="completed">Completed</option>
                                                        <option value="failed">Failed</option>
                                                        <option value="cancelled">Cancelled</option>
                                                    </select>
                                                    <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none rotate-90" aria-hidden />
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
                <div className="bg-blue-600 rounded-xl p-4 text-white">
                    <h4 className="text-[10px] font-semibold text-blue-100 mb-1">Amount in progress</h4>
                    <p className="text-xl font-bold tracking-tight">₵{inProgressAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    <p className="text-blue-100/80 text-[10px] mt-2 pt-2 border-t border-white/10">Total GHS not yet completed</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <h4 className="text-[10px] font-semibold text-gray-500 mb-2">Completion rate</h4>
                    <div className="flex items-center gap-3">
                        <div className="relative w-14 h-14 shrink-0">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="3" className="text-gray-100" />
                                <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="3" className="text-blue-600" strokeDasharray={94.25} strokeDashoffset={94.25 * (1 - completionRate / 100)} />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-sm font-bold text-gray-900">{completionRate}%</span>
                            </div>
                        </div>
                        <p className="text-xs font-medium text-gray-600">{completedCount} of {transfers.length} completed</p>
                    </div>
                </div>
            </div>

            {qrModalTransferId != null && (() => {
                const transfer = transfers.find((t) => t.id === qrModalTransferId);
                const entries = transfer ? normalizeQrCodes(transfer) : [];
                return (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => { setQrModalTransferId(null); setFulfillmentDraft({}); }}>
                        <div className="bg-white rounded-xl shadow-xl border border-gray-100 max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
                            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                                <h3 className="text-sm font-bold text-gray-900">Fulfill by QR · {transfer?.token}</h3>
                                <button type="button" onClick={() => { setQrModalTransferId(null); setFulfillmentDraft({}); }} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" aria-label="Close">×</button>
                            </div>
                            <div className="p-4 overflow-y-auto space-y-4">
                                {entries.length === 0 ? (
                                    <p className="text-sm text-gray-500">No QR codes.</p>
                                ) : (
                                    entries.map((entry, i) => {
                                        const fulfillment = transfer ? getFulfillment(transfer, i) : undefined;
                                        const key = `${transfer?.id}-${i}`;
                                        const draft = fulfillmentDraft[key] || { image: '', notes: '' };
                                        const displayImage = fulfillment?.confirmation_image || draft.image;
                                        return (
                                            <div key={i} className="rounded-xl border border-gray-200 bg-gray-50/50 overflow-hidden">
                                                <div className="p-3 flex flex-wrap items-start gap-3 border-b border-gray-100 bg-white">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-20 h-20 rounded-lg overflow-hidden border border-gray-200 bg-white shrink-0">
                                                            <img src={entry.image} alt={`QR ${i + 1}`} className="w-full h-full object-contain" />
                                                        </div>
                                                        <a
                                                            href={entry.image}
                                                            download={`${transfer?.token}-qr-${i + 1}.png`}
                                                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-900 text-white text-[10px] font-semibold hover:bg-gray-800"
                                                        >
                                                            <Download className="h-3 w-3" /> Download
                                                        </a>
                                                    </div>
                                                    <div className="min-w-0">
                                                        {entry.recipient_name && <p className="text-xs font-semibold text-gray-900 mb-0.5">{entry.recipient_name}</p>}
                                                        <p className="text-[10px] text-gray-500">Amount</p>
                                                        <p className="text-lg font-bold text-gray-900">¥{(entry.amount_cny ?? entry.amount_ghs) != null ? Number(entry.amount_cny ?? entry.amount_ghs).toFixed(2) : '—'}</p>
                                                        {fulfillment?.status === 'fulfilled' && (
                                                            <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded">
                                                                <CheckCircle className="h-2.5 w-2.5" /> Fulfilled
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="p-3 space-y-2">
                                                    <p className="text-[10px] font-semibold text-gray-500">Confirmation</p>
                                                    {displayImage && (
                                                        <div className="flex items-start gap-2">
                                                            <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200 bg-white shrink-0">
                                                                <img src={displayImage} alt="Confirmation" className="w-full h-full object-cover" />
                                                            </div>
                                                            {fulfillment?.status === 'fulfilled' && fulfillment.admin_notes && (
                                                                <p className="text-[10px] text-gray-600 flex-1">{fulfillment.admin_notes}</p>
                                                            )}
                                                        </div>
                                                    )}
                                                    {(!fulfillment || fulfillment.status !== 'fulfilled') && (
                                                        <>
                                                            <div className="flex flex-wrap gap-2">
                                                                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-blue-200 bg-blue-50/50 text-blue-700 text-[10px] font-semibold hover:bg-blue-100">
                                                                    <Upload className="h-3 w-3" /> Upload
                                                                    <input
                                                                        type="file"
                                                                        accept="image/*"
                                                                        className="sr-only"
                                                                        onChange={(e) => handleFulfillmentFile(transfer!.id, i, e.target.files?.[0] ?? null)}
                                                                    />
                                                                </label>
                                                                <input
                                                                    type="url"
                                                                    value={draft.image?.startsWith('data:') ? '' : draft.image}
                                                                    onChange={(e) => setFulfillmentDraft((p) => ({ ...p, [key]: { ...p[key], image: e.target.value } }))}
                                                                    placeholder="Or image URL"
                                                                    className="flex-1 min-w-[120px] px-2.5 py-2 rounded-lg border border-gray-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                                                />
                                                            </div>
                                                            <textarea
                                                                value={draft.notes}
                                                                onChange={(e) => setFulfillmentDraft((p) => ({ ...p, [key]: { ...p[key], notes: e.target.value } }))}
                                                                placeholder="Notes (optional)"
                                                                rows={2}
                                                                className="w-full px-2.5 py-2 rounded-lg border border-gray-200 text-xs focus:ring-2 focus:ring-blue-500/20 outline-none resize-none"
                                                            />
                                                            <button
                                                                type="button"
                                                                disabled={fulfillingKey === key || !(draft.image.trim())}
                                                                onClick={() => handleSaveFulfillment(transfer!.id, i, draft.image, draft.notes)}
                                                                className="w-full sm:w-auto px-4 py-2 rounded-lg bg-gray-900 text-white text-xs font-semibold hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center gap-1.5"
                                                            >
                                                                {fulfillingKey === key ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                                                                {fulfillingKey === key ? 'Saving…' : 'Mark fulfilled'}
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                );
            })()}
        </DashboardLayout>
    );
}
