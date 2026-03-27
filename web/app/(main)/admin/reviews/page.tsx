'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Eye, CheckCircle, XCircle, Loader2, Star, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/axios';
import Link from 'next/link';

type Review = {
    id: number;
    product_id: number;
    user_id: number;
    rating: number;
    review_text: string | null;
    is_approved: boolean;
    created_at: string;
    product?: { id: number; name: string; slug: string };
    user?: { email: string; profile?: { first_name?: string; last_name?: string } };
};

export default function AdminReviewsPage() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 0 });
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<number | null>(null);
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');

    const fetchReviews = async (page = 1) => {
        try {
            setLoading(true);
            const params: { page: number; limit: number; is_approved?: string } = { page, limit: 20 };
            if (filter === 'approved') params.is_approved = 'true';
            if (filter === 'pending') params.is_approved = 'false';
            const { data } = await api.get('/products/admin/reviews', { params });
            setReviews(data?.data ?? []);
            setMeta(data?.meta ?? { total: 0, page: 1, limit: 20, totalPages: 0 });
        } catch {
            toast.error('Failed to load reviews');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews(1);
    }, [filter]);

    const handleApprove = async (id: number, approved: boolean) => {
        setUpdatingId(id);
        try {
            await api.patch(`/products/admin/reviews/${id}`, { is_approved: approved });
            toast.success(approved ? 'Review approved' : 'Review rejected');
            fetchReviews(meta.page);
        } catch {
            toast.error('Failed to update review');
        } finally {
            setUpdatingId(null);
        }
    };

    const displayName = (r: Review) => {
        const p = r.user?.profile;
        if (p?.first_name || p?.last_name) return `${p.first_name || ''} ${p.last_name || ''}`.trim();
        return r.user?.email ?? '—';
    };

    return (
        <DashboardLayout isAdmin={true}>
            <div className="pb-6 md:pb-8">
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                    <Eye className="h-7 w-7 text-blue-600" />
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Reviews</h1>
                        <p className="text-xs text-gray-500 mt-0.5">Approve or reject product reviews (mobile-first)</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {(['all', 'pending', 'approved'] as const).map((f) => (
                        <button
                            key={f}
                            type="button"
                            onClick={() => setFilter(f)}
                            className={`min-h-[44px] px-4 rounded-xl text-sm font-medium touch-manipulation ${filter === f ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                        >
                            {f === 'all' ? 'All' : f === 'pending' ? 'Pending' : 'Approved'}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="min-h-[200px] flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
            ) : (
                <div className="space-y-3">
                    {reviews.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-500 text-sm">
                            No reviews {filter !== 'all' ? `(${filter})` : ''}.
                        </div>
                    ) : (
                        reviews.map((r) => (
                            <div key={r.id} className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5">
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                            <span className="flex items-center gap-1 text-orange-600">
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                    <Star key={i} className={`h-4 w-4 ${i < r.rating ? 'fill-current' : ''}`} />
                                                ))}
                                            </span>
                                            <span className="text-xs text-gray-500">{displayName(r)}</span>
                                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${r.is_approved ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                                {r.is_approved ? 'Approved' : 'Pending'}
                                            </span>
                                        </div>
                                        {r.product && (
                                            <Link href={`/products/${r.product.slug}`} className="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1">
                                                <Package className="h-3.5 w-3.5" />
                                                {r.product.name}
                                            </Link>
                                        )}
                                        {r.review_text && <p className="text-sm text-gray-700 mt-2 line-clamp-2">{r.review_text}</p>}
                                        <p className="text-xs text-gray-400 mt-1">{new Date(r.created_at).toLocaleDateString()}</p>
                                    </div>
                                    {!r.is_approved && (
                                        <div className="flex gap-2 flex-shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => handleApprove(r.id, true)}
                                                disabled={updatingId === r.id}
                                                className="min-h-[44px] min-w-[44px] rounded-xl bg-green-600 text-white flex items-center justify-center hover:bg-green-500 touch-manipulation disabled:opacity-50"
                                                title="Approve"
                                            >
                                                {updatingId === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-5 w-5" />}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleApprove(r.id, false)}
                                                disabled={updatingId === r.id}
                                                className="min-h-[44px] min-w-[44px] rounded-xl bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-200 touch-manipulation disabled:opacity-50"
                                                title="Reject"
                                            >
                                                <XCircle className="h-5 w-5" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                    {meta.totalPages > 1 && (
                        <div className="flex justify-center gap-2 pt-4">
                            <button
                                type="button"
                                onClick={() => fetchReviews(meta.page - 1)}
                                disabled={meta.page <= 1}
                                className="min-h-[44px] px-4 rounded-xl border border-gray-200 text-sm font-medium disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <span className="min-h-[44px] flex items-center text-sm text-gray-600">
                                Page {meta.page} of {meta.totalPages}
                            </span>
                            <button
                                type="button"
                                onClick={() => fetchReviews(meta.page + 1)}
                                disabled={meta.page >= meta.totalPages}
                                className="min-h-[44px] px-4 rounded-xl border border-gray-200 text-sm font-medium disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            )}
            </div>
        </DashboardLayout>
    );
}
