'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
    Wallet,
    ArrowUpRight,
    ArrowDownLeft,
    CreditCard,
    Globe,
    Zap,
    FileText,
    RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/axios';

export default function AdminWallet() {
    const [isAdjusting, setIsAdjusting] = useState(false);
    const [adjustmentData, setAdjustmentData] = useState({ userEmail: '', amount: '', type: 'credit' });

    const handleAdjustment = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // await api.post('/admin/wallet/adjust', adjustmentData);
            toast.success(`Balance ${adjustmentData.type === 'credit' ? '+' : '-'}₵${adjustmentData.amount} for ${adjustmentData.userEmail}`);
            setIsAdjusting(false);
        } catch {
            toast.error('Adjustment failed');
        }
    };

    const quickActions = [
        { label: 'Billing reports', icon: FileText, desc: 'Generate reports' },
        { label: 'Tax & compliance', icon: CreditCard, desc: 'Tax settings' },
        { label: 'Payment gateway', icon: Zap, desc: 'Paystack status' },
        { label: 'Exchange rates', icon: Globe, desc: 'GHS / CNY rates' },
    ];

    return (
        <DashboardLayout isAdmin={true}>
            <div className="mb-4 flex flex-col md:flex-row justify-between items-start md:items-end gap-3">
                <div className="flex items-center gap-3">
                    <Wallet className="h-7 w-7 text-blue-600" />
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Wallet</h1>
                        <p className="text-xs text-gray-500 mt-0.5">Balances and adjustments</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button type="button" onClick={() => setIsAdjusting(true)} className="h-9 px-4 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-gray-900 transition-all flex items-center gap-2">
                        <RefreshCw className="h-3.5 w-3.5" />
                        Adjust balance
                    </button>
                    <button type="button" className="h-9 px-4 bg-white border border-gray-200 text-gray-700 rounded-lg font-semibold text-sm hover:border-blue-600 hover:text-blue-600 transition-all flex items-center gap-2">
                        <Zap className="h-3.5 w-3.5 text-blue-600" />
                        Settlement
                    </button>
                </div>
            </div>

            {/* Adjust balance modal */}
            {isAdjusting && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setIsAdjusting(false)} aria-hidden />
                    <div className="relative w-full max-w-md bg-white rounded-xl border border-gray-100 shadow-xl p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Adjust balance</h2>
                        <form onSubmit={handleAdjustment} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-semibold text-gray-500">User email</label>
                                <input
                                    required
                                    type="email"
                                    className="w-full h-11 bg-gray-50 border border-gray-100 rounded-lg px-3 text-sm text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    placeholder="user@example.com"
                                    value={adjustmentData.userEmail}
                                    onChange={(e) => setAdjustmentData({ ...adjustmentData, userEmail: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-semibold text-gray-500">Amount (GHS)</label>
                                    <input
                                        required
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        className="w-full h-11 bg-gray-50 border border-gray-100 rounded-lg px-3 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                        value={adjustmentData.amount}
                                        onChange={(e) => setAdjustmentData({ ...adjustmentData, amount: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-semibold text-gray-500">Type</label>
                                    <select
                                        className="w-full h-11 bg-gray-50 border border-gray-100 rounded-lg px-3 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                        value={adjustmentData.type}
                                        onChange={(e) => setAdjustmentData({ ...adjustmentData, type: e.target.value })}
                                    >
                                        <option value="credit">Add to balance</option>
                                        <option value="debit">Deduct from balance</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button type="submit" className="flex-1 h-10 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-gray-900 transition-all">
                                    Apply
                                </button>
                                <button type="button" onClick={() => setIsAdjusting(false)} className="h-10 px-4 bg-gray-50 text-gray-600 border border-gray-200 rounded-lg font-semibold text-sm hover:bg-gray-100 transition-all">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
                {/* Main balance + summary */}
                <div className="lg:col-span-2 space-y-4 min-w-0">
                    <section className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm" aria-label="Total balance">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                                <Wallet className="h-4 w-4" />
                            </div>
                            <span className="text-[10px] font-semibold text-gray-400">Status: Live</span>
                        </div>
                        <h3 className="text-[10px] font-semibold text-gray-500 mb-1">Total balance</h3>
                        <p className="text-3xl font-bold text-gray-900 tracking-tight">₵4,281,000</p>
                        <div className="flex flex-wrap items-center gap-4 mt-3">
                            <span className="flex items-center gap-1.5 text-[10px] font-semibold text-green-600">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                                Inflows active
                            </span>
                            <span className="flex items-center gap-1.5 text-[10px] text-gray-500">
                                <Globe className="h-3.5 w-3.5" />
                                Payments: Paystack
                            </span>
                        </div>
                    </section>

                    {/* Quick actions */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {quickActions.map((action, i) => (
                            <button key={i} type="button" className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all text-left">
                                <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 mb-3">
                                    <action.icon className="h-4 w-4" />
                                </div>
                                <p className="text-xs font-semibold text-gray-900 mb-0.5">{action.label}</p>
                                <p className="text-[10px] text-gray-500">{action.desc}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right column: stats cards */}
                <div className="flex flex-col gap-5 min-w-0">
                    <section className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm" aria-label="Weekly sales">
                        <div className="flex justify-between items-start mb-3">
                            <div className="w-9 h-9 rounded-lg bg-green-50 border border-green-100 flex items-center justify-center text-green-600">
                                <ArrowUpRight className="h-4 w-4" />
                            </div>
                            <span className="text-[10px] font-semibold text-gray-400">Inflows</span>
                        </div>
                        <p className="text-[10px] font-semibold text-gray-500 mb-1">Weekly sales</p>
                        <p className="text-2xl font-bold text-gray-900">₵124K</p>
                    </section>

                    <section className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm" aria-label="Pending payouts">
                        <div className="flex justify-between items-start mb-3">
                            <div className="w-9 h-9 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600">
                                <ArrowDownLeft className="h-4 w-4" />
                            </div>
                            <span className="text-[10px] font-semibold text-gray-400">Outflows</span>
                        </div>
                        <p className="text-[10px] font-semibold text-gray-500 mb-1">Pending payouts</p>
                        <p className="text-2xl font-bold text-orange-600">₵12.8K</p>
                    </section>
                </div>
            </div>
        </DashboardLayout>
    );
}
