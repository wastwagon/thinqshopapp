'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import Link from 'next/link';
import { Package } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { GroupedList, GroupedListItem, GroupedListEmpty } from '@/components/ui/GroupedList';
import { StatusBadge } from '@/components/ui/Badge';
import { buttonVariants } from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface Order {
    id: number;
    order_number: string;
    total: number;
    status: string;
    created_at: string;
    items: unknown[];
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
        return (
            <div className="py-10 flex justify-center">
                <LoadingSpinner size="sm" label="Loading orders…" />
            </div>
        );
    }

    if (orders.length === 0) {
        return (
            <GroupedList aria-label="Order history">
                <GroupedListEmpty
                    icon={Package}
                    message="No orders yet. Start shopping to see orders here."
                    action={
                        <Link href="/shop" className={buttonVariants({ variant: 'primary', size: 'md' })}>
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
                            <StatusBadge status={order.status} className="capitalize" />
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
