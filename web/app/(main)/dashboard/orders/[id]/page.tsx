'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/axios';
import Link from 'next/link';
import { ArrowLeft, Package, CheckCircle } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import toast from 'react-hot-toast';

interface OrderItem {
    id: number;
    product_name: string;
    quantity: number;
    price: number;
    total: number;
    variant_details?: string | null;
    variant?: { variant_type: string; variant_value: string } | null;
    product?: {
        images?: string[];
    };
}

interface Order {
    id: number;
    order_number: string;
    total: number;
    subtotal: number;
    shipping_fee?: number;
    tax?: number;
    discount?: number;
    status: string;
    created_at: string;
    payment_method: string;
    items: OrderItem[];
    shipping_address?: any; // Assuming address might be included or linked
    tracking?: Array<{ status: string; notes?: string; created_at: string }>;
}

const statusSteps = ['pending', 'processing', 'shipped', 'delivered'];

export default function OrderDetailsPage({ params }: { params: { id: string } }) {
    const { id } = params;
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [cancelling, setCancelling] = useState(false);
    const [requestingReturn, setRequestingReturn] = useState(false);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const { data } = await api.get(`/orders/${id}`);
                setOrder(data);
            } catch (error) {
                console.error("Failed to fetch order", error);
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchOrder();
    }, [id]);

    if (loading) return <DashboardLayout><div className="p-6 text-center text-sm text-gray-500">Loading...</div></DashboardLayout>;
    if (!order) return <DashboardLayout><div className="p-6 text-center text-sm text-gray-500">Order not found</div></DashboardLayout>;
    const canCancel = order.status === 'pending';
    const hasReturnRequest = (order.tracking || []).some((t) => t.status === 'return_requested');
    const canRequestReturn = order.status === 'delivered' && !hasReturnRequest;

    const handleCancelOrder = async () => {
        if (!canCancel) return;
        setCancelling(true);
        try {
            const { data } = await api.patch(`/orders/${order.id}/cancel`);
            setOrder(data);
            toast.success('Order cancelled');
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Failed to cancel order');
        } finally {
            setCancelling(false);
        }
    };

    const handleReturnRequest = async () => {
        if (!canRequestReturn) return;
        const reason = window.prompt('Reason for return (required):');
        if (!reason || !reason.trim()) return;
        setRequestingReturn(true);
        try {
            await api.post(`/orders/${order.id}/return-request`, { reason: reason.trim() });
            toast.success('Return request submitted');
            const { data } = await api.get(`/orders/${id}`);
            setOrder(data);
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Failed to submit return request');
        } finally {
            setRequestingReturn(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="pb-6 md:pb-8">
            <div className="mb-6 flex items-center gap-3">
                <Link href="/dashboard/orders" className="text-blue-600 hover:text-gray-900 flex items-center text-sm font-medium transition-colors">
                    <ArrowLeft className="h-4 w-4 mr-1.5" /> Orders
                </Link>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-4 py-4 sm:px-5 border-b border-gray-50 flex flex-wrap justify-between items-start gap-3 bg-gray-50/50">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">#{order.order_number}</h1>
                        <p className="text-xs text-gray-500 mt-0.5">{new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-2">
                        {canCancel && (
                            <button
                                type="button"
                                onClick={handleCancelOrder}
                                disabled={cancelling}
                                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-60"
                            >
                                {cancelling ? 'Cancelling...' : 'Cancel order'}
                            </button>
                        )}
                        {canRequestReturn && (
                            <button
                                type="button"
                                onClick={handleReturnRequest}
                                disabled={requestingReturn}
                                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 disabled:opacity-60"
                            >
                                {requestingReturn ? 'Submitting...' : 'Request return'}
                            </button>
                        )}
                        <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 capitalize">
                            {order.payment_method.replace('_', ' ')}
                        </span>
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize ${order.status === 'delivered' ? 'bg-green-50 text-green-700' :
                            order.status === 'cancelled' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                        }`}>
                            {order.status.replace('_', ' ')}
                        </span>
                    </div>
                </div>

                <div className="px-4 py-4 sm:px-5 border-b border-gray-50 bg-gray-50/30">
                    <div className="relative flex justify-between gap-2">
                        <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200" aria-hidden="true" />
                        {statusSteps.map((step, stepIdx) => {
                            const isCompleted = statusSteps.indexOf(order.status) >= stepIdx;
                            return (
                                <div key={step} className="relative flex flex-col items-center flex-1">
                                    <div className={`flex h-7 w-7 items-center justify-center rounded-full border-2 bg-white z-10 ${isCompleted ? 'border-blue-600 text-blue-600' : 'border-gray-200'}`}>
                                        {isCompleted ? <CheckCircle className="h-4 w-4" /> : <span className="h-1.5 w-1.5 rounded-full bg-transparent" />}
                                    </div>
                                    <p className={`text-xs font-medium mt-2 uppercase tracking-wider ${isCompleted ? 'text-blue-600' : 'text-gray-400'}`}>{step}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="px-4 py-4 sm:px-5">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Items</h3>
                    <ul role="list" className="divide-y divide-gray-50">
                        {order.items.map((item) => (
                            <li key={item.id} className="py-3 flex gap-3">
                                <div className="h-12 w-12 flex-shrink-0 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-center">
                                    <Package className="h-5 w-5 text-gray-400" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex justify-between gap-2">
                                        <h4 className="text-sm font-semibold text-gray-900 truncate">{item.product_name}</h4>
                                        <p className="text-sm font-semibold text-gray-900 shrink-0">₵{Number(item.total).toFixed(2)}</p>
                                    </div>
                                    {(item.variant_details || item.variant) && (
                                        <p className="text-xs text-gray-600 mt-0.5">
                                            {item.variant_details ?? `${item.variant!.variant_type}: ${item.variant!.variant_value}`.replace(/_/g, ' ')}
                                        </p>
                                    )}
                                    <p className="text-xs text-gray-500 mt-0.5">Qty {item.quantity} × ₵{Number(item.price).toFixed(2)}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="border-t border-gray-50 px-4 py-4 sm:px-5 bg-gray-50/50">
                    <div className="flex justify-end">
                        <div className="w-full sm:w-64 space-y-2">
                            <div className="flex justify-between text-sm">
                                <dt className="text-gray-500">Subtotal</dt>
                                <dd className="font-medium text-gray-900">₵{Number(order.subtotal || order.total).toFixed(2)}</dd>
                            </div>
                            <div className="flex justify-between text-sm">
                                <dt className="text-gray-500">Shipping</dt>
                                <dd className="font-medium text-gray-900">₵{Number(order.shipping_fee || 0).toFixed(2)}</dd>
                            </div>
                            <div className="flex justify-between text-sm pt-2 border-t border-gray-100">
                                <dt className="font-semibold text-gray-900">Total</dt>
                                <dd className="font-bold text-gray-900">₵{Number(order.total).toFixed(2)}</dd>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            </div>
        </DashboardLayout>
    );
}
