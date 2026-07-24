'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminStatGrid from '@/components/admin/AdminStatGrid';
import AdminToolbar from '@/components/admin/AdminToolbar';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { StatusBadge } from '@/components/ui/Badge';
import Link from 'next/link';
import {
    ShoppingBag,
    Package,
    Clock,
    CheckCircle,
    User,
    Plus,
    FileText,
    Eye
} from 'lucide-react';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';

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
    const { confirm, confirmDialog } = useConfirmDialog();
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
        const ok = await confirm({
            title: `Update status to ${newStatus.replace(/_/g, ' ')}?`,
            confirmLabel: 'Update',
            variant: 'primary',
        });
        if (!ok) return;
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

    const stats = [
        { label: 'Total', value: requests.length, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
        { label: 'Pending', value: pending, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
        { label: 'In progress', value: inProgress, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
        { label: 'Delivered', value: delivered, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' }
    ];

    return (
        <DashboardLayout isAdmin={true}>
            <div className="pb-6 md:pb-8">
            <AdminPageHeader
                icon={ShoppingBag}
                title="Procurement"
                subtitle="Sourcing requests"
                actions={
                    <AdminToolbar
                        searchValue={searchTerm}
                        onSearchChange={setSearchTerm}
                        searchPlaceholder="Search requests…"
                        searchAriaLabel="Search procurement requests"
                    />
                }
            />
            <AdminStatGrid items={stats} columns={4} />

            <div className="space-y-3">
                {loading ? (
                    <div className="py-10 text-center admin-card">
                        <LoadingSpinner size="sm" label="Loading" />
                    </div>
                ) : filteredRequests.length === 0 ? (
                    <div className="py-10 text-center admin-card border-dashed">
                        <ShoppingBag className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No requests found</p>
                    </div>
                ) : (
                    filteredRequests.map((req) => (
                        <div key={req.id} className="admin-card overflow-hidden hover:border-gray-300/90 transition-colors">
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
                                                <span className="text-xs bg-blue-50 text-brand px-1.5 py-0.5 rounded">
                                                    {req.reference_images.length} image{req.reference_images.length !== 1 ? 's' : ''}
                                                </span>
                                            )}
                                            <Link
                                                href={`/admin/procurement/${req.id}`}
                                                className="text-brand hover:text-brand/80 flex items-center gap-1 font-medium"
                                            >
                                                <Eye className="h-3.5 w-3.5" /> View details & images
                                            </Link>
                                        </div>
                                        {req.specifications && (
                                            <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                                                <p className="text-xs font-semibold text-gray-500 mb-1">Specifications</p>
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
                                                <p className="text-xs text-gray-500 truncate">{req.user?.email}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="lg:w-64 flex flex-col gap-3 shrink-0">
                                        <div>
                                            <p className="text-xs font-semibold text-gray-500 mb-1.5">Status</p>
                                            <Select
                                                disabled={updatingId === req.id}
                                                value={req.status}
                                                onChange={(e) => void handleStatusUpdate(req.id, e.target.value)}
                                                className="h-9 min-h-[36px] text-xs py-1.5"
                                                aria-label={`Update status for ${req.request_number}`}
                                            >
                                                <option value="submitted">Submitted</option>
                                                <option value="quote_provided">Quote provided</option>
                                                <option value="accepted">Accepted</option>
                                                <option value="payment_received">Payment received</option>
                                                <option value="processing">Processing</option>
                                                <option value="delivered">Delivered</option>
                                                <option value="cancelled">Cancelled</option>
                                            </Select>
                                        </div>

                                        {req.status === 'submitted' && quoteDraft.requestId !== req.id && (
                                            <Button
                                                type="button"
                                                size="sm"
                                                onClick={() => setQuoteDraft({ requestId: req.id, amount: '', details: '' })}
                                                leftIcon={<Plus className="h-3.5 w-3.5" />}
                                                className="w-full h-9 min-h-[36px] text-xs"
                                            >
                                                Add quote
                                            </Button>
                                        )}

                                        {quoteDraft.requestId === req.id && (
                                            <div className="bg-brand rounded-xl p-4 text-white relative">
                                                <form onSubmit={handleAddQuote} className="space-y-3">
                                                    <div>
                                                        <label className="text-xs font-semibold text-white/90 block mb-1">Amount (GHS)</label>
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
                                                        <label className="text-xs font-semibold text-white/90 block mb-1">Details</label>
                                                        <textarea
                                                            placeholder="Timeline, notes..."
                                                            rows={2}
                                                            className="w-full bg-white/10 border border-white/20 rounded-lg p-2.5 text-white text-xs placeholder:text-white/40 focus:outline-none focus:bg-white/20 resize-none"
                                                            value={quoteDraft.details}
                                                            onChange={(e) => setQuoteDraft({ ...quoteDraft, details: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="flex gap-2 pt-1">
                                                        <Button
                                                            type="submit"
                                                            size="sm"
                                                            disabled={updatingId === req.id}
                                                            loading={updatingId === req.id}
                                                            className="flex-1 h-9 min-h-[36px] text-xs bg-white text-brand hover:bg-blue-50"
                                                        >
                                                            Submit
                                                        </Button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setQuoteDraft({ requestId: null, amount: '', details: '' })}
                                                            className="h-9 w-9 flex items-center justify-center bg-white/10 text-white rounded-lg hover:bg-white/20 border border-white/20 shrink-0"
                                                            aria-label="Cancel quote"
                                                        >
                                                            <Plus className="h-3.5 w-3.5 rotate-45" />
                                                        </button>
                                                    </div>
                                                </form>
                                            </div>
                                        )}

                                        {req.quotes?.length > 0 && (
                                            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                                                <p className="text-xs font-semibold text-brand mb-1">Quote</p>
                                                <p className="text-lg font-bold text-gray-900">
                                                    ₵{Number(req.quotes[0].quote_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </p>
                                                {req.quotes[0].quote_details && (
                                                    <p className="mt-2 pt-2 border-t border-blue-200 text-xs text-gray-600 line-clamp-2">{req.quotes[0].quote_details}</p>
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
            </div>
            {confirmDialog}
        </DashboardLayout>
    );
}