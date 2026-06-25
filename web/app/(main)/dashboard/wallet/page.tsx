'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import api from '@/lib/axios';
import { Plus, ArrowUpRight, ArrowDownLeft, Wallet, RefreshCw, History as HistoryIcon, Activity, Banknote } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { GroupedList, GroupedListHeader, GroupedListEmpty, GroupedListRow } from '@/components/ui/GroupedList';
import { useAuth } from '@/context/AuthContext';

const PaystackTrigger = dynamic(
    () => import('@/components/payments/PaystackTrigger').then((m) => m.default),
    { ssr: false }
);

const SOURCE_LABELS: Record<string, string> = {
    wallet_topup: 'Wallet top-up',
    consignment_payout: 'Sell for Me payout',
    shop_payment: 'Shop purchase',
    transfer_payment: 'Money transfer',
    procurement_payment: 'Procurement',
    logistics_payment: 'Logistics',
    withdrawal: 'Withdrawal',
    admin_adjust: 'Admin adjustment',
    other: 'Adjustment',
};

interface LedgerTx {
    id: number;
    type: 'credit' | 'debit';
    amount_ghs: number;
    balance_after: number;
    source: string;
    description?: string;
    status: string;
    created_at: string;
}

interface WithdrawalRow {
    id: number;
    amount_ghs: number;
    method: string;
    status: string;
    created_at: string;
    rejection_reason?: string;
}

