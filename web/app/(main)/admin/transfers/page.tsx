'use client';

import React, { useEffect, useState } from 'react';
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
import Button, { buttonVariants } from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/Badge';
import { Send, History, Calendar, ArrowRight, QrCode, Upload, ImagePlus, Download, CheckCircle, FileText, Clock, Package } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';

type QrCodeEntry = { image: string; amount_ghs?: number; amount_cny?: number; recipient_name?: string };
type QrFulfillment = { qr_index: number; status: string; confirmation_image?: string; admin_notes?: string; fulfilled_at?: string };

interface Transfer {
    id: number;
    token: string;
    amount_ghs: string;
    amount_cny: string;
    status: string;
    payment_status?: string;
    payment_method?: string;
    recipient_name: string;
    recipient_type: string;
    admin_reply_images?: string[];
    admin_notes?: string;
    proof_of_transfer?: string | null;
    payment_transaction_id?: string | null;
    payment_sender_name?: string | null;
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

const formatCmsLabel = (value: string) =>
    value
        .replace(/_/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/\b\w/g, (c) => c.toUpperCase());

export default function AdminTransfersPage() {
    const { confirm, confirmDialog } = useConfirmDialog();
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

    const isAwaitingPaymentReview = (t: Transfer) =>
        t.payment_status === 'pending' && (t.status === 'processing' || t.status === 'pending');
    const pendingCount = transfers.filter(isAwaitingPaymentReview).length;
    const inProgressCount = transfers.filter((t) =>
        ['payment_received', 'processing', 'sent_to_partner'].includes(t.status) && !isAwaitingPaymentReview(t)
    ).length;
    const completedCount = transfers.filter((t) => t.status === 'completed').length;
    const inProgressAmount = transfers
        .filter((t) => t.status !== 'completed' && t.status !== 'failed' && t.status !== 'cancelled')
        .reduce((acc, t) => acc + Number(t.amount_ghs || 0), 0);
    const completionRate = transfers.length > 0 ? Math.round((completedCount / transfers.length) * 100) : 0;

    const handleStatusUpdate = async (id: number, newStatus: string, adminNotes?: string) => {
        const ok = await confirm({
            title: `Update transfer status to ${formatCmsLabel(newStatus)}?`,
            confirmLabel: 'Update',
            variant: 'primary',
        });
        if (!ok) return;

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

    const stats = [
        { label: 'Total', value: transfers.length, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
        { label: 'Pending', value: pendingCount, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
        { label: 'In progress', value: inProgressCount, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
        { label: 'Completed', value: completedCount, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' }
    ];

    return (
        <DashboardLayout isAdmin={true}>
            <div className="pb-6 md:pb-8">
            <AdminPageHeader
                icon={Send}
                title="Transfers"
                subtitle="Manage transfer requests and confirmations"
                actions={
                    <AdminToolbar
                        searchValue={searchTerm}
                        onSearchChange={setSearchTerm}
                        searchPlaceholder="Search reference, customer, recipient…"
                        searchAriaLabel="Search transfers"
                    />
                }
            />

            <AdminStatGrid items={stats} columns={4} />

            <div className="mb-4">
            <AdminTable>
                <AdminTableHead>
                    <AdminTh>Reference</AdminTh>
                    <AdminTh align="right">Amount</AdminTh>
                    <AdminTh>Customer</AdminTh>
                    <AdminTh align="right">Status</AdminTh>
                    <AdminTh>Confirmation</AdminTh>
                    <AdminTh align="right">Actions</AdminTh>
                </AdminTableHead>
                <AdminTableBody>
                    {loading ? (
                        <AdminTableLoading colSpan={6} />
                    ) : filteredTransfers.length === 0 ? (
                        <AdminTableEmpty
                            colSpan={6}
                            icon={<History className="h-10 w-10 mx-auto mb-2 text-gray-200" />}
                            message="No transfers found"
                        />
                    ) : (
                        filteredTransfers.map((transfer) => (
                            <AdminTr key={transfer.id}>
                                <AdminTd>
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-sm font-semibold text-gray-900 truncate max-w-[120px]">{transfer.token}</span>
                                        <span className="text-xs text-gray-500 flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {new Date(transfer.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </span>
                                    </div>
                                </AdminTd>
                                <AdminTd className="text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                        <span className="text-xs font-semibold text-gray-900">₵{Number(transfer.amount_ghs).toFixed(2)}</span>
                                        <ArrowRight className="h-3 w-3 text-gray-300" />
                                        <span className="text-xs font-semibold text-brand">¥{Number(transfer.amount_cny).toFixed(2)}</span>
                                    </div>
                                </AdminTd>
                                <AdminTd>
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-gray-700 truncate max-w-[140px]">
                                            {`${transfer.user.profile?.first_name || ''} ${transfer.user.profile?.last_name || ''}`.trim() || transfer.user.email}
                                        </p>
                                        <p className="text-xs text-brand truncate max-w-[140px]">
                                            Recipient: {transfer.recipient_name}
                                        </p>
                                    </div>
                                </AdminTd>
                                <AdminTd className="text-right">
                                    <StatusBadge status={isAwaitingPaymentReview(transfer) ? 'pending' : transfer.status}>
                                        {formatCmsLabel(isAwaitingPaymentReview(transfer) ? 'pending' : transfer.status)}
                                    </StatusBadge>
                                    {isAwaitingPaymentReview(transfer) && (
                                        <p className="text-[10px] text-orange-600 font-semibold mt-0.5">Payment review</p>
                                    )}
                                    {transfer.qr_codes && transfer.qr_codes.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => setQrModalTransferId(transfer.id)}
                                            className="mt-1 inline-flex items-center text-xs font-semibold text-brand bg-blue-50 hover:bg-blue-50 py-0.5 rounded px-1.5"
                                        >
                                            <QrCode className="h-2.5 w-2.5 mr-1" /> QR ({transfer.qr_codes.length})
                                        </button>
                                    )}
                                </AdminTd>
                                <AdminTd>
                                    <div className="space-y-1.5">
                                        {(transfer.proof_of_transfer || transfer.payment_transaction_id || transfer.payment_sender_name) && (
                                            <div className="rounded-lg border border-orange-100 bg-orange-50/60 p-2 space-y-1 max-w-[200px]">
                                                <p className="text-[10px] font-bold uppercase tracking-wide text-orange-700">Customer payment</p>
                                                {transfer.payment_method && (
                                                    <p className="text-[10px] text-gray-600 capitalize">{transfer.payment_method.replace(/_/g, ' ')}</p>
                                                )}
                                                {transfer.payment_transaction_id && (
                                                    <p className="text-[10px] text-gray-800 font-mono break-all">ID: {transfer.payment_transaction_id}</p>
                                                )}
                                                {transfer.payment_sender_name && (
                                                    <p className="text-[10px] text-gray-800">From: {transfer.payment_sender_name}</p>
                                                )}
                                                {transfer.proof_of_transfer && (
                                                    <a
                                                        href={getMediaUrl(transfer.proof_of_transfer)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="block w-12 h-12 rounded-md overflow-hidden border border-orange-200 bg-white"
                                                    >
                                                        <img
                                                            src={getMediaUrl(transfer.proof_of_transfer)}
                                                            alt="Payment proof"
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </a>
                                                )}
                                            </div>
                                        )}
                                        {transfer.admin_reply_images && transfer.admin_reply_images.length > 0 && (
                                            <div className="flex gap-1.5 flex-wrap">
                                                    {transfer.admin_reply_images.map((img, i) => (
                                                    <a key={i} href={img} target="_blank" rel="noopener noreferrer" className="block w-10 h-10 rounded-lg overflow-hidden border border-gray-100 bg-gray-50 hover:ring-2 hover:ring-blue-300">
                                                        <img src={img} alt="Proof" className="w-full h-full object-cover" />
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => setExpandedId(expandedId === transfer.id ? null : transfer.id)}
                                            className="flex items-center gap-1.5 text-xs font-semibold text-brand hover:text-brand/80"
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
                                                    className="flex-1 min-w-0 px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20"
                                                />
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    onClick={() => handleAddFeedbackImage(transfer.id)}
                                                    disabled={uploadingId === transfer.id || !feedbackUrl[transfer.id]?.trim()}
                                                    loading={uploadingId === transfer.id}
                                                    leftIcon={<Upload className="h-3 w-3" />}
                                                    className="h-8 min-h-[32px] px-3 text-xs shrink-0"
                                                >
                                                    Add
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </AdminTd>
                                <AdminTd className="text-right">
                                    {isAwaitingPaymentReview(transfer) ? (
                                        <div className="flex justify-end gap-1.5">
                                            <Button
                                                type="button"
                                                size="sm"
                                                disabled={updatingId === transfer.id}
                                                onClick={() => void handleStatusUpdate(transfer.id, 'payment_received')}
                                                className="h-8 min-h-[32px] px-3 text-xs"
                                            >
                                                Approve payment
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                size="sm"
                                                disabled={updatingId === transfer.id}
                                                onClick={() => void handleStatusUpdate(transfer.id, 'failed')}
                                                className="h-8 min-h-[32px] px-3 text-xs hover:text-red-600 hover:border-red-200"
                                            >
                                                Decline
                                            </Button>
                                        </div>
                                    ) : (
                                        <Select
                                            disabled={updatingId === transfer.id}
                                            value={transfer.status}
                                            onChange={(e) => void handleStatusUpdate(transfer.id, e.target.value)}
                                            className="h-9 min-h-[36px] text-xs py-1.5 w-auto min-w-[9.5rem] ml-auto"
                                            aria-label={`Update status for ${transfer.token}`}
                                        >
                                            <option value="payment_received">Payment received</option>
                                            <option value="processing">Processing</option>
                                            <option value="sent_to_partner">Sent to partner</option>
                                            <option value="completed">Completed</option>
                                            <option value="failed">Failed</option>
                                            <option value="cancelled">Cancelled</option>
                                        </Select>
                                    )}
                                </AdminTd>
                            </AdminTr>
                        ))
                    )}
                </AdminTableBody>
            </AdminTable>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
                <div className="bg-brand rounded-xl p-4 text-white">
                    <h4 className="text-xs font-semibold text-white/90 mb-1">Amount in progress</h4>
                    <p className="text-xl font-bold tracking-tight">₵{inProgressAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    <p className="text-white/70 text-xs mt-2 pt-2 border-t border-white/10">Total GHS not yet completed</p>
                </div>
                <div className="admin-stat-card">
                    <h4 className="text-xs font-semibold text-gray-500 mb-2">Completion rate</h4>
                    <div className="flex items-center gap-3">
                        <div className="relative w-14 h-14 shrink-0">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="3" className="text-gray-100" />
                                <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="3" className="text-brand" strokeDasharray={94.25} strokeDashoffset={94.25 * (1 - completionRate / 100)} />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-sm font-bold text-gray-900">{completionRate}%</span>
                            </div>
                        </div>
                        <p className="text-xs font-medium text-gray-600">{completedCount} of {transfers.length} completed</p>
                    </div>
                </div>
            </div>

            {(() => {
                const transfer = qrModalTransferId != null ? transfers.find((t) => t.id === qrModalTransferId) : undefined;
                const entries = transfer ? normalizeQrCodes(transfer) : [];
                return (
                    <Modal
                        open={qrModalTransferId != null}
                        onClose={() => { setQrModalTransferId(null); setFulfillmentDraft({}); }}
                        title={`Fulfill transfer by QR · ${transfer?.token ?? ''}`}
                        size="xl"
                    >
                        <div className="space-y-4 max-h-[70vh] overflow-y-auto overscroll-y-contain scrollbar-thin -mx-1 px-1">
                            {entries.length === 0 ? (
                                <p className="text-sm text-gray-500">No payment QR codes available for this transfer.</p>
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
                                                        className={buttonVariants({ size: 'sm', className: 'h-8 min-h-[32px] px-2.5 text-xs' })}
                                                    >
                                                        <Download className="h-3 w-3" /> Download
                                                    </a>
                                                </div>
                                                <div className="min-w-0">
                                                    {entry.recipient_name && <p className="text-xs font-semibold text-gray-900 mb-0.5">{entry.recipient_name}</p>}
                                                    <p className="text-xs text-gray-500">Amount</p>
                                                    <p className="text-lg font-bold text-gray-900">¥{(entry.amount_cny ?? entry.amount_ghs) != null ? Number(entry.amount_cny ?? entry.amount_ghs).toFixed(2) : '—'}</p>
                                                    {fulfillment?.status === 'fulfilled' && (
                                                        <span className="inline-flex items-center gap-1 mt-1.5 text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded">
                                                            <CheckCircle className="h-2.5 w-2.5" /> Fulfilled
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="p-3 space-y-2">
                                                <p className="text-xs font-semibold text-gray-500">Confirmation</p>
                                                {displayImage && (
                                                    <div className="flex items-start gap-2">
                                                        <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200 bg-white shrink-0">
                                                            <img src={displayImage} alt="Confirmation" className="w-full h-full object-cover" />
                                                        </div>
                                                        {fulfillment?.status === 'fulfilled' && fulfillment.admin_notes && (
                                                            <p className="text-xs text-gray-600 flex-1">{fulfillment.admin_notes}</p>
                                                        )}
                                                    </div>
                                                )}
                                                {(!fulfillment || fulfillment.status !== 'fulfilled') && (
                                                    <>
                                                        <div className="flex flex-wrap gap-2">
                                                            <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-blue-300 bg-blue-50/50 text-brand text-xs font-semibold hover:bg-blue-50">
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
                                                                className="flex-1 min-w-[120px] px-2.5 py-2 rounded-lg border border-gray-200 text-xs focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
                                                            />
                                                        </div>
                                                        <textarea
                                                            value={draft.notes}
                                                            onChange={(e) => setFulfillmentDraft((p) => ({ ...p, [key]: { ...p[key], notes: e.target.value } }))}
                                                            placeholder="Notes (optional)"
                                                            rows={2}
                                                            className="w-full px-2.5 py-2 rounded-lg border border-gray-200 text-xs focus:ring-2 focus:ring-brand/20 outline-none resize-none"
                                                        />
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            disabled={fulfillingKey === key || !(draft.image.trim())}
                                                            loading={fulfillingKey === key}
                                                            onClick={() => handleSaveFulfillment(transfer!.id, i, draft.image, draft.notes)}
                                                            leftIcon={<CheckCircle className="h-3.5 w-3.5" />}
                                                            className="w-full sm:w-auto h-9 min-h-[36px] px-4 text-xs"
                                                        >
                                                            {fulfillingKey === key ? 'Saving…' : 'Mark fulfilled'}
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </Modal>
                );
            })()}
            </div>
            {confirmDialog}
        </DashboardLayout>
    );
}
