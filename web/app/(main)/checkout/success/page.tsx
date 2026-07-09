'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShoppingBag, ArrowRight, Package, Truck, CheckCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import ShopLayout from '@/components/layout/ShopLayout';
import ThankYouCard from '@/components/thank-you/ThankYouCard';
import ShopSuccessShell, { ShopLoadingState, ShopEmptyState } from '@/components/shop/ShopSuccessShell';
import PriceDisplay from '@/components/ui/PriceDisplay';
import api from '@/lib/axios';
import { useCart } from '@/context/CartContext';
import { getMediaUrl } from '@/lib/media';
import toast from 'react-hot-toast';

interface OrderItem {
    id: number;
    product_name: string;
    quantity: number;
    total: number | string;
    variant_details?: string | null;
    product?: {
        images?: string[] | string;
        gallery_images?: string[];
    };
}

interface OrderDetail {
    id: number;
    order_number: string;
    total: string | number;
    subtotal?: string | number;
    shipping_fee?: string | number;
    status: string;
    payment_status: string;
    payment_method?: string;
    created_at: string;
    items?: OrderItem[];
}

const fulfillmentSteps = [
    { key: 'confirmed', label: 'Order confirmed', icon: CheckCircle },
    { key: 'processing', label: 'Processing for shipment', icon: Package },
    { key: 'shipped', label: 'Shipped', icon: Truck },
    { key: 'delivered', label: 'Delivered', icon: CheckCircle },
];

function stepIndex(status: string): number {
    const normalized = (status || 'processing').toLowerCase();
    if (normalized === 'pending') return 0;
    if (normalized === 'processing') return 1;
    if (normalized === 'shipped' || normalized === 'out_for_delivery') return 2;
    if (normalized === 'delivered') return 3;
    return 1;
}

function itemImage(item: OrderItem): string {
    const product = item.product;
    const raw =
        product?.gallery_images?.[0] ||
        (Array.isArray(product?.images) ? product?.images[0] : product?.images) ||
        '';
    return raw ? getMediaUrl(String(raw)) : '/placeholder.svg';
}

