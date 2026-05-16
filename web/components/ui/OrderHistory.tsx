'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import Link from 'next/link';
import { Package, ChevronRight, Calendar } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { GroupedList } from '@/components/ui/GroupedList';

interface Order {
    id: number;
    order_number: string;
    total: number;
    status: string;
    created_at: string;
    items: unknown[];
}

function statusClass(status: string) {
    if (status === 'delivered') return 'bg-green-50 text-green-700';
    if (status === 'cancelled') return 'bg-red-50 text-red-600';
    return 'bg-brand/5 text-brand';
}

export default function OrderHistory() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const { data } = await api.get('/orders');
                setOrders(data);
            } catch (error) {
                console.error('Failed to fetch orders', error);
            } finally {
                setLoading(false);
            }
        };

        if (user) fetchOrders();
    }, [user]);

    if (loading) {
        return <div className="py-10 text-center text-sm text-gray-500">Loading...</div>;
    }

    if (orders.length === 0) {
        return (
            <div className="flat-card py-12 px-6 text-center">
                <Package className="mx-auto h-10 w-10 text-gray-300" />
                <h3 className="mt-3 text-sm font-semibold text-gray-900">No orders yet</h3>
                <p className="mt-1 text-xs text-gray-500">Start shopping to see orders here.</p>
                <Link
                    href="/shop"
                    className="inline-flex mt-5 items-center px-5 py-2.5 text-sm font-semibold rounded-xl text-white bg-brand hover:bg-brand/90 transition-colors"
                >
                    Browse products
                </Link>
            </div>
        );
    }

    return (
        <GroupedList aria-label="Order history">
            {orders.map((order) => (
                    <Link
                        key={order.id}
                        href={`/dashboard/orders/${order.id}`}
                        className="flex items-center gap-3 w-full px-4 py-3.5 min-h-[52px] bg-white transition-colors active:bg-gray-50 hover:bg-gray-50/80"
                    >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-600">
                            <Package className="h-4 w-4" aria-hidden />
                        </span>
                        <span className="flex-1 min-w-0 text-left">
                            <span className="block text-[15px] font-medium text-gray-900 truncate">{order.order_number}</span>
                            <span className="flex items-center text-xs text-gray-500 mt-0.5 gap-1">
                                <Calendar className="h-3 w-3 shrink-0" aria-hidden />
                                {new Date(order.created_at).toLocaleDateString()}
                            </span>
                        </span>
                        <span className="flex flex-col items-end gap-1 shrink-0">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold capitalize ${statusClass(order.status)}`}>
                                {order.status.replace(/_/g, ' ')}
                            </span>
                            <span className="text-sm font-semibold text-gray-900">₵{Number(order.total).toFixed(2)}</span>
                        </span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" aria-hidden />
                    </Link>
            ))}
        </GroupedList>
    );
}
