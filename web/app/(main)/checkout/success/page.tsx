'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Truck, ArrowRight, ShieldCheck, Zap, ShoppingBag } from 'lucide-react';
import ShopLayout from '@/components/layout/ShopLayout';
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

    return (
        <ShopLayout>
            <div className="min-h-[80vh] flex items-center justify-center px-4 relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 blur-[120px] rounded-full pointer-events-none opacity-40 animate-pulse" />

                <div className="max-w-2xl w-full relative z-10 text-center">
                    <div className="glass rounded-[3.5rem] p-16 border-white/5 bg-white/[0.02]">
                        <div className="mb-12 relative flex justify-center">
                            <div className="w-24 h-24 bg-primary rounded-[2rem] flex items-center justify-center shadow-2xl shadow-primary/40 relative z-10 animate-bounce">
                                <CheckCircle className="h-12 w-12 text-white" strokeWidth={3} />
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center opacity-20">
                                <div className="w-40 h-40 bg-primary blur-3xl rounded-full" />
                            </div>
                        </div>

                        <div className="mb-12">
                            <h1 className="text-5xl font-black text-white tracking-tighter leading-none mb-6">Thank you for your order</h1>
                            <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em] font-mono leading-relaxed px-10">
                                Your payment was successful. We have received your order and will prepare it for shipping.
                            </p>
                        </div>

                        {(loading || order) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
                                <div className="glass p-6 rounded-[2rem] border-white/10 bg-white/[0.05] text-left">
                                    <p className="text-[10px] font-black text-white/30 uppercase tracking-widest font-mono mb-2">Order number</p>
                                    <p className="text-sm font-black text-white font-mono break-all uppercase">
                                        {loading ? '…' : order?.order_number ?? orderParam ?? '—'}
                                    </p>
                                </div>
                                <div className="glass p-6 rounded-[2rem] border-white/10 bg-white/[0.05] text-left">
                                    <p className="text-[10px] font-black text-white/30 uppercase tracking-widest font-mono mb-2">Total paid</p>
                                    <p className="text-sm font-black text-white uppercase tracking-tight">
                                        {loading ? '…' : order ? `₵${Number(order.total).toFixed(2)}` : '—'}
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col gap-4">
                            <Link
                                href="/dashboard/orders"
                                className="w-full bg-white text-black h-16 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-white/90 transition-all shadow-xl flex items-center justify-center gap-3"
                            >
                                <ShoppingBag className="h-4 w-4" />
                                View my orders
                            </Link>
                            <Link
                                href="/shop"
                                className="w-full h-16 rounded-[1.5rem] border border-white/5 text-white/40 font-black text-[10px] uppercase tracking-widest hover:bg-white/5 hover:text-white transition-all flex items-center justify-center gap-3"
                            >
                                Continue shopping
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>

                    <div className="mt-12 flex items-center justify-center gap-8 text-white/10">
                        <div className="flex items-center gap-3">
                            <ShieldCheck className="h-4 w-4" />
                            <span className="text-[9px] font-black tracking-widest uppercase">Secured payment</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Zap className="h-4 w-4" />
                            <span className="text-[9px] font-black tracking-widest uppercase">Paystack</span>
                        </div>
                    </div>
                </div>
            </div>
        </ShopLayout>
    );
}
