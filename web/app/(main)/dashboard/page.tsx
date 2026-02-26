'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
    CreditCard,
    Truck,
    ShoppingBag,
    ArrowUpRight,
    Search,
    Package,
    AlertCircle,
    Activity,
    Globe,
    Shield,
    RefreshCw,
    History as HistoryIcon
} from 'lucide-react';
import api from '@/lib/axios';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';

const spendData = [
    { name: 'Mon', value: 2400 },
    { name: 'Tue', value: 1398 },
    { name: 'Wed', value: 9800 },
    { name: 'Thu', value: 3908 },
    { name: 'Fri', value: 4800 },
    { name: 'Sat', value: 3490 },
    { name: 'Sun', value: 4300 },
];

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
                className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4"
            >
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight leading-tight mb-1">Dashboard</h1>
                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                        <p className="text-xs text-gray-500">Logged in as {user?.email}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button className="h-9 px-4 border border-gray-200 rounded-xl text-xs font-semibold text-gray-500 hover:text-blue-600 hover:border-blue-600 transition-all flex items-center gap-2">
                        <HistoryIcon className="h-3.5 w-3.5" />
                        History
                    </button>
                    <button className="h-9 px-4 bg-gray-900 text-white rounded-xl text-xs font-semibold hover:bg-blue-600 transition-all flex items-center gap-2">
                        <Activity className="h-3.5 w-3.5" />
                        Report
                    </button>
                </div>
            </motion.div>

            {/* Bento Grid Layout */}
            <motion.div
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 mb-6"
            >

                {/* Left Column: Stats & Actions */}
                <div className="lg:col-span-4 space-y-4">
                    {/* Wallet Hero Card */}
                    <motion.div
                        variants={itemVariants}
                        whileHover={{ scale: 1.01 }}
                        className="bg-gray-900 rounded-2xl p-6 text-white relative overflow-hidden group shadow-lg"
                    >
                        <div className="absolute top-0 right-0 w-40 h-40 bg-blue-600/20 blur-[80px]" />
                        <div className="relative z-10">
                            <p className="text-blue-300 text-[10px] font-semibold uppercase tracking-wider mb-3">Wallet balance</p>
                            <div className="flex items-baseline gap-2 mb-2">
                                <span className="text-4xl font-bold tracking-tight">₵{stats.walletBalance.split('.')[0]}</span>
                                <span className="text-lg font-medium text-white/40">.{stats.walletBalance.split('.')[1]}</span>
                            </div>
                            <div className="flex gap-2 mt-4 pt-4 border-t border-white/10">
                                <Link href="/dashboard/wallet" className="flex-1 h-10 bg-white text-gray-900 rounded-xl flex items-center justify-center font-semibold text-xs hover:bg-blue-50 transition-all">
                                    Deposit
                                </Link>
                                <button className="w-10 h-10 bg-white/10 border border-white/10 rounded-xl flex items-center justify-center text-white hover:bg-white/20 transition-all">
                                    <RefreshCw className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </motion.div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <motion.div
                            variants={itemVariants}
                            whileHover={{ y: -2 }}
                            className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all group"
                        >
                            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-3 border border-blue-100">
                                <Truck className="h-5 w-5 text-blue-600" />
                            </div>
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">In transit</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.activeShipments}</p>
                        </motion.div>
                        <motion.div
                            variants={itemVariants}
                            whileHover={{ y: -2 }}
                            className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all group"
                        >
                            <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center mb-3 border border-indigo-100">
                                <ShoppingBag className="h-5 w-5 text-indigo-600" />
                            </div>
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Pending</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.pendingProcurements}</p>
                        </motion.div>
                    </div>
                </div>

                {/* Right Column: Dynamic Analytics */}
                <motion.div
                    variants={itemVariants}
                    className="lg:col-span-8 bg-white rounded-2xl p-6 lg:p-8 border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all"
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[80px]" />
                    <div className="relative z-10 h-full flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Activity</h3>
                                <p className="text-lg font-bold text-gray-900">Spend</p>
                            </div>
                            <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg border border-gray-100">
                                <button className="px-3 py-1.5 bg-white text-xs font-semibold text-gray-900 rounded-md shadow-sm border border-gray-100">Weekly</button>
                                <button className="px-3 py-1.5 text-xs font-semibold text-gray-400 hover:text-gray-600">Monthly</button>
                            </div>
                        </div>

                        <div className="flex-1 w-full min-h-[260px]">
                            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={100}>
                                <AreaChart data={spendData}>
                                    <defs>
                                        <linearGradient id="userSpend" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }}
                                        dy={10}
                                    />
                                    <YAxis hide />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#111827',
                                            border: 'none',
                                            borderRadius: '16px',
                                            padding: '12px 16px',
                                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                                        }}
                                        itemStyle={{ color: '#fff', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}
                                        labelStyle={{ display: 'none' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="value"
                                        stroke="#2563eb"
                                        strokeWidth={4}
                                        fillOpacity={1}
                                        fill="url(#userSpend)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </motion.div>
            </motion.div>

            {/* Tracking & Support Matrix */}
            <motion.div
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 flex items-center gap-4 hover:bg-white transition-all shadow-sm">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-gray-100 shadow-sm">
                        <Shield className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                        <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Identity</h4>
                        <p className="text-sm font-bold text-gray-900">Verified</p>
                    </div>
                </div>

                <div className="md:col-span-2 bg-blue-600 rounded-xl p-5 lg:p-6 relative overflow-hidden group shadow-lg flex items-center justify-between text-white">
                    <div className="relative z-10 max-w-sm">
                        <h4 className="text-lg font-bold tracking-tight mb-1">Procurement</h4>
                        <p className="text-blue-100 text-xs">Source products from our global supply chain.</p>
                    </div>
                    <Link href="/dashboard/procurement" className="relative z-10 w-12 h-12 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-lg hover:scale-105 transition-transform">
                        <ArrowUpRight className="h-6 w-6" />
                    </Link>
                </div>
            </motion.div>
        </DashboardLayout>
    );
}

