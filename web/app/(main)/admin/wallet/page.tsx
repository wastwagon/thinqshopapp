'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminStatGrid from '@/components/admin/AdminStatGrid';
import AdminToolbar from '@/components/admin/AdminToolbar';
import AdminTable, {
    AdminTableBody,
    AdminTableEmpty,
    AdminTableHead,
    AdminTableLoading,
    AdminTd,
    AdminTh,
    AdminTr,
} from '@/components/admin/AdminTable';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import FormField from '@/components/ui/FormField';
import Modal from '@/components/ui/Modal';
import { Wallet, Plus, Minus, FileText, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/axios';

type WalletRow = {
    id: number;
    user_id: number;
    balance_ghs: number;
    updated_at: string;
    user: {
        id: number;
        email: string;
        phone?: string;
        role?: string;
        profile?: { first_name?: string; last_name?: string };
    };
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
            toast.success(
                `${adjustType === 'credit' ? 'Credited' : 'Debited'} ₵${Math.abs(amount).toFixed(2)} successfully`
            );
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
        {
            label: 'Total wallets',
            value: wallets.length,
            icon: Users,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            border: 'border-blue-200',
        },
        {
            label: 'Total balance',
            value: `₵${totalBalance.toFixed(2)}`,
            icon: Wallet,
            color: 'text-green-600',
            bg: 'bg-green-50',
            border: 'border-green-100',
        },
        {
            label: 'With balance',
            value: withBalanceCount,
            icon: Plus,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
            border: 'border-emerald-100',
        },
        {
            label: 'Zero balance',
            value: zeroBalanceCount,
            icon: FileText,
            color: 'text-gray-600',
            bg: 'bg-gray-50',
            border: 'border-gray-100',
        },
    ];

    return (
        <DashboardLayout isAdmin={true}>
            <div className="pb-6 md:pb-8">
                <AdminPageHeader
                    icon={Wallet}
                    title="Wallet management"
                    subtitle="Adjust customer wallet balances and review wallet activity"
                    actions={
                        <AdminToolbar
                            searchValue={searchTerm}
                            onSearchChange={setSearchTerm}
                            searchPlaceholder="Search name, email, phone…"
                            searchAriaLabel="Search wallets"
                        />
                    }
                />

                <AdminStatGrid items={stats} columns={4} />

                <AdminTable>
                    <AdminTableHead>
                        <AdminTh>User</AdminTh>
                        <AdminTh>Email</AdminTh>
                        <AdminTh>Balance</AdminTh>
                        <AdminTh>Updated</AdminTh>
                        <AdminTh align="right">Actions</AdminTh>
                    </AdminTableHead>
                    <AdminTableBody>
                        {loading ? (
                            <AdminTableLoading colSpan={5} />
                        ) : filtered.length === 0 ? (
                            <AdminTableEmpty
                                colSpan={5}
                                icon={<Wallet className="h-10 w-10 mx-auto mb-2 text-gray-200" />}
                                message="No wallets found"
                            />
                        ) : (
                            filtered.map((w) => (
                                <AdminTr key={w.id}>
                                    <AdminTd>
                                        <span className="text-xs font-semibold text-gray-900 truncate block max-w-[120px]">
                                            {userName(w)}
                                        </span>
                                    </AdminTd>
                                    <AdminTd>
                                        <span className="text-xs text-gray-700 truncate block max-w-[160px]">
                                            {w.user?.email ?? '—'}
                                        </span>
                                    </AdminTd>
                                    <AdminTd>
                                        <span className="text-xs font-semibold text-gray-900 tabular-nums">
                                            ₵{(w.balance_ghs ?? 0).toFixed(2)}
                                        </span>
                                    </AdminTd>
                                    <AdminTd className="text-xs text-gray-500">
                                        {w.updated_at
                                            ? new Date(w.updated_at).toLocaleDateString()
                                            : '—'}
                                    </AdminTd>
                                    <AdminTd className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button
                                                type="button"
                                                size="sm"
                                                leftIcon={<Plus className="h-3 w-3" />}
                                                onClick={() => {
                                                    setAdjusting({
                                                        user_id: w.user_id,
                                                        email: w.user?.email ?? '',
                                                    });
                                                    setAdjustType('credit');
                                                    setAdjustAmount('');
                                                }}
                                                className="h-8 min-h-[32px] px-2 text-xs bg-emerald-600 hover:bg-emerald-700"
                                            >
                                                Credit
                                            </Button>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="danger"
                                                leftIcon={<Minus className="h-3 w-3" />}
                                                disabled={(w.balance_ghs ?? 0) <= 0}
                                                onClick={() => {
                                                    setAdjusting({
                                                        user_id: w.user_id,
                                                        email: w.user?.email ?? '',
                                                    });
                                                    setAdjustType('debit');
                                                    setAdjustAmount('');
                                                }}
                                                className="h-8 min-h-[32px] px-2 text-xs"
                                            >
                                                Debit
                                            </Button>
                                        </div>
                                    </AdminTd>
                                </AdminTr>
                            ))
                        )}
                    </AdminTableBody>
                </AdminTable>

                <Modal
                    open={!!adjusting}
                    onClose={() => {
                        if (!submitting) setAdjusting(null);
                    }}
                    title={`${adjustType === 'credit' ? 'Credit' : 'Debit'} wallet`}
                    description={adjusting?.email}
                    footer={
                        <>
                            <Button
                                type="button"
                                variant="secondary"
                                disabled={submitting}
                                onClick={() => !submitting && setAdjusting(null)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                form="wallet-adjust-form"
                                loading={submitting}
                                disabled={submitting}
                                variant={adjustType === 'debit' ? 'danger' : 'primary'}
                                className={
                                    adjustType === 'credit'
                                        ? 'bg-emerald-600 hover:bg-emerald-700'
                                        : undefined
                                }
                            >
                                {adjustType === 'credit' ? 'Credit' : 'Debit'} ₵
                                {adjustAmount || '0'}
                            </Button>
                        </>
                    }
                >
                    <form id="wallet-adjust-form" onSubmit={handleAdjust} className="space-y-4">
                        <FormField label="Amount (GHS)" htmlFor="adjust-amount" required>
                            <Input
                                id="adjust-amount"
                                required
                                type="number"
                                step="0.01"
                                min={0}
                                placeholder="0.00"
                                value={adjustAmount}
                                onChange={(e) => setAdjustAmount(e.target.value)}
                            />
                        </FormField>
                        <p className="text-xs text-gray-500">
                            {adjustType === 'credit'
                                ? 'This amount will be added to the customer wallet.'
                                : 'This amount will be removed from the customer wallet.'}
                        </p>
                    </form>
                </Modal>
            </div>
        </DashboardLayout>
    );
}
