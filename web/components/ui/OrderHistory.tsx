'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import Link from 'next/link';
import { Package } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { GroupedList, GroupedListItem, GroupedListEmpty } from '@/components/ui/GroupedList';

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
    return 'bg-blue-50 text-blue-600';
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
        return <div className="py-10 text-center text-sm text-gray-500">Loading orders…</div>;
    }

    if (orders.length === 0) {
        return (
            <GroupedList aria-label="Order history">
                <GroupedListEmpty
                    icon={Package}
                    message="No orders yet. Start shopping to see orders here."
                    action={
                        <Link
                            href="/shop"
                            className="inline-flex items-center px-5 py-2.5 text-sm font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 transition-colors min-h-[44px]"
                        >
                            Browse products
                        </Link>
                    }
                />
            </GroupedList>
        );
    }

    return (
        <GroupedList aria-label="Order history">
            {orders.map((order) => (
                <GroupedListItem
                    key={order.id}
                    href={`/dashboard/orders/${order.id}`}
                    icon={Package}
                    title={order.order_number}
                    subtitle={new Date(order.created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                    })}
                    trailing={
                        <span className="flex flex-col items-end gap-1 shrink-0">
                            <span
                                className={`px-2 py-0.5 rounded-md text-xs font-semibold capitalize ${statusClass(order.status)}`}
                            >
                                {order.status.replace(/_/g, ' ')}
                            </span>
                            <span className="text-sm font-semibold text-gray-900 tabular-nums">
                                ₵{Number(order.total).toFixed(2)}
                            </span>
                        </span>
                    }
                />
            ))}
        </GroupedList>
    );
}
