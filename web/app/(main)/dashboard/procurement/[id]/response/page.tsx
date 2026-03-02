'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/axios';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Link from 'next/link';
import { ArrowLeft, Printer, ShoppingBag, FileText, DollarSign, Package } from 'lucide-react';
import toast from 'react-hot-toast';

interface Quote {
    id: number;
    quote_amount: string;
    quote_details: string | null;
    status: string;
    created_at: string;
}

interface Order {
    id: number;
    order_number: string;
    amount: string;
    status: string;
}

interface Request {
    id: number;
    request_number: string;
    description: string;
    specifications: string | null;
    quantity: number | null;
    budget_range: string | null;
    status: string;
    created_at: string;
    quotes: Quote[];
    orders: Order[];
}

export default function ProcurementResponsePage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;
    const [request, setRequest] = useState<Request | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        (async () => {
            try {
                const { data } = await api.get(`/procurement/user/request/${id}`);
                setRequest(data);
            } catch {
                toast.error('Request not found');
                router.replace('/dashboard/procurement');
            } finally {
                setLoading(false);
            }
        })();
    }, [id, router]);

    const handlePrint = () => {
        window.print();
    };

    if (loading || !request) {
        return (
            <DashboardLayout>
                <div className="max-w-3xl mx-auto py-12 flex flex-col items-center justify-center min-h-[40vh] print:hidden">
                    {loading && (
                        <>
                            <div className="animate-spin h-10 w-10 border-2 border-blue-600 border-t-transparent rounded-full mb-4" />
                            <p className="text-sm text-gray-500">Loading response…</p>
                        </>
                    )}
                    {!loading && !request && <p className="text-sm text-gray-500">Request not found.</p>}
                </div>
            </DashboardLayout>
        );
    }

    const quote = request.quotes?.[0];
    const order = request.orders?.[0];

    return (
        <DashboardLayout>
            <div className="max-w-3xl mx-auto pb-6 md:pb-8">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-8 print:hidden">
                    <Link
                        href="/dashboard/procurement"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900"
                    >
                        <ArrowLeft className="h-4 w-4" /> Back to procurement
                    </Link>
                    <button
                        type="button"
                        onClick={handlePrint}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-blue-600 transition-colors"
                    >
                        <Printer className="h-4 w-4" /> Print / Save as PDF
                    </button>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden print:shadow-none print:border print:rounded-lg">
                    <div className="p-8 md:p-10 border-b border-gray-100 bg-gradient-to-b from-gray-50 to-white">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center">
                                <ShoppingBag className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Procurement response</h1>
                                <p className="text-sm text-gray-500">{request.request_number}</p>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            Generated on {new Date().toLocaleDateString(undefined, { dateStyle: 'long' })}. Share this with your team or suppliers.
                        </p>
                    </div>

                    <div className="p-8 md:p-10 space-y-8">
                        <section>
                            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <FileText className="h-3.5 w-3.5" /> Request details
                            </h2>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Description</p>
                                    <p className="text-gray-900 font-medium">{request.description}</p>
                                </div>
                                {request.specifications && (
                                    <div>
                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Specifications</p>
                                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{request.specifications}</p>
                                    </div>
                                )}
                                <div className="flex flex-wrap gap-4 text-sm">
                                    {request.quantity != null && (
                                        <div>
                                            <p className="text-gray-500">Quantity</p>
                                            <p className="font-semibold text-gray-900">{request.quantity}</p>
                                        </div>
                                    )}
                                    {request.budget_range && (
                                        <div>
                                            <p className="text-gray-500">Budget range</p>
                                            <p className="font-semibold text-gray-900">{request.budget_range}</p>
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-gray-500">Date</p>
                                        <p className="font-semibold text-gray-900">{new Date(request.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Status</p>
                                        <p className="font-semibold text-gray-900 capitalize">{request.status.replace(/_/g, ' ')}</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {quote && (
                            <section className="rounded-xl border border-gray-200 bg-gray-50/50 p-6">
                                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <DollarSign className="h-3.5 w-3.5" /> Admin quote
                                </h2>
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div>
                                        <p className="text-2xl font-bold text-gray-900">₵{Number(quote.quote_amount).toFixed(2)}</p>
                                        <p className="text-xs text-gray-500 mt-1">Quote date: {new Date(quote.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                                    </div>
                                    <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                                        {quote.status.toUpperCase()}
                                    </span>
                                </div>
                                {quote.quote_details && (
                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Details</p>
                                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{quote.quote_details}</p>
                                    </div>
                                )}
                            </section>
                        )}

                        {order && (
                            <section className="rounded-xl border border-gray-200 bg-green-50/30 p-6">
                                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <Package className="h-3.5 w-3.5" /> Order
                                </h2>
                                <div className="flex flex-wrap items-center gap-4">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900">{order.order_number}</p>
                                        <p className="text-xs text-gray-500">Amount: ₵{Number(order.amount).toFixed(2)}</p>
                                    </div>
                                    <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-50 text-green-700 border border-green-100 capitalize">
                                        {order.status.replace(/_/g, ' ')}
                                    </span>
                                </div>
                            </section>
                        )}

                        {!quote && (
                            <p className="text-sm text-gray-500 italic">No quote has been provided yet. Check back later or contact support.</p>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