export default function WalletPage() {
    const { user } = useAuth();
    const [balance, setBalance] = useState<number | null>(null);
    const [availableBalance, setAvailableBalance] = useState<number | null>(null);
    const [pendingWithdrawal, setPendingWithdrawal] = useState(0);
    const [transactions, setTransactions] = useState<LedgerTx[]>([]);
    const [withdrawals, setWithdrawals] = useState<WithdrawalRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [topUpAmount, setTopUpAmount] = useState('');
    const [isToppingUp, setIsToppingUp] = useState(false);
    const [showTopUpModal, setShowTopUpModal] = useState(false);
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [withdrawing, setWithdrawing] = useState(false);
    const [paystackTopUpConfig, setPaystackTopUpConfig] = useState<{ reference: string; amount_pesewas: number } | null>(null);
    const [withdrawForm, setWithdrawForm] = useState({
        amount: '',
        method: 'mobile_money' as 'mobile_money' | 'bank_transfer',
        account_name: '',
        phone: '',
        network: 'MTN',
        bank_name: '',
        account_number: '',
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [walletRes, txRes, wdRes] = await Promise.all([
                api.get('/finance/wallet'),
                api.get('/finance/wallet/transactions'),
                api.get('/finance/wallet/withdrawals'),
            ]);
            setBalance(Number(walletRes.data.balance_ghs));
            setAvailableBalance(Number(walletRes.data.available_balance_ghs));
            setPendingWithdrawal(Number(walletRes.data.pending_withdrawal_ghs ?? 0));
            setTransactions(txRes.data);
            setWithdrawals(wdRes.data);
        } catch (error) {
            console.error('Failed to fetch wallet data', error);
            toast.error('Failed to load wallet');
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
            toast.error('Invalid amount');
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
            toast.error(error.response?.data?.message || 'Failed to initialize top-up');
        } finally {
            setIsToppingUp(false);
        }
    };

    const handlePaystackTopUpSuccess = async (ref: { reference: string }) => {
        try {
            const { data } = await api.post('/finance/wallet/confirm-topup', { reference: ref.reference });
            setBalance(Number(data.balance_ghs));
            setAvailableBalance(Number(data.available_balance_ghs));
            toast.success(`Wallet credited ₵${Number(data.credited).toFixed(2)}`);
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to credit wallet');
        } finally {
            setPaystackTopUpConfig(null);
        }
    };

    const handleWithdraw = async (e: React.FormEvent) => {
        e.preventDefault();
        const amount = Number(withdrawForm.amount);
        if (!Number.isFinite(amount) || amount < 50) {
            toast.error('Minimum withdrawal is ₵50');
            return;
        }
        if (!withdrawForm.account_name.trim()) {
            toast.error('Account name is required');
            return;
        }
        setWithdrawing(true);
        try {
            const recipient_details: Record<string, string> = {
                account_name: withdrawForm.account_name.trim(),
            };
            if (withdrawForm.method === 'mobile_money') {
                recipient_details.phone = withdrawForm.phone.trim();
                recipient_details.network = withdrawForm.network;
            } else {
                recipient_details.bank_name = withdrawForm.bank_name.trim();
                recipient_details.account_number = withdrawForm.account_number.trim();
            }
            await api.post('/finance/wallet/withdraw', {
                amount,
                method: withdrawForm.method,
                recipient_details,
            });
            toast.success('Withdrawal submitted for admin approval');
            setShowWithdrawModal(false);
            setWithdrawForm({
                amount: '',
                method: 'mobile_money',
                account_name: '',
                phone: '',
                network: 'MTN',
                bank_name: '',
                account_number: '',
            });
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Withdrawal request failed');
        } finally {
            setWithdrawing(false);
        }
    };

    const cancelWithdrawal = async (id: number) => {
        if (!confirm('Cancel this withdrawal request?')) return;
        try {
            await api.delete(`/finance/wallet/withdrawals/${id}`);
            toast.success('Withdrawal cancelled');
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to cancel');
        }
    };

    return (
        <DashboardLayout>
            <div className="pb-20 md:pb-10">
                {paystackTopUpConfig && (
                    <PaystackTrigger
                        config={{ reference: paystackTopUpConfig.reference, amount: paystackTopUpConfig.amount_pesewas }}
                        userEmail={user?.email}
                        onSuccess={handlePaystackTopUpSuccess}
                        onClose={() => {
                            setPaystackTopUpConfig(null);
                            toast.error('Payment cancelled.');
                        }}
                    />
                )}

                <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                    <div>
                        <h1 className="page-title">Wallet</h1>
                        <p className="page-subtitle">Unified balance for shop, services, and Sell for Me payouts</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => document.getElementById('wallet-transaction-history')?.scrollIntoView({ behavior: 'smooth' })}
                        className="h-9 px-4 rounded-lg text-xs font-medium border border-gray-200/90 text-gray-600 hover:border-brand/30 flex items-center gap-2"
                    >
                        <Activity className="h-3.5 w-3.5" />
                        Activity
                    </button>
                </div>

                <div className="flat-card border-l-4 border-l-brand p-4 md:p-6 mb-4">
                    <p className="text-brand text-xs font-medium mb-2">Available balance</p>
                    <div className="flex items-baseline gap-1 mb-1">
                        <span className="text-4xl font-semibold tracking-tight text-gray-900">
                            ₵{availableBalance !== null ? availableBalance.toFixed(2) : '0.00'}
                        </span>
                    </div>
                    {balance !== null && pendingWithdrawal > 0 && (
                        <p className="text-xs text-amber-600 mb-3">
                            ₵{pendingWithdrawal.toFixed(2)} reserved in pending withdrawals · Total balance ₵{balance.toFixed(2)}
                        </p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-4">
                        <button
                            type="button"
                            onClick={() => setShowTopUpModal(true)}
                            className="h-10 px-5 bg-brand text-white rounded-xl font-semibold text-xs hover:bg-brand/90 transition-colors flex items-center gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            Top-up
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowWithdrawModal(true)}
                            disabled={availableBalance === null || availableBalance < 50}
                            className="h-10 px-5 bg-white border border-gray-200 text-gray-800 rounded-xl font-semibold text-xs hover:border-brand/30 transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                            <Banknote className="h-4 w-4" />
                            Withdraw
                        </button>
                    </div>
                </div>

                {withdrawals.some((w) => w.status === 'pending') && (
                    <div className="flat-card p-4 mb-4 border border-amber-100 bg-amber-50/50">
                        <p className="text-xs font-semibold text-amber-800 mb-2">Pending withdrawals</p>
                        <ul className="space-y-2">
                            {withdrawals.filter((w) => w.status === 'pending').map((w) => (
                                <li key={w.id} className="flex items-center justify-between gap-2 text-sm">
                                    <span className="text-gray-700">₵{Number(w.amount_ghs).toFixed(2)} · awaiting admin</span>
                                    <button
                                        type="button"
                                        onClick={() => cancelWithdrawal(w.id)}
                                        className="text-xs font-semibold text-red-600 hover:underline"
                                    >
                                        Cancel
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {withdrawals.some((w) => w.status !== 'pending') && (
                    <div className="flat-card p-4 mb-4">
                        <p className="text-xs font-semibold text-gray-700 mb-2">Withdrawal history</p>
                        <ul className="space-y-2">
                            {withdrawals.filter((w) => w.status !== 'pending').map((w) => (
                                <li key={w.id} className="text-sm border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-gray-800">₵{Number(w.amount_ghs).toFixed(2)}</span>
                                        <span className={`text-xs font-semibold capitalize ${
                                            w.status === 'paid' ? 'text-green-600' : w.status === 'rejected' ? 'text-red-600' : 'text-gray-500'
                                        }`}>
                                            {w.status.replace(/_/g, ' ')}
                                        </span>
                                    </div>
                                    {w.rejection_reason && (
                                        <p className="text-xs text-red-600 mt-1">{w.rejection_reason}</p>
                                    )}
                                    <p className="text-[10px] text-gray-400 mt-0.5">{new Date(w.created_at).toLocaleString()}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {showTopUpModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowTopUpModal(false)}>
                        <div className="flat-card p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
                            <h3 className="text-sm font-semibold text-gray-900 mb-4">Top-up wallet</h3>
                            <form onSubmit={handleTopUp} className="space-y-4">
                                <input
                                    type="number"
                                    className="block w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-base font-semibold"
                                    placeholder="Amount (GHS)"
                                    value={topUpAmount}
                                    onChange={(e) => setTopUpAmount(e.target.value)}
                                    min="1"
                                    step="0.01"
                                    required
                                />
                                <div className="flex gap-2">
                                    <button type="button" onClick={() => setShowTopUpModal(false)} className="flex-1 py-3 rounded-xl text-sm font-semibold bg-gray-100">Cancel</button>
                                    <button type="submit" disabled={isToppingUp} className="flex-1 py-3 rounded-xl text-sm font-semibold text-white bg-brand disabled:opacity-50">
                                        {isToppingUp ? '…' : 'Deposit'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {showWithdrawModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowWithdrawModal(false)}>
                        <div className="flat-card p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                            <h3 className="text-sm font-semibold text-gray-900 mb-1">Request withdrawal</h3>
                            <p className="text-xs text-gray-500 mb-4">Admin will send funds manually, then approve to debit your wallet. Min ₵50.</p>
                            <form onSubmit={handleWithdraw} className="space-y-3">
                                <input
                                    type="number"
                                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm"
                                    placeholder="Amount (GHS)"
                                    value={withdrawForm.amount}
                                    onChange={(e) => setWithdrawForm({ ...withdrawForm, amount: e.target.value })}
                                    min="50"
                                    step="0.01"
                                    required
                                />
                                <select
                                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm"
                                    value={withdrawForm.method}
                                    onChange={(e) => setWithdrawForm({ ...withdrawForm, method: e.target.value as 'mobile_money' | 'bank_transfer' })}
                                >
                                    <option value="mobile_money">Mobile Money</option>
                                    <option value="bank_transfer">Bank transfer</option>
                                </select>
                                <input
                                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm"
                                    placeholder="Account name"
                                    value={withdrawForm.account_name}
                                    onChange={(e) => setWithdrawForm({ ...withdrawForm, account_name: e.target.value })}
                                    required
                                />
                                {withdrawForm.method === 'mobile_money' ? (
                                    <>
                                        <input
                                            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm"
                                            placeholder="Phone number"
                                            value={withdrawForm.phone}
                                            onChange={(e) => setWithdrawForm({ ...withdrawForm, phone: e.target.value })}
                                            required
                                        />
                                        <select
                                            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm"
                                            value={withdrawForm.network}
                                            onChange={(e) => setWithdrawForm({ ...withdrawForm, network: e.target.value })}
                                        >
                                            <option value="MTN">MTN</option>
                                            <option value="Vodafone">Vodafone</option>
                                            <option value="AirtelTigo">AirtelTigo</option>
                                        </select>
                                    </>
                                ) : (
                                    <>
                                        <input
                                            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm"
                                            placeholder="Bank name"
                                            value={withdrawForm.bank_name}
                                            onChange={(e) => setWithdrawForm({ ...withdrawForm, bank_name: e.target.value })}
                                            required
                                        />
                                        <input
                                            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm"
                                            placeholder="Account number"
                                            value={withdrawForm.account_number}
                                            onChange={(e) => setWithdrawForm({ ...withdrawForm, account_number: e.target.value })}
                                            required
                                        />
                                    </>
                                )}
                                <div className="flex gap-2 pt-2">
                                    <button type="button" onClick={() => setShowWithdrawModal(false)} className="flex-1 py-3 rounded-xl text-sm font-semibold bg-gray-100">Cancel</button>
                                    <button type="submit" disabled={withdrawing} className="flex-1 py-3 rounded-xl text-sm font-semibold text-white bg-brand disabled:opacity-50">
                                        {withdrawing ? 'Submitting…' : 'Submit request'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                <div id="wallet-transaction-history" className="scroll-mt-6">
                    <GroupedList aria-label="Transaction history">
                        <GroupedListHeader
                            title="Transaction history"
                            icon={HistoryIcon}
                            action={
                                <button type="button" onClick={fetchData} className="min-w-[44px] min-h-[44px] rounded-xl border border-gray-200/90 bg-white flex items-center justify-center text-gray-400 hover:text-brand" aria-label="Refresh">
                                    <RefreshCw className="h-4 w-4" />
                                </button>
                            }
                        />
                        {loading && transactions.length === 0 ? (
                            <GroupedListEmpty message="Loading transactions…" />
                        ) : transactions.length === 0 ? (
                            <GroupedListEmpty icon={Wallet} message="No transactions yet" />
                        ) : (
                            transactions.map((tx) => {
                                const isCredit = tx.type === 'credit';
                                return (
                                    <GroupedListRow
                                        key={tx.id}
                                        icon={isCredit ? ArrowDownLeft : ArrowUpRight}
                                        iconClassName={isCredit ? 'bg-green-50 text-green-600' : 'bg-brand/10 text-brand'}
                                        title={tx.description || SOURCE_LABELS[tx.source] || tx.source}
                                        subtitle={new Date(tx.created_at).toLocaleString()}
                                        trailing={
                                            <span className={`text-sm font-semibold tabular-nums ${isCredit ? 'text-green-600' : 'text-gray-900'}`}>
                                                {isCredit ? '+' : '-'}₵{Number(tx.amount_ghs).toFixed(2)}
                                            </span>
                                        }
                                    />
                                );
                            })
                        )}
                    </GroupedList>
                </div>
            </div>
        </DashboardLayout>
    );
}
