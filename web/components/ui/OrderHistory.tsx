'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import Link from 'next/link';
import { Package, ChevronRight, Calendar } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface Order {
    id: number;
    order_number: string;
    total: number;
    status: string;
    created_at: string;
    items: any[];
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
                console.error("Failed to fetch orders", error);
            } finally {
                setLoading(false);
            }
        };

        if (user) fetchOrders();
    }, [user]);

    if (loading) return <div className="p-6 text-center text-sm text-gray-500">Loading...</div>;

    if (orders.length === 0) {
        return (
            <div className="text-center py-10 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <Package className="mx-auto h-10 w-10 text-gray-300" />
                <h3 className="mt-3 text-sm font-semibold text-gray-900">No orders yet</h3>
                <p className="mt-1 text-xs text-gray-500">Start shopping to see orders here.</p>
                <div className="mt-5">
                    <Link href="/shop" className="inline-flex items-center px-4 py-2.5 text-sm font-semibold rounded-xl text-white bg-blue-600 hover:bg-gray-900 transition-colors">
                        Browse products
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Orders</h3>
                <span className="text-xs text-gray-500">{orders.length} order{orders.length !== 1 ? 's' : ''}</span>
            </div>
            <ul role="list" className="divide-y divide-gray-50">
                {orders.map((order) => (
                    <li key={order.id}>
                        <Link href={`/dashboard/orders/${order.id}`} className="block hover:bg-gray-50/50 transition-colors">
                            <div className="px-4 py-3 sm:px-5">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold text-blue-600 truncate">{order.order_number}</p>
                                        <p className="flex items-center text-xs text-gray-500 mt-0.5">
                                            <Calendar className="flex-shrink-0 mr-1 h-3.5 w-3.5 text-gray-400" />
                                            {new Date(order.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="flex-shrink-0 flex flex-col items-end gap-0.5">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold capitalize ${order.status === 'delivered' ? 'bg-green-50 text-green-700' : order.status === 'cancelled' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                                            {order.status.replace('_', ' ')}
                                        </span>
                                        <p className="text-sm font-semibold text-gray-900">₵{Number(order.total).toFixed(2)}</p>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-gray-300 flex-shrink-0" aria-hidden="true" />
                                </div>
                            </div>
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}
