'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import ShopLayout from '@/components/layout/ShopLayout';
import ThankYouCard from '@/components/thank-you/ThankYouCard';
import api from '@/lib/axios';

interface OrderDetail {
    id: number;
    order_number: string;
    total: string | number;
    status: string;
    payment_status: string;
}

export default function OrderSuccessPage() {
    const searchParams = useSearchParams();
    const orderParam = searchParams.get('order');
    const [order, setOrder] = useState<OrderDetail | null>(null);
    const [loading, setLoading] = useState(!!orderParam);

    useEffect(() => {
        if (!orderParam) return;
        const id = Number(orderParam);
        if (Number.isNaN(id)) {
            setLoading(false);
            return;
        }
        api.get(`/orders/${id}`)
            .then((res) => setOrder(res.data))
            .catch(() => setOrder(null))
            .finally(() => setLoading(false));
    }, [orderParam]);

    const details = [
        { label: 'Order number', value: loading ? '…' : order?.order_number ?? orderParam ?? '—' },
        { label: 'Total paid', value: loading ? '…' : order ? `₵${Number(order.total).toFixed(2)}` : '—' },
        { label: 'Status', value: loading ? '…' : (order?.status || 'confirmed').replace(/_/g, ' ') },
    ];

    return (
        <ShopLayout>
            <div className="min-h-[80vh] flex items-center justify-center px-4 py-6 sm:py-10 safe-area-inset-bottom bg-gradient-to-b from-gray-50 to-white">
                <ThankYouCard
                    title="Thank you for your order"
                    subtitle="Your payment was successful. We have received your order and will prepare it for shipping."
                    details={details}
                    primaryAction={{ label: 'View my orders', href: '/dashboard/orders', icon: ShoppingBag }}
                    secondaryAction={{ label: 'Continue shopping', href: '/shop', icon: ArrowRight }}
                    accentColor="emerald"
                />
            </div>
        </ShopLayout>
    );
}
