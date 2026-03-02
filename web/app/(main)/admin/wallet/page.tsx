'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Wallet, Search, Plus, Minus, FileText, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/axios';

type WalletRow = {
    id: number;
    user_id: number;
    balance_ghs: number;
    updated_at: string;
    user: { id: number; email: string; phone?: string; role?: string; profile?: { first_name?: string; last_name?: string } };
};

export default function AdminWalletPage() {
    const [wallets, setWallets] = useState<WalletRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [adjusting, setAdjusting] = useState<{ user_id: number; email: string } | null>(null);
    const [adjustAmount, setAdjustAmount] = useState('');
    const [adjustType, setAdjustType] = useState<'credit' | 'debit'>('credit');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchWallets();
    }, []);

    const fetchWallets = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/finance/wallet/admin/list', { params: { limit: 100 } });
            setWallets(data?.data ?? []);
        } catch {
            toast.error('Failed to load wallets');
        } finally {
            setLoading(false);
        }
    };

    const handleAdjust = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!adjusting) return;
        const amt = parseFloat(adjustAmount);
        if (!Number.isFinite(amt) || amt <= 0) {
            toast.error('Enter a valid positive amount');
            return;
        }
        const amount = adjustType === 'debit' ? -amt : amt;
        setSubmitting(true);
        try {
            await api.post('/finance/wallet/admin/adjust', { user_id: adjusting.user_id, amount });
            toast.success(`${adjustType === 'credit' ? 'Credited' : 'Debited'} ₵${Math.abs(amount).toFixed(2)} successfully`);
            setAdjusting(null);
            setAdjustAmount('');
            fetchWallets();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Adjustment failed');
        } finally {
            setSubmitting(false);
        }
    };

    const userName = (w: WalletRow) => {
        const p = w.user?.profile;
        if (p?.first_name || p?.last_name) return `${p.first_name || ''} ${p.last_name || ''}`.trim();
        return w.user?.email ?? '—';
    };

    const filtered = wallets.filter(
        (w) =>
            (w.user?.email ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            userName(w).toLowerCase().includes(searchTerm.toLowerCase()) ||
            (w.user?.phone ?? '').includes(searchTerm)
    );

    const totalBalance = wallets.reduce((s, w) => s + (w.balance_ghs || 0), 0);
    const zeroBalanceCount = wallets.filter((w) => (w.balance_ghs || 0) === 0).length;
    const withBalanceCount = wallets.filter((w) => (w.balance_ghs || 0) > 0).length;

    const stats = [
        { label: 'Total wallets', value: wallets.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
        { label: 'Total balance', value: `₵${totalBalance.toFixed(2)}`, icon: Wallet, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
        { label: 'With balance', value: withBalanceCount, icon: Plus, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
        { label: 'Zero balance', value: zeroBalanceCount, icon: FileText, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-100' },
    ];

    return (
        <DashboardLayout isAdmin={true}>
            <div className="pb-6 md:pb-8">
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                    <Wallet className="h-7 w-7 text-blue-600" />
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Wallet management</h1>
                        <p className="text-xs text-gray-500 mt-0.5">Credit and debit user wallets</p>
                    </div>
                </div>
                <div className="relative min-w-0 sm:w-44">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full h-9 pl-8 pr-2.5 border border-gray-100 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {stats.map((s, i) => (
                    <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                        <div className={`w-9 h-9 rounded-lg ${s.bg} ${s.border} border flex items-center justify-center ${s.color} mb-2`}>
                            <s.icon className="h-4 w-4" />
                        </div>
                        <p className="text-xs font-semibold text-gray-500 mb-0.5">{s.label}</p>
                        <p className="text-xl font-bold text-gray-900">{s.value}</p>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-50">
                                <th className="px-3 py-2.5 text-xs font-semibold text-gray-500">User</th>
                                <th className="px-3 py-2.5 text-xs font-semibold text-gray-500">Email</th>
                                <th className="px-3 py-2.5 text-xs font-semibold text-gray-500">Balance</th>
                                <th className="px-3 py-2.5 text-xs font-semibold text-gray-500">Updated</th>
                                <th className="px-3 py-2.5 text-xs font-semibold text-gray-500 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="py-10 text-center">
                                        <div className="animate-spin h-7 w-7 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2" />
                                        <p className="text-sm text-gray-500">Loading...</p>
                                    </td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-10 text-center text-gray-500">
                                        <Wallet className="h-10 w-10 mx-auto mb-2 text-gray-200" />
                                        <p className="text-sm">No wallets found</p>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((w) => (
                                    <tr key={w.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-3 py-2.5">
                                            <span className="text-xs font-semibold text-gray-900 truncate block max-w-[120px]">{userName(w)}</span>
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <span className="text-xs text-gray-700 truncate block max-w-[160px]">{w.user?.email ?? '—'}</span>
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <span className="text-xs font-semibold text-gray-900">₵{(w.balance_ghs ?? 0).toFixed(2)}</span>
                                        </td>
                                        <td className="px-3 py-2.5 text-xs text-gray-500">
                                            {w.updated_at ? new Date(w.updated_at).toLocaleDateString() : '—'}
                                        </td>
                                        <td className="px-3 py-2.5 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => { setAdjusting({ user_id: w.user_id, email: w.user?.email ?? '' }); setAdjustType('credit'); setAdjustAmount(''); }}
                                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-green-50 text-green-700 border border-green-100 hover:bg-green-100 transition-colors"
                                                >
                                                    <Plus className="h-3 w-3" /> Credit
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => { setAdjusting({ user_id: w.user_id, email: w.user?.email ?? '' }); setAdjustType('debit'); setAdjustAmount(''); }}
                                                    disabled={(w.balance_ghs ?? 0) <= 0}
                                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-red-50 text-red-700 border border-red-100 hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <Minus className="h-3 w-3" /> Debit
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {adjusting && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40" onClick={() => !submitting && setAdjusting(null)} aria-hidden />
                    <div className="relative w-full max-w-md bg-white rounded-xl border border-gray-100 shadow-xl p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-1">
                            {adjustType === 'credit' ? 'Credit' : 'Debit'} wallet
                        </h2>
                        <p className="text-xs text-gray-500 mb-4">{adjusting.email}</p>
                        <form onSubmit={handleAdjust} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-500">Amount (GHS)</label>
                                <input
                                    required
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="0.00"
                                    className="w-full h-11 bg-gray-50 border border-gray-100 rounded-lg px-3 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    value={adjustAmount}
                                    onChange={(e) => setAdjustAmount(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className={`flex-1 h-10 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                                        adjustType === 'credit'
                                            ? 'bg-green-600 text-white hover:bg-green-700'
                                            : 'bg-red-600 text-white hover:bg-red-700'
                                    } disabled:opacity-50`}
                                >
                                    {submitting ? 'Applying...' : `${adjustType === 'credit' ? 'Credit' : 'Debit'} ₵${adjustAmount || '0'}`}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => !submitting && setAdjusting(null)}
                                    className="h-10 px-4 bg-gray-50 text-gray-600 border border-gray-200 rounded-lg font-semibold text-sm hover:bg-gray-100 transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            </div>
        </DashboardLayout>
    );
}
