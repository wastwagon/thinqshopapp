'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
    Truck,
    Package,
    Send,
    Shield,
    RefreshCw,
    ShoppingCart,
} from 'lucide-react';
import api from '@/lib/axios';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';

export default function DashboardPage() {
    const { isAuthenticated, user, loading: authLoading } = useAuth();
    const router = useRouter();

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
                    activeShipments: shipments.filter((s: any) => s.status !== 'delivered').length,
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

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.06 },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 12 },
        visible: { opacity: 1, y: 0 },
    };

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
        { label: 'In transit', value: stats.activeShipments, icon: Truck, href: '/dashboard/shipments', color: 'blue' },
        { label: 'Orders', value: stats.totalOrders, icon: Package, href: '/dashboard/orders', color: 'emerald' },
        { label: 'Transfers', value: stats.totalTransfers, icon: Send, href: '/dashboard/transfers', color: 'violet' },
        { label: 'Identity', value: 'Verified', icon: Shield, href: null, color: 'slate', isText: true },
    ];

    const colorClasses: Record<string, string> = {
        blue: 'bg-blue-50 border-blue-100 text-blue-600',
        emerald: 'bg-emerald-50 border-emerald-100 text-emerald-600',
        violet: 'bg-violet-50 border-violet-100 text-violet-600',
        slate: 'bg-slate-50 border-slate-100 text-slate-600',
    };

    return (
        <DashboardLayout>
            <motion.div
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="pb-6 md:pb-8"
            >
                {/* Header - compact */}
                <motion.div variants={itemVariants} className="mb-3 md:mb-4">
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
                    <p className="text-[11px] md:text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                        <span className="w-1 h-1 bg-green-500 rounded-full" />
                        {user?.email}
                    </p>
                </motion.div>

                {/* Wallet - compact hero */}
                <motion.div
                    variants={itemVariants}
                    className="bg-gray-900 rounded-xl p-3 md:p-5 text-white relative overflow-hidden mb-3 md:mb-4"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 blur-[60px]" />
                    <div className="relative z-10 flex items-center justify-between gap-3">
                        <div>
                            <p className="text-blue-300 text-[9px] md:text-[10px] font-semibold uppercase tracking-wider">Wallet</p>
                            <div className="flex items-baseline gap-1 mt-0.5">
                                <span className="text-2xl md:text-3xl font-bold tracking-tight">₵{stats.walletBalance.split('.')[0]}</span>
                                <span className="text-sm text-white/50">.{stats.walletBalance.split('.')[1]}</span>
                            </div>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                            <Link
                                href="/dashboard/wallet"
                                className="h-8 md:h-9 px-3 md:px-4 bg-white text-gray-900 rounded-lg flex items-center font-semibold text-[11px] md:text-xs hover:bg-blue-50 transition-all"
                            >
                                Deposit
                            </Link>
                            <button className="h-8 w-8 md:h-9 md:w-9 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-all">
                                <RefreshCw className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* KPI Grid - 2x2 mobile, compact */}
                <div className="grid grid-cols-2 gap-2 md:gap-3 mb-4 md:mb-5">
                    {kpiCards.map((card) => {
                        const Icon = card.icon;
                        const color = colorClasses[card.color] || colorClasses.slate;
                        const inner = (
                            <motion.div
                                variants={itemVariants}
                                className={`rounded-xl p-3 md:p-4 border shadow-sm transition-all ${
                                    card.href ? 'bg-white border-gray-100 hover:shadow-md hover:border-gray-200 cursor-pointer' : 'bg-gray-50/80 border-gray-100'
                                }`}
                            >
                                <div className={`w-8 h-8 md:w-9 md:h-9 rounded-lg flex items-center justify-center border mb-1.5 ${color}`}>
                                    <Icon className="h-3.5 w-3.5 md:h-4 md:w-4" />
                                </div>
                                <p className="text-[9px] md:text-[10px] font-semibold text-gray-400 uppercase tracking-wider truncate">{card.label}</p>
                                <p className="text-lg md:text-xl font-bold text-gray-900 mt-0.5 truncate">
                                    {card.isText ? String(card.value) : card.value}
                                </p>
                            </motion.div>
                        );
                        return (
                            <React.Fragment key={card.label}>
                                {card.href ? <Link href={card.href}>{inner}</Link> : inner}
                            </React.Fragment>
                        );
                    })}
                </div>

                {/* Quick action - Shop */}
                <motion.div variants={itemVariants}>
                    <Link
                        href="/shop"
                        className="flex items-center justify-between gap-3 p-3 md:p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all group"
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                                <ShoppingCart className="h-4 w-4 text-blue-600" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-bold text-gray-900">Browse shop</p>
                                <p className="text-[11px] text-gray-500 truncate">Electronics & imaging</p>
                            </div>
                        </div>
                        <span className="text-blue-600 group-hover:translate-x-0.5 transition-transform shrink-0">→</span>
                    </Link>
                </motion.div>
            </motion.div>
        </DashboardLayout>
    );
}
