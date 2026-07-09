'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import api from '@/lib/axios';
import { Plus, ArrowUpRight, ArrowDownLeft, Wallet, RefreshCw, History as HistoryIcon, Activity, Banknote } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { GroupedList, GroupedListHeader, GroupedListEmpty, GroupedListRow } from '@/components/ui/GroupedList';
import DashboardPageHeader from '@/components/dashboard/DashboardPageHeader';
import DashboardContent from '@/components/dashboard/DashboardContent';
import DashboardWalletBalancePanel from '@/components/dashboard/DashboardWalletBalancePanel';
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
    order_refund: 'Order refund',
    other: 'Adjustment',
};

const ESCROW_EVENT_LABELS: Record<string, string> = {
    locked: 'Escrow locked',
    hold_placed: 'Dispute hold',
    hold_released: 'Hold released',
    released: 'Payout released',
    voided: 'Sale voided',
    auto_released: 'Auto-released',
    clawback_pending: 'Clawback pending',
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
    const [balanceHidden, setBalanceHidden] = useState(false);
    const [balance, setBalance] = useState<number | null>(null);
    const [availableBalance, setAvailableBalance] = useState<number | null>(null);
    const [pendingWithdrawal, setPendingWithdrawal] = useState(0);
    const [pendingConsignmentPayout, setPendingConsignmentPayout] = useState(0);
    const [pendingConsignmentSales, setPendingConsignmentSales] = useState<Array<{
        id: number;
        name: string;
        submission_number: string;
        expected_payout_ghs: number;
        sold_at?: string;
        escrow_on_hold?: boolean;
        escrow_hold_reason?: string | null;
    }>>([]);
    const [pendingClawback, setPendingClawback] = useState(0);
    const [pendingClawbackItems, setPendingClawbackItems] = useState<Array<{
        id: number;
        item_name: string;
        submission_number: string;
        outstanding_ghs: number;
        notes?: string | null;
    }>>([]);
    const [escrowLedgerModal, setEscrowLedgerModal] = useState<{ id: number; name: string } | null>(null);
    const [escrowLedgerEntries, setEscrowLedgerEntries] = useState<Array<{
        id: number;
        event_type: string;
        note?: string | null;
        created_at: string;
    }>>([]);
    const [escrowLedgerLoading, setEscrowLedgerLoading] = useState(false);
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

    const openEscrowLedger = async (id: number, name: string) => {
        setEscrowLedgerModal({ id, name });
        setEscrowLedgerLoading(true);
        try {
            const { data } = await api.get(`/consignment/submissions/${id}/escrow-ledger`);
            setEscrowLedgerEntries(Array.isArray(data) ? data : []);
        } catch {
            toast.error('Could not load payout history');
            setEscrowLedgerEntries([]);
        } finally {
            setEscrowLedgerLoading(false);
        }
    };

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
            setPendingConsignmentPayout(Number(walletRes.data.pending_consignment_payout_ghs ?? 0));
            setPendingConsignmentSales(Array.isArray(walletRes.data.pending_consignment_sales) ? walletRes.data.pending_consignment_sales : []);
            setPendingClawback(Number(walletRes.data.pending_clawback_ghs ?? 0));
            setPendingClawbackItems(Array.isArray(walletRes.data.pending_clawback_items) ? walletRes.data.pending_clawback_items : []);
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
            <DashboardContent wide>
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

                <DashboardPageHeader
                    title="Wallet"
                    subtitle="Unified balance for shop, services, Sell for Me payouts, and order refunds"
                    accent="navy"
                    action={
                        <button
                            type="button"
                            onClick={() => document.getElementById('wallet-transaction-history')?.scrollIntoView({ behavior: 'smooth' })}
                            className="h-9 px-4 rounded-xl text-xs font-semibold border border-gray-200/90 text-gray-600 hover:border-blue-500/30 hover:text-blue-600 flex items-center gap-2 transition-colors"
                        >
                            <Activity className="h-3.5 w-3.5" />
                            Activity
                        </button>
                    }
                />

                <DashboardWalletBalancePanel
                    label="Available to withdraw"
                    amount={availableBalance !== null ? availableBalance.toFixed(2) : '0.00'}
                    hidden={balanceHidden}
                    onToggleHidden={() => setBalanceHidden((v) => !v)}
                    footer={
                        <>
                            <p>In your wallet now · Min withdrawal ₵50 · Approved order refunds are credited here (not to card/MoMo)</p>
                            {balance !== null && (
                                <p>
                                    Wallet balance ₵{balance.toFixed(2)}
                                    {pendingWithdrawal > 0 && ` · ₵${pendingWithdrawal.toFixed(2)} reserved for pending withdrawals`}
                                </p>
                            )}
                            {pendingConsignmentPayout > 0 && (
                                <p className="text-violet-200">
                                    ₵{pendingConsignmentPayout.toFixed(2)} pending from Sell for Me sales (released when buyer delivery is confirmed)
                                </p>
                            )}
                            {pendingClawback > 0 && (
                                <p className="text-amber-200">
                                    ₵{pendingClawback.toFixed(2)} reserved — Sell for Me payout adjustment after buyer refund
                                </p>
                            )}
                        </>
                    }
                    actions={
                        <>
                            <button
                                type="button"
                                onClick={() => setShowTopUpModal(true)}
                                className="h-10 px-5 bg-white text-blue-950 rounded-xl font-semibold text-xs hover:bg-blue-50 transition-colors flex items-center gap-2"
                            >
                                <Plus className="h-4 w-4" />
                                Top-up
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowWithdrawModal(true)}
                                disabled={availableBalance === null || availableBalance < 50}
                                className="h-10 px-5 bg-white/10 border border-white/25 text-white rounded-xl font-semibold text-xs hover:bg-white/15 transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                                <Banknote className="h-4 w-4" />
                                Withdraw
                            </button>
                        </>
                    }
                />

                {pendingConsignmentSales.length > 0 && (
                    <div className="flat-card p-4 mb-4 border border-violet-100 bg-violet-50/40">
                        <p className="text-xs font-semibold text-violet-900 mb-1">Pending from sales (escrow)</p>
                        <p className="text-[11px] text-violet-700/90 mb-3">
                            Not withdrawable yet. Admin marks the order delivered after verifying shipment with the buyer.
                        </p>
                        <ul className="space-y-2">
                            {pendingConsignmentSales.map((sale) => (
                                <li key={sale.id} className="flex items-center justify-between gap-2 text-sm">
                                    <span className="text-gray-800 truncate min-w-0">
                                        {sale.name}
                                        {sale.escrow_on_hold && (
                                            <span className="block text-[10px] text-amber-700">On hold — {sale.escrow_hold_reason || 'under review'}</span>
                                        )}
                                    </span>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => openEscrowLedger(sale.id, sale.name)}
                                            className="text-[10px] font-semibold text-blue-600 hover:underline"
                                        >
                                            History
                                        </button>
                                        <span className="text-violet-800 font-semibold tabular-nums">
                                            ₵{Number(sale.expected_payout_ghs).toFixed(2)}
                                        </span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                        <Link href="/dashboard/sell-for-me" className="inline-block mt-3 text-xs font-semibold text-blue-600 hover:underline">
                            View Sell for Me listings
                        </Link>
                    </div>
                )}

                {pendingClawbackItems.length > 0 && (
                    <div className="flat-card p-4 mb-4 border border-amber-200 bg-amber-50/50">
                        <p className="text-xs font-semibold text-amber-900 mb-1">Sell for Me payout adjustment due</p>
                        <p className="text-[11px] text-amber-800/90 mb-3">
                            A buyer refund occurred after your payout was credited. The outstanding amount reduces what you can withdraw until settled.
                        </p>
                        <ul className="space-y-2">
                            {pendingClawbackItems.map((item) => (
                                <li key={item.id} className="flex items-center justify-between gap-2 text-sm">
                                    <span className="text-gray-800 truncate min-w-0">
                                        {item.item_name}
                                        <span className="block text-[10px] text-gray-500">{item.submission_number}</span>
                                    </span>
                                    <span className="text-amber-800 font-semibold tabular-nums shrink-0">
                                        ₵{Number(item.outstanding_ghs).toFixed(2)} due
                                    </span>
                                </li>
                            ))}
                        </ul>
                        <Link href="/dashboard/sell-for-me" className="inline-block mt-3 text-xs font-semibold text-blue-600 hover:underline">
                            View Sell for Me listings
                        </Link>
                    </div>
                )}

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
                                    <button type="submit" disabled={isToppingUp} className="flex-1 py-3 rounded-xl text-sm font-semibold text-white bg-blue-600 disabled:opacity-50">
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
                                    <button type="submit" disabled={withdrawing} className="flex-1 py-3 rounded-xl text-sm font-semibold text-white bg-blue-600 disabled:opacity-50">
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
                                <button type="button" onClick={fetchData} className="min-w-[44px] min-h-[44px] rounded-xl border border-gray-200/90 bg-white flex items-center justify-center text-gray-400 hover:text-blue-600" aria-label="Refresh">
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
                                        iconClassName={isCredit ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}
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
            </DashboardContent>

            {escrowLedgerModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setEscrowLedgerModal(null)} aria-hidden />
                    <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6 max-h-[80vh] overflow-y-auto">
                        <h2 className="text-lg font-bold text-gray-900 mb-1">Payout history</h2>
                        <p className="text-xs text-gray-500 mb-4">{escrowLedgerModal.name}</p>
                        {escrowLedgerLoading ? (
                            <p className="text-sm text-gray-500">Loading…</p>
                        ) : escrowLedgerEntries.length === 0 ? (
                            <p className="text-sm text-gray-500">No events recorded yet.</p>
                        ) : (
                            <ul className="space-y-2">
                                {escrowLedgerEntries.map((e) => (
                                    <li key={e.id} className="border border-gray-100 rounded-lg p-3 text-xs">
                                        <div className="flex justify-between gap-2">
                                            <span className="font-semibold">{ESCROW_EVENT_LABELS[e.event_type] ?? e.event_type}</span>
                                            <span className="text-gray-400">{new Date(e.created_at).toLocaleString()}</span>
                                        </div>
                                        {e.note && <p className="text-gray-600 mt-1">{e.note}</p>}
                                    </li>
                                ))}
                            </ul>
                        )}
                        <button type="button" onClick={() => setEscrowLedgerModal(null)} className="mt-4 w-full h-10 rounded-xl bg-gray-100 text-sm font-semibold">Close</button>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
