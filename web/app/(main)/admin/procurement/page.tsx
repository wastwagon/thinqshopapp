'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Link from 'next/link';
import {
    ShoppingBag,
    Search,
    Package,
    Clock,
    CheckCircle,
    User,
    Plus,
    ChevronRight,
    FileText,
    Eye
} from 'lucide-react';

interface ProcurementRequest {
    id: number;
    request_number: string;
    description: string;
    specifications?: string;
    quantity: number;
    budget_range?: string;
    status: string;
    created_at: string;
    reference_images?: string[] | null;
    user: {
        email: string;
        profile?: { first_name?: string; last_name?: string };
    };
    quotes: any[];
}

export default function AdminProcurementPage() {
    const [requests, setRequests] = useState<ProcurementRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [quoteDraft, setQuoteDraft] = useState<{ requestId: number | null; amount: string; details: string }>({
        requestId: null,
        amount: '',
        details: ''
    });

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const { data } = await api.get('/procurement/admin/requests');
            setRequests(Array.isArray(data) ? data : []);
        } catch {
            toast.error('Failed to load procurement requests');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id: number, newStatus: string) => {
        if (!confirm(`Update status to ${newStatus.replace(/_/g, ' ')}?`)) return;
        setUpdatingId(id);
        try {
            await api.patch(`/procurement/admin/${id}/status`, { status: newStatus });
            toast.success('Status updated');
            fetchRequests();
        } catch {
            toast.error('Failed to update status');
        } finally {
            setUpdatingId(null);
        }
    };

    const handleAddQuote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!quoteDraft.requestId || !quoteDraft.amount) return;
        setUpdatingId(quoteDraft.requestId);
        try {
            await api.post(`/procurement/admin/${quoteDraft.requestId}/quote`, {
                amount: parseFloat(quoteDraft.amount),
                details: quoteDraft.details
            });
            toast.success('Quote submitted');
            setQuoteDraft({ requestId: null, amount: '', details: '' });
            fetchRequests();
        } catch {
            toast.error('Failed to submit quote');
        } finally {
            setUpdatingId(null);
        }
    };

    const filteredRequests = requests.filter(
        (req) =>
            req.request_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            req.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            req.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const pending = requests.filter((r) => r.status === 'submitted' || r.status === 'quote_provided').length;
    const inProgress = requests.filter((r) => ['accepted', 'payment_received', 'processing'].includes(r.status)).length;
    const delivered = requests.filter((r) => r.status === 'delivered').length;

    const StatusBadge = ({ status }: { status: string }) => {
        const colors: Record<string, string> = {
            submitted: 'bg-amber-50 text-amber-700 border-amber-200',
            quote_provided: 'bg-blue-50 text-blue-700 border-blue-200',
            accepted: 'bg-green-50 text-green-700 border-green-200',
            payment_received: 'bg-indigo-50 text-indigo-700 border-indigo-200',
            processing: 'bg-purple-50 text-purple-700 border-purple-200',
            delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            cancelled: 'bg-red-50 text-red-700 border-red-200'
        };
        return (
            <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-lg border ${colors[status] || 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                {status.replace(/_/g, ' ')}
            </span>
        );
    };

    const stats = [
        { label: 'Total', value: requests.length, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
        { label: 'Pending', value: pending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
        { label: 'In progress', value: inProgress, icon: Package, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
        { label: 'Delivered', value: delivered, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' }
    ];

    return (
        <DashboardLayout isAdmin={true}>
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                    <ShoppingBag className="h-7 w-7 text-blue-600" />
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Procurement</h1>
                        <p className="text-xs text-gray-500 mt-0.5">Sourcing requests</p>
                    </div>
                </div>
                <div className="relative min-w-0 sm:w-56">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search requests..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full h-9 pl-9 pr-3 bg-white border border-gray-100 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                        <div className={`w-9 h-9 rounded-lg ${stat.bg} ${stat.border} border flex items-center justify-center ${stat.color} mb-2`}>
                            <stat.icon className="h-4 w-4" />
                        </div>
                        <p className="text-[10px] font-semibold text-gray-500 mb-0.5">{stat.label}</p>
                        <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                ))}
            </div>

            <div className="space-y-3">
                {loading ? (
                    <div className="py-10 text-center bg-white rounded-xl border border-gray-100 shadow-sm">
                        <div className="animate-spin h-7 w-7 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Loading...</p>
                    </div>
                ) : filteredRequests.length === 0 ? (
                    <div className="py-10 text-center bg-white rounded-xl border border-dashed border-gray-200">
                        <ShoppingBag className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No requests found</p>
                    </div>
                ) : (
                    filteredRequests.map((req) => (
                        <div key={req.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all">
                            <div className="p-4 lg:p-5">
                                <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                                    <div className="flex-1 min-w-0 space-y-3">
                                        <div className="flex flex-wrap items-center gap-2 gap-y-1">
                                            <h3 className="text-sm font-bold text-gray-900 truncate">{req.description}</h3>
                                            <StatusBadge status={req.status} />
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                                            <span>Qty: {req.quantity}</span>
                                            <span>{new Date(req.created_at).toLocaleDateString()}</span>
                                            <span className="font-medium text-gray-600">{req.request_number}</span>
                                            {Array.isArray(req.reference_images) && req.reference_images.length > 0 && (
                                                <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
                                                    {req.reference_images.length} image{req.reference_images.length !== 1 ? 's' : ''}
                                                </span>
                                            )}
                                            <Link
                                                href={`/admin/procurement/${req.id}`}
                                                className="text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium"
                                            >
                                                <Eye className="h-3.5 w-3.5" /> View details & images
                                            </Link>
                                        </div>
                                        {req.specifications && (
                                            <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                                                <p className="text-[10px] font-semibold text-gray-500 mb-1">Specifications</p>
                                                <p className="text-gray-600 text-xs leading-relaxed whitespace-pre-wrap line-clamp-3">{req.specifications}</p>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2 pt-2 border-t border-gray-50">
                                            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                                                <User className="h-3.5 w-3.5 text-gray-500" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-semibold text-gray-900 truncate">
                                                    {[req.user?.profile?.first_name, req.user?.profile?.last_name].filter(Boolean).join(' ') || 'Customer'}
                                                </p>
                                                <p className="text-[10px] text-gray-500 truncate">{req.user?.email}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="lg:w-64 flex flex-col gap-3 shrink-0">
                                        <div>
                                            <p className="text-[10px] font-semibold text-gray-500 mb-1.5">Status</p>
                                            <div className="relative">
                                                <select
                                                    disabled={updatingId === req.id}
                                                    className="w-full h-9 bg-gray-50 border border-gray-100 text-xs font-semibold text-gray-700 rounded-lg pl-3 pr-8 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                                    value={req.status}
                                                    onChange={(e) => handleStatusUpdate(req.id, e.target.value)}
                                                >
                                                    <option value="submitted">Submitted</option>
                                                    <option value="quote_provided">Quote provided</option>
                                                    <option value="accepted">Accepted</option>
                                                    <option value="payment_received">Payment received</option>
                                                    <option value="processing">Processing</option>
                                                    <option value="delivered">Delivered</option>
                                                    <option value="cancelled">Cancelled</option>
                                                </select>
                                                <ChevronRight className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none rotate-90" aria-hidden />
                                            </div>
                                        </div>

                                        {req.status === 'submitted' && quoteDraft.requestId !== req.id && (
                                            <button
                                                type="button"
                                                onClick={() => setQuoteDraft({ requestId: req.id, amount: '', details: '' })}
                                                className="w-full h-9 bg-blue-600 text-white rounded-lg font-semibold text-xs hover:bg-gray-900 transition-all flex items-center justify-center gap-1.5"
                                            >
                                                <Plus className="h-3.5 w-3.5" /> Add quote
                                            </button>
                                        )}

                                        {quoteDraft.requestId === req.id && (
                                            <div className="bg-blue-600 rounded-xl p-4 text-white relative">
                                                <form onSubmit={handleAddQuote} className="space-y-3">
                                                    <div>
                                                        <label className="text-[10px] font-semibold text-blue-100 block mb-1">Amount (GHS)</label>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            required
                                                            placeholder="0.00"
                                                            className="w-full h-9 bg-white/10 border border-white/20 rounded-lg px-3 text-white text-sm font-semibold placeholder:text-white/40 focus:outline-none focus:bg-white/20"
                                                            value={quoteDraft.amount}
                                                            onChange={(e) => setQuoteDraft({ ...quoteDraft, amount: e.target.value })}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-semibold text-blue-100 block mb-1">Details</label>
                                                        <textarea
                                                            placeholder="Timeline, notes..."
                                                            rows={2}
                                                            className="w-full bg-white/10 border border-white/20 rounded-lg p-2.5 text-white text-xs placeholder:text-white/40 focus:outline-none focus:bg-white/20 resize-none"
                                                            value={quoteDraft.details}
                                                            onChange={(e) => setQuoteDraft({ ...quoteDraft, details: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="flex gap-2 pt-1">
                                                        <button
                                                            type="submit"
                                                            disabled={updatingId === req.id}
                                                            className="flex-1 h-9 bg-white text-blue-600 rounded-lg font-semibold text-xs hover:bg-blue-50 transition-all"
                                                        >
                                                            Submit
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setQuoteDraft({ requestId: null, amount: '', details: '' })}
                                                            className="h-9 w-9 flex items-center justify-center bg-white/10 text-white rounded-lg hover:bg-white/20 border border-white/20 shrink-0"
                                                        >
                                                            <Plus className="h-3.5 w-3.5 rotate-45" />
                                                        </button>
                                                    </div>
                                                </form>
                                            </div>
                                        )}

                                        {req.quotes?.length > 0 && (
                                            <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                                                <p className="text-[10px] font-semibold text-blue-600 mb-1">Quote</p>
                                                <p className="text-lg font-bold text-gray-900">
                                                    ₵{Number(req.quotes[0].quote_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </p>
                                                {req.quotes[0].quote_details && (
                                                    <p className="mt-2 pt-2 border-t border-blue-100 text-[10px] text-gray-600 line-clamp-2">{req.quotes[0].quote_details}</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </DashboardLayout>
    );
}