'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
    Truck,
    ShoppingBag,
    ArrowUpRight,
    Shield,
    RefreshCw,
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
        pendingProcurements: 0,
        recentTransfers: 0
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
                const [walletRes, shipmentsRes, procRes, transRes] = await Promise.all([
                    api.get('/finance/wallet'),
                    api.get('/logistics/history'),
                    api.get('/procurement/user'),
                    api.get('/finance/transfers')
                ]);

                setStats({
                    walletBalance: Number(walletRes.data.balance_ghs).toFixed(2),
                    activeShipments: (shipmentsRes.data || []).filter((s: any) => s.status !== 'delivered').length,
                    pendingProcurements: (procRes.data || []).filter((p: any) => p.status === 'submitted').length,
                    recentTransfers: (transRes.data || []).length
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
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    if (authLoading || loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-gray-500 text-sm animate-pulse">Loading...</div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <motion.div
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="mb-4 md:mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-3 md:gap-4"
            >
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight leading-tight mb-1">Dashboard</h1>
                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                        <p className="text-xs text-gray-500">Logged in as {user?.email}</p>
                    </div>
                </div>
            </motion.div>

            {/* Stats & Actions */}
            <motion.div
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="grid grid-cols-1 gap-3 md:gap-6 mb-4 md:mb-6"
            >
                <div className="space-y-3 md:space-y-4">
                    {/* Wallet Hero Card */}
                    <motion.div
                        variants={itemVariants}
                        whileHover={{ scale: 1.01 }}
                        className="bg-gray-900 rounded-xl md:rounded-2xl p-4 md:p-6 text-white relative overflow-hidden group shadow-lg"
                    >
                        <div className="absolute top-0 right-0 w-40 h-40 bg-blue-600/20 blur-[80px]" />
                        <div className="relative z-10">
                            <p className="text-blue-300 text-[10px] font-semibold uppercase tracking-wider mb-2 md:mb-3">Wallet balance</p>
                            <div className="flex items-baseline gap-2 mb-1 md:mb-2">
                                <span className="text-3xl md:text-4xl font-bold tracking-tight">₵{stats.walletBalance.split('.')[0]}</span>
                                <span className="text-base md:text-lg font-medium text-white/40">.{stats.walletBalance.split('.')[1]}</span>
                            </div>
                            <div className="flex gap-2 mt-3 pt-3 md:mt-4 md:pt-4 border-t border-white/10">
                                <Link href="/dashboard/wallet" className="flex-1 h-9 md:h-10 bg-white text-gray-900 rounded-lg md:rounded-xl flex items-center justify-center font-semibold text-xs hover:bg-blue-50 transition-all">
                                    Deposit
                                </Link>
                                <button className="w-9 h-9 md:w-10 md:h-10 bg-white/10 border border-white/10 rounded-lg md:rounded-xl flex items-center justify-center text-white hover:bg-white/20 transition-all">
                                    <RefreshCw className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </motion.div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                        <motion.div
                            variants={itemVariants}
                            whileHover={{ y: -2 }}
                            className="bg-white rounded-xl p-4 md:p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all group"
                        >
                            <div className="w-9 h-9 md:w-10 md:h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-2 md:mb-3 border border-blue-100">
                                <Truck className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                            </div>
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">In transit</p>
                            <p className="text-xl md:text-2xl font-bold text-gray-900">{stats.activeShipments}</p>
                        </motion.div>
                        <motion.div
                            variants={itemVariants}
                            whileHover={{ y: -2 }}
                            className="bg-white rounded-xl p-4 md:p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all group"
                        >
                            <div className="w-9 h-9 md:w-10 md:h-10 bg-indigo-50 rounded-lg flex items-center justify-center mb-2 md:mb-3 border border-indigo-100">
                                <ShoppingBag className="h-4 w-4 md:h-5 md:w-5 text-indigo-600" />
                            </div>
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Pending</p>
                            <p className="text-xl md:text-2xl font-bold text-gray-900">{stats.pendingProcurements}</p>
                        </motion.div>
                    </div>
                </div>
            </motion.div>

            {/* Tracking & Support Matrix */}
            <motion.div
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4"
            >
                <div className="bg-gray-50 rounded-xl p-4 md:p-5 border border-gray-100 flex items-center gap-3 md:gap-4 hover:bg-white transition-all shadow-sm">
                    <div className="w-9 h-9 md:w-10 md:h-10 bg-white rounded-lg flex items-center justify-center border border-gray-100 shadow-sm shrink-0">
                        <Shield className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                        <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Identity</h4>
                        <p className="text-sm font-bold text-gray-900">Verified</p>
                    </div>
                </div>

                <div className="md:col-span-2 bg-blue-600 rounded-xl p-4 md:p-5 lg:p-6 relative overflow-hidden group shadow-lg flex items-center justify-between text-white gap-3">
                    <div className="relative z-10 min-w-0 flex-1">
                        <h4 className="text-base md:text-lg font-bold tracking-tight mb-0.5 md:mb-1">Procurement</h4>
                        <p className="text-blue-100 text-[11px] md:text-xs">Source products from our global supply chain.</p>
                    </div>
                    <Link href="/dashboard/procurement" className="relative z-10 w-10 h-10 md:w-12 md:h-12 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-lg hover:scale-105 transition-transform shrink-0">
                        <ArrowUpRight className="h-6 w-6" />
                    </Link>
                </div>
            </motion.div>
        </DashboardLayout>
    );
}

