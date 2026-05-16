'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Truck, Package, Send, Shield, RefreshCw, ShoppingCart, ChevronRight } from 'lucide-react';
import api from '@/lib/axios';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

export default function DashboardPage() {
    const { isAuthenticated, user, loading: authLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams(window.location.search);
        if (params.get('error') !== 'admin_required') return;
        toast.error('You need an admin account to access that area.');
        router.replace('/dashboard');
    }, [router]);

    const [stats, setStats] = useState({
        walletBalance: '0.00',
        activeShipments: 0,
        totalOrders: 0,
        totalTransfers: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (authLoading) return;
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }

        const fetchStats = async () => {
            try {
                const [walletRes, shipmentsRes, ordersRes, transRes] = await Promise.all([
                    api.get('/finance/wallet'),
                    api.get('/logistics/history'),
                    api.get('/orders').catch(() => ({ data: [] })),
                    api.get('/finance/transfers'),
                ]);

                const shipments = shipmentsRes.data || [];
                const orders = ordersRes.data || [];
                const transfers = transRes.data || [];

                setStats({
                    walletBalance: Number(walletRes.data.balance_ghs).toFixed(2),
                    activeShipments: shipments.filter((s: { status?: string }) => s.status !== 'delivered').length,
                    totalOrders: Array.isArray(orders) ? orders.length : 0,
                    totalTransfers: Array.isArray(transfers) ? transfers.length : 0,
                });
            } catch (error) {
                console.error('Failed to fetch stats', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [isAuthenticated, authLoading, router]);

    if (authLoading || loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[50vh] py-8">
                    <div className="text-gray-500 text-sm animate-pulse">Loading...</div>
                </div>
            </DashboardLayout>
        );
    }

    const kpiCards = [
        { label: 'In transit', value: stats.activeShipments, icon: Truck, href: '/dashboard/logistics', color: 'blue' },
        { label: 'Orders', value: stats.totalOrders, icon: Package, href: '/dashboard/orders', color: 'emerald' },
        { label: 'Transfers', value: stats.totalTransfers, icon: Send, href: '/dashboard/transfers', color: 'violet' },
        { label: 'Identity', value: 'Verified', icon: Shield, href: null, color: 'slate', isText: true },
    ];

    const colorClasses: Record<string, string> = {
        blue: 'bg-brand/5 border-brand/20 text-brand',
        emerald: 'bg-emerald-50 border-emerald-100 text-emerald-600',
        violet: 'bg-violet-50 border-violet-100 text-violet-600',
        slate: 'bg-slate-50 border-slate-100 text-slate-600',
    };

    return (
        <DashboardLayout>
            <div className="pb-6 md:pb-8">
                <header className="mb-5 px-1">
                    <h1 className="page-title">Dashboard</h1>
                    <p className="page-subtitle flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full" aria-hidden />
                        {user?.email}
                    </p>
                </header>

                <div className="flat-card border-l-4 border-l-brand p-4 md:p-5 mb-4">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-brand text-xs font-medium">Wallet</p>
                            <div className="flex items-baseline gap-1 mt-0.5">
                                <span className="text-2xl md:text-3xl font-semibold tracking-tight text-gray-900">
                                    ₵{stats.walletBalance.split('.')[0]}
                                </span>
                                <span className="text-sm text-gray-400">.{stats.walletBalance.split('.')[1]}</span>
                            </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                            <Link
                                href="/dashboard/wallet"
                                className="h-9 px-4 bg-brand text-white rounded-xl flex items-center font-semibold text-xs hover:bg-brand/90 transition-colors"
                            >
                                Deposit
                            </Link>
                            <button
                                type="button"
                                className="h-9 w-9 bg-gray-50 border border-gray-200/80 rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
                                aria-label="Refresh"
                            >
                                <RefreshCw className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5">
                    {kpiCards.map((card) => {
                        const Icon = card.icon;
                        const color = colorClasses[card.color] || colorClasses.slate;
                        const inner = (
                            <div
                                className={`rounded-xl p-3 md:p-4 border ${
                                    card.href ? 'flat-card-interactive cursor-pointer' : 'bg-gray-50/80 border-gray-200/90'
                                }`}
                            >
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center border mb-2 ${color}`}>
                                    <Icon className="h-4 w-4" />
                                </div>
                                <p className="text-xs font-medium text-gray-500 truncate">{card.label}</p>
                                <p className="text-lg md:text-xl font-semibold text-gray-900 mt-0.5 truncate">
                                    {card.isText ? String(card.value) : card.value}
                                </p>
                            </div>
                        );
                        return card.href ? (
                            <Link key={card.label} href={card.href}>
                                {inner}
                            </Link>
                        ) : (
                            <div key={card.label}>{inner}</div>
                        );
                    })}
                </div>

                <Link
                    href="/shop"
                    className="flat-card-interactive flex items-center justify-between gap-3 p-4 group"
                >
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center shrink-0">
                            <ShoppingCart className="h-5 w-5 text-brand" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900">Browse shop</p>
                            <p className="text-xs text-gray-500 truncate">Electronics & imaging</p>
                        </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-brand transition-colors shrink-0" />
                </Link>
            </div>
        </DashboardLayout>
    );
}