export default function OrderSuccessPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { clearCart } = useCart();
    const orderParam = searchParams.get('order');
    const [order, setOrder] = useState<OrderDetail | null>(null);
    const [loading, setLoading] = useState(!!orderParam);

    useEffect(() => {
        clearCart().catch(() => {});
    }, [clearCart]);

    useEffect(() => {
        if (!orderParam) {
            setLoading(false);
            return;
        }
        const id = Number(orderParam);
        if (Number.isNaN(id)) {
            setLoading(false);
            return;
        }
        api.get(`/orders/${id}`)
            .then((res) => setOrder(res.data))
            .catch(() => {
                toast.error('Order not found');
                router.replace('/shop');
            })
            .finally(() => setLoading(false));
    }, [orderParam, router]);

    if (!orderParam) {
        return (
            <ShopLayout>
                <ShopEmptyState message="No order reference provided." href="/shop" linkLabel="Continue shopping" />
            </ShopLayout>
        );
    }

    if (loading || !order) {
        return (
            <ShopLayout>
                <ShopLoadingState message="Loading your confirmation…" />
            </ShopLayout>
        );
    }

    const activeStep = stepIndex(order.status);
    const itemCount = order.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
    const paymentLabel = (order.payment_method || 'paid').replace(/_/g, ' ');

    return (
        <ShopLayout>
            <div className="bg-white min-h-full pb-8">
                <ShopSuccessShell>
                    <ThankYouCard
                        title="Order confirmed"
                        subtitle="Thank you for your purchase. Your order has been received and is being processed for shipment. We will notify you when it ships."
                        details={[
                            { label: 'Order number', value: order.order_number },
                            { label: 'Items', value: `${itemCount} item${itemCount === 1 ? '' : 's'}` },
                            { label: 'Total paid', value: <PriceDisplay amountGhs={Number(order.total)} forceGhs /> },
                            { label: 'Payment', value: paymentLabel },
                            {
                                label: 'Date',
                                value: new Date(order.created_at).toLocaleString(undefined, {
                                    dateStyle: 'medium',
                                    timeStyle: 'short',
                                }),
                            },
                        ]}
                        primaryAction={{
                            label: 'View order details',
                            href: `/dashboard/orders/${order.id}`,
                            icon: ShoppingBag,
                        }}
                        secondaryAction={{ label: 'Continue shopping', href: '/shop', icon: ArrowRight }}
                        accentColor="amber"
                    />

                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                        className="rounded-2xl bg-white border border-gray-100 shadow-[0_4px_24px_-12px_rgba(0,0,0,0.08)] p-5 sm:p-6"
                    >
                        <h2 className="text-sm font-bold text-gray-900 mb-4">What happens next</h2>
                        <ol className="space-y-4">
                            {fulfillmentSteps.map((step, index) => {
                                const done = index <= activeStep;
                                const current = index === activeStep;
                                const Icon = step.icon;
                                return (
                                    <li key={step.key} className="flex items-start gap-3">
                                        <div
                                            className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${
                                                done
                                                    ? 'bg-orange-50 border-orange-200 text-orange-600'
                                                    : 'bg-gray-50 border-gray-200 text-gray-400'
                                            }`}
                                        >
                                            <Icon className="h-4 w-4" aria-hidden />
                                        </div>
                                        <div className="min-w-0 pt-0.5">
                                            <p className={`text-sm font-semibold ${done ? 'text-gray-900' : 'text-gray-400'}`}>
                                                {step.label}
                                            </p>
                                            {current && (
                                                <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                                                    <Clock className="h-3 w-3 shrink-0" aria-hidden />
                                                    Current step — we are preparing your items for dispatch.
                                                </p>
                                            )}
                                        </div>
                                    </li>
                                );
                            })}
                        </ol>
                    </motion.div>

                    {order.items && order.items.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.45, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
                            className="rounded-2xl bg-white border border-gray-100 shadow-[0_4px_24px_-12px_rgba(0,0,0,0.08)] overflow-hidden"
                        >
                            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                                <h2 className="text-sm font-bold text-gray-900">Order summary</h2>
                            </div>
                            <ul className="divide-y divide-gray-50">
                                {order.items.map((item) => (
                                    <li key={item.id} className="flex items-center gap-3 px-5 py-4">
                                        <div className="h-14 w-14 shrink-0 rounded-xl border border-gray-100 bg-gray-50 overflow-hidden">
                                            <img
                                                src={itemImage(item)}
                                                alt=""
                                                className="h-full w-full object-contain p-1.5"
                                            />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-semibold text-gray-900 line-clamp-2">{item.product_name}</p>
                                            {item.variant_details && (
                                                <p className="text-xs text-gray-500 mt-0.5">{item.variant_details}</p>
                                            )}
                                            <p className="text-xs text-gray-500 mt-1">Qty {item.quantity}</p>
                                        </div>
                                        <p className="text-sm font-semibold text-gray-900 shrink-0">
                                            <PriceDisplay amountGhs={Number(item.total)} forceGhs />
                                        </p>
                                    </li>
                                ))}
                            </ul>
                            {(order.shipping_fee != null || order.subtotal != null) && (
                                <div className="px-5 py-4 border-t border-gray-100 space-y-2 text-sm">
                                    {order.subtotal != null && (
                                        <div className="flex justify-between text-gray-600">
                                            <span>Subtotal</span>
                                            <PriceDisplay amountGhs={Number(order.subtotal)} forceGhs />
                                        </div>
                                    )}
                                    {order.shipping_fee != null && (
                                        <div className="flex justify-between text-gray-600">
                                            <span>Shipping</span>
                                            <PriceDisplay amountGhs={Number(order.shipping_fee)} forceGhs />
                                        </div>
                                    )}
                                    <div className="flex justify-between font-semibold text-gray-900 pt-2 border-t border-gray-100">
                                        <span>Total</span>
                                        <PriceDisplay amountGhs={Number(order.total)} forceGhs />
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}

                    <p className="text-center text-xs text-gray-500 pb-2">
                        Track your order anytime from{' '}
                        <Link href="/dashboard/orders" className="text-blue-600 font-semibold hover:underline">
                            Order history
                        </Link>
                        .
                    </p>
                </ShopSuccessShell>
            </div>
        </ShopLayout>
    );
}
