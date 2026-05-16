'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import api from '@/lib/axios';
import { Plus, ArrowUpRight, ArrowDownLeft, Wallet, RefreshCw, History as HistoryIcon, Activity, TrendingUp, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
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

const WalletPaystackTrigger = dynamic(
    () => import('@/components/wallet/WalletPaystackTrigger').then((m) => m.default),
    { ssr: false }
);

const spendForecast = [
    { name: 'Mon', value: 200 },
    { name: 'Tue', value: 450 },
    { name: 'Wed', value: 300 },
    { name: 'Thu', value: 900 },
    { name: 'Fri', value: 600 },
    { name: 'Sat', value: 800 },
    { name: 'Sun', value: 1200 },
];

interface Transaction {
    id: number;
    transaction_ref: string;
    amount: number;
    payment_method: string;
    status: string;
    created_at: string;
    service_type: string;
}

export default function WalletPage() {
    const { user } = useAuth();
    const [balance, setBalance] = useState<number | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [topUpAmount, setTopUpAmount] = useState('');
    const [isToppingUp, setIsToppingUp] = useState(false);
    const [showTopUpModal, setShowTopUpModal] = useState(false);
    const [paystackTopUpConfig, setPaystackTopUpConfig] = useState<{ reference: string; amount_pesewas: number } | null>(null);
    const [activeTab, setActiveTab] = useState<'activity' | 'report'>('activity');

    const fetchData = async () => {
        setLoading(true);
        try {
            const [walletRes, txRes] = await Promise.all([
                api.get('/finance/wallet'),
                api.get('/finance/wallet/transactions')
            ]);
            setBalance(Number(walletRes.data.balance_ghs));
            setTransactions(txRes.data);
        } catch (error) {
            console.error("Failed to fetch wallet data", error);
            // toast.error("Failed to load wallet data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleTopUp = async (e: React.FormEvent) => {
        e.preventDefault();
        const amount = Number(topUpAmount);
        if (isNaN(amount) || amount <= 0) {
            toast.error("Invalid amount");
            return;
        }

        setIsToppingUp(true);
        try {
            const { data } = await api.post('/finance/wallet/topup', { amount });
            setTopUpAmount('');
            setShowTopUpModal(false);
            setPaystackTopUpConfig({
                reference: data.reference,
                amount_pesewas: data.amount_pesewas,
            });
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to initialize top-up");
        } finally {
            setIsToppingUp(false);
        }
    };

    const handlePaystackTopUpSuccess = async (ref: { reference: string }) => {
        try {
            const { data } = await api.post('/finance/wallet/confirm-topup', { reference: ref.reference });
            setBalance(data.balance_ghs);
            toast.success(`Wallet credited ₵${Number(data.credited).toFixed(2)}`);
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to credit wallet");
        } finally {
            setPaystackTopUpConfig(null);
        }
    };

    const handlePaystackTopUpClose = () => {
        setPaystackTopUpConfig(null);
        toast.error("Payment cancelled.");
    };

    return (
        <DashboardLayout>
            <div className="pb-20 md:pb-10">
            {paystackTopUpConfig && (
                <WalletPaystackTrigger
                    config={paystackTopUpConfig}
                    userEmail={user?.email}
                    onSuccess={handlePaystackTopUpSuccess}
                    onClose={handlePaystackTopUpClose}
                />
            )}
            <div
                className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4"
            >
                <div>
                    <h1 className="page-title">Wallet</h1>
                    <p className="page-subtitle">Balance and transaction history</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => { setActiveTab('report'); toast('Wallet reports (e.g. export) coming soon.'); }}
                        className={`h-9 px-4 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 ${activeTab === 'report' ? 'bg-brand text-white' : 'border border-gray-200/90 text-gray-600 hover:border-brand/30'}`}
                    >
                        <TrendingUp className="h-3.5 w-3.5" />
                        Report
                    </button>
                    <button
                        type="button"
                        onClick={() => { setActiveTab('activity'); document.getElementById('wallet-transaction-history')?.scrollIntoView({ behavior: 'smooth' }); }}
                        className={`h-9 px-4 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 ${activeTab === 'activity' ? 'bg-brand text-white' : 'border border-gray-200/90 text-gray-600 hover:border-brand/30'}`}
                    >
                        <Activity className="h-3.5 w-3.5" />
                        Activity
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:gap-6 mb-4 md:mb-6">
                {/* Balance Hero */}
                <div
                    className="flat-card border-l-4 border-l-brand p-4 md:p-6 lg:p-8"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <p className="text-brand text-xs font-medium mb-3">Balance</p>
                            <div className="flex items-baseline gap-1 mb-4">
                                <span className="text-4xl font-semibold tracking-tight text-gray-900">
                                    ₵{balance !== null ? balance.toFixed(2).split('.')[0] : '0'}
                                </span>
                                <span className="text-xl font-medium text-gray-400">
                                    .{balance !== null ? balance.toFixed(2).split('.')[1] : '00'}
                                </span>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowTopUpModal(true)}
                                    className="h-10 px-5 bg-brand text-white rounded-xl font-semibold text-xs hover:bg-brand/90 transition-colors flex items-center gap-2"
                                >
                                    <Plus className="h-4 w-4" />
                                    Top-up wallet
                                </button>
                                <button type="button" className="w-10 h-10 bg-gray-50 border border-gray-200/80 rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors">
                                    <ShieldCheck className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        <div className="h-[160px] md:h-full min-h-[180px] hidden md:block">
                            <p className="text-gray-500 text-xs font-medium mb-3 flex items-center gap-2">
                                <Activity className="h-3 w-3" /> Forecast
                            </p>
                            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={100}>
                                <AreaChart data={spendForecast}>
                                    <defs>
                                        <linearGradient id="balanceFlow" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="hsl(24 95% 53%)" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="hsl(24 95% 53%)" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <Area
                                        type="monotone"
                                        dataKey="value"
                                        stroke="hsl(24 95% 53%)"
                                        strokeWidth={4}
                                        fillOpacity={1}
                                        fill="url(#balanceFlow)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            {/* Top-up modal */}
            {showTopUpModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowTopUpModal(false)}>
                    <div className="flat-card p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-sm font-semibold text-gray-900 mb-4">Top-up wallet</h3>
                        <form onSubmit={handleTopUp} className="space-y-4">
                            <div>
                                <label htmlFor="modal-amount" className="text-sm font-medium text-gray-600 ml-1 mb-1.5 block">
                                    Amount (GHS)
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <span className="text-gray-700 font-medium">₵</span>
                                    </div>
                                    <input
                                        type="number"
                                        name="amount"
                                        id="modal-amount"
                                        className="block w-full pl-9 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-base font-semibold text-gray-900 focus:bg-white focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all outline-none"
                                        placeholder="0.00"
                                        value={topUpAmount}
                                        onChange={(e) => setTopUpAmount(e.target.value)}
                                        min="1"
                                        step="0.01"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowTopUpModal(false)}
                                    className="flex-1 py-3 px-4 rounded-xl font-semibold text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isToppingUp}
                                    className="flex-1 flex justify-center items-center py-3 px-4 rounded-xl font-semibold text-sm text-white bg-brand hover:bg-brand/90 disabled:opacity-50 transition-all"
                                >
                                    {isToppingUp ? <RefreshCw className="animate-spin h-4 w-4" /> : <><Plus className="mr-2 h-4 w-4" /> Deposit</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Transaction History */}
            <div id="wallet-transaction-history" className="flat-card overflow-hidden scroll-mt-6">
                <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="text-sm font-medium text-gray-700 flex items-center">
                        <HistoryIcon className="h-4 w-4 mr-2 text-brand" />
                        Transaction history
                    </h3>
                    <button onClick={fetchData} className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-brand transition-colors">
                        <RefreshCw className="h-4 w-4" />
                    </button>
                </div>
                {loading && transactions.length === 0 ? (
                    <div className="p-20 text-center">
                        <div className="animate-pulse flex flex-col items-center">
                            <div className="w-10 h-10 bg-gray-100 rounded-full mb-3" />
                            <p className="text-xs text-gray-400">Loading...</p>
                        </div>
                    </div>
                ) : transactions.length === 0 ? (
                    <div className="p-10 text-center">
                        <Wallet className="h-12 w-12 mx-auto mb-4 text-gray-200" />
                        <p className="text-xs text-gray-400">No transactions yet</p>
                    </div>
                ) : (
                    <ul role="list" className="divide-y divide-gray-50">
                        {transactions.map((tx) => (
                            <li key={tx.id} className="px-4 sm:px-5 py-4 hover:bg-gray-50/80 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className={`flex-shrink-0 h-10 w-10 rounded-lg flex items-center justify-center ${tx.service_type === 'wallet_topup' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-brand'}`}>
                                            {tx.service_type === 'wallet_topup' ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                                        </div>
                                        <div className="ml-3 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 capitalize truncate">
                                                {tx.service_type.replace(/_/g, ' ')}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                {new Date(tx.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <p className={`text-sm font-semibold tabular-nums ${tx.service_type === 'wallet_topup' ? 'text-green-600' : 'text-gray-900'}`}>
                                            {tx.service_type === 'wallet_topup' ? '+' : '-'} ₵{Number(tx.amount).toFixed(2)}
                                        </p>
                                        <span className={`px-2 py-0.5 text-[10px] font-medium rounded-md capitalize ${tx.status === 'success' ? 'bg-green-50 text-green-700' :
                                            tx.status === 'failed' ? 'bg-red-50 text-red-600' :
                                                'bg-amber-50 text-amber-700'
                                            }`}>
                                            {tx.status}
                                        </span>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            </div>
        </DashboardLayout>
    );
}
