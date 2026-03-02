'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { getMediaUrl } from '@/lib/media';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
    ArrowLeft,
    User,
    Mail,
    Phone,
    Image as ImageIcon,
    Download,
    Plus,
    ChevronRight,
    FileText,
    ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = [
    'submitted',
    'quote_provided',
    'accepted',
    'payment_received',
    'processing',
    'delivered',
    'cancelled',
];

interface ProcurementRequest {
    id: number;
    request_number: string;
    request_type?: string;
    description: string;
    specifications?: string;
    quantity?: number;
    budget_range?: string;
    reference_link?: string;
    reference_images?: string[] | null;
    status: string;
    created_at: string;
    user?: {
        email: string;
        phone?: string | null;
        profile?: { first_name?: string; last_name?: string };
    };
    quotes: { id: number; quote_amount: number; quote_details?: string }[];
    orders: any[];
}

export default function AdminProcurementDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;
    const [request, setRequest] = useState<ProcurementRequest | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [quoteDraft, setQuoteDraft] = useState({ amount: '', details: '' });
    const [showQuoteForm, setShowQuoteForm] = useState(false);

    useEffect(() => {
        const fetchRequest = async () => {
            try {
                const { data } = await api.get(`/procurement/admin/${id}`);
                setRequest(data);
            } catch (err: any) {
                toast.error(err.response?.data?.message || 'Failed to load request');
                router.push('/admin/procurement');
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchRequest();
    }, [id, router]);

    const handleStatusUpdate = async (newStatus: string) => {
        if (!request) return;
        setUpdating(true);
        try {
            await api.patch(`/procurement/admin/${request.id}/status`, { status: newStatus });
            toast.success('Status updated');
            setRequest((r) => (r ? { ...r, status: newStatus } : null));
        } catch {
            toast.error('Failed to update status');
        } finally {
            setUpdating(false);
        }
    };

    const handleAddQuote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!request || !quoteDraft.amount) return;
        setUpdating(true);
        try {
            await api.post(`/procurement/admin/${request.id}/quote`, {
                amount: parseFloat(quoteDraft.amount),
                details: quoteDraft.details,
            });
            toast.success('Quote submitted');
            setQuoteDraft({ amount: '', details: '' });
            setShowQuoteForm(false);
            const { data } = await api.get(`/procurement/admin/${id}`);
            setRequest(data);
        } catch {
            toast.error('Failed to submit quote');
        } finally {
            setUpdating(false);
        }
    };

    const images: string[] = (() => {
        const raw = request?.reference_images;
        if (!raw) return [];
        if (Array.isArray(raw)) return raw;
        if (typeof raw === 'string') return [raw];
        return [];
    })();

    const userName = request?.user?.profile
        ? `${request.user.profile.first_name || ''} ${request.user.profile.last_name || ''}`.trim() || request.user?.email
        : request?.user?.email ?? '—';

    const handleDownloadImage = async (url: string, index: number) => {
        const fullUrl = getMediaUrl(url);
        try {
            const res = await fetch(fullUrl);
            const blob = await res.blob();
            const objectUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = objectUrl;
            a.download = `procurement-${request?.request_number}-image-${index + 1}.jpg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(objectUrl);
            toast.success('Download started');
        } catch {
            window.open(fullUrl, '_blank');
        }
    };

    if (loading) {
        return (
            <DashboardLayout isAdmin={true}>
                <div className="p-6 pb-6 md:pb-8 text-center">
                    <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-3" />
                    <p className="text-sm text-gray-500">Loading request...</p>
                </div>
            </DashboardLayout>
        );
    }

    if (!request) return null;

    return (
        <DashboardLayout isAdmin={true}>
            <div className="pb-6 md:pb-8">
            <div className="mb-6 flex items-center justify-between gap-3">
                <Link
                    href="/admin/procurement"
                    className="text-blue-600 hover:text-gray-900 flex items-center text-sm font-medium transition-colors"
                >
                    <ArrowLeft className="h-4 w-4 mr-1.5" /> Procurement
                </Link>
            </div>

            <div className="space-y-6">
                {/* Header card */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-4 py-4 sm:px-6 border-b border-gray-50 flex flex-wrap justify-between items-start gap-4 bg-gray-50/50">
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">{request.description}</h1>
                            <p className="text-xs text-gray-500 mt-0.5">
                                {request.request_number} · {new Date(request.created_at).toLocaleString()}
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            {request.request_type && (
                                <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 capitalize">
                                    {request.request_type}
                                </span>
                            )}
                            <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-50 text-amber-700 capitalize">
                                {request.status.replace(/_/g, ' ')}
                            </span>
                            <select
                                value={request.status}
                                onChange={(e) => handleStatusUpdate(e.target.value)}
                                disabled={updating}
                                className="text-xs font-semibold border border-gray-200 rounded-lg pl-3 pr-8 py-2 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            >
                                {STATUS_OPTIONS.map((s) => (
                                    <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Main content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Request details */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/50">
                                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                    <FileText className="h-4 w-4" /> Request details
                                </h3>
                            </div>
                            <div className="px-4 py-4 space-y-4">
                                <div className="flex flex-wrap gap-4 text-sm">
                                    <span><strong className="text-gray-600">Qty:</strong> {request.quantity ?? '—'}</span>
                                    {request.budget_range && (
                                        <span><strong className="text-gray-600">Budget:</strong> ₵{request.budget_range}</span>
                                    )}
                                </div>
                                {request.specifications && (
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 mb-1">Specifications</p>
                                        <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{request.specifications}</p>
                                    </div>
                                )}
                                {request.reference_link && (
                                    <a
                                        href={request.reference_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 text-blue-600 hover:underline text-sm"
                                    >
                                        <ExternalLink className="h-3.5 w-3.5" /> Reference link
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* Attached images */}
                        {images.length > 0 && (
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/50">
                                    <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                        <ImageIcon className="h-4 w-4" /> Attached images ({images.length})
                                    </h3>
                                </div>
                                <div className="px-4 py-4">
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                        {images.map((url, i) => (
                                            <div key={i} className="group relative rounded-xl border border-gray-100 overflow-hidden bg-gray-50">
                                                <a
                                                    href={getMediaUrl(url)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="block aspect-square"
                                                >
                                                    <img
                                                        src={getMediaUrl(url)}
                                                        alt={`Attachment ${i + 1}`}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </a>
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                                                    <a
                                                        href={getMediaUrl(url)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-2 bg-white rounded-lg text-gray-700 hover:bg-gray-100"
                                                        title="View full size"
                                                    >
                                                        <ImageIcon className="h-4 w-4" />
                                                    </a>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDownloadImage(url, i)}
                                                        className="p-2 bg-white rounded-lg text-gray-700 hover:bg-gray-100"
                                                        title="Download"
                                                    >
                                                        <Download className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Customer */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/50">
                                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                    <User className="h-4 w-4" /> Customer
                                </h3>
                            </div>
                            <div className="px-4 py-4 space-y-2">
                                <p className="text-sm font-medium text-gray-900">{userName}</p>
                                {request.user?.email && (
                                    <a href={`mailto:${request.user.email}`} className="flex items-center gap-2 text-xs text-blue-600 hover:underline">
                                        <Mail className="h-3.5 w-3.5" /> {request.user.email}
                                    </a>
                                )}
                                {request.user?.phone && (
                                    <a href={`tel:${request.user.phone}`} className="flex items-center gap-2 text-xs text-blue-600 hover:underline">
                                        <Phone className="h-3.5 w-3.5" /> {request.user.phone}
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* Add quote */}
                        {request.status === 'submitted' && (
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/50">
                                    <h3 className="text-sm font-semibold text-gray-900">Add quote</h3>
                                </div>
                                <div className="px-4 py-4">
                                    {!showQuoteForm ? (
                                        <button
                                            type="button"
                                            onClick={() => setShowQuoteForm(true)}
                                            className="w-full h-10 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-gray-900 transition-all flex items-center justify-center gap-2"
                                        >
                                            <Plus className="h-4 w-4" /> Add quote
                                        </button>
                                    ) : (
                                        <form onSubmit={handleAddQuote} className="space-y-3">
                                            <div>
                                                <label className="text-xs font-semibold text-gray-500 block mb-1">Amount (GHS)</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    required
                                                    placeholder="0.00"
                                                    className="w-full h-9 px-3 border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                                    value={quoteDraft.amount}
                                                    onChange={(e) => setQuoteDraft({ ...quoteDraft, amount: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-gray-500 block mb-1">Details</label>
                                                <textarea
                                                    placeholder="Timeline, notes..."
                                                    rows={2}
                                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                                                    value={quoteDraft.details}
                                                    onChange={(e) => setQuoteDraft({ ...quoteDraft, details: e.target.value })}
                                                />
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    type="submit"
                                                    disabled={updating}
                                                    className="flex-1 h-9 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700"
                                                >
                                                    Submit
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => { setShowQuoteForm(false); setQuoteDraft({ amount: '', details: '' }); }}
                                                    className="h-9 px-4 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </form>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Existing quotes */}
                        {request.quotes?.length > 0 && (
                            <div className="bg-blue-50 rounded-2xl border border-blue-100 p-4">
                                <h3 className="text-sm font-semibold text-blue-900 mb-2">Quotes</h3>
                                {request.quotes.map((q) => (
                                    <div key={q.id} className="mb-3 last:mb-0">
                                        <p className="text-lg font-bold text-gray-900">
                                            ₵{Number(q.quote_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </p>
                                        {q.quote_details && (
                                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">{q.quote_details}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            </div>
        </DashboardLayout>
    );
}
