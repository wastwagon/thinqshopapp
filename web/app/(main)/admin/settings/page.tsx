'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import api from '@/lib/axios';
import {
    Settings,
    Globe,
    Zap,
    Save,
    RefreshCw,
    Percent,
    Shield,
    Play,
    DatabaseIcon,
    Smartphone,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import Button from '@/components/ui/Button';

type PaymentDetailsForm = {
    momo_agent_number: string;
    momo_name_primary: string;
    momo_name_alternate: string;
    momo_network: string;
};

const EMPTY_PAYMENT: PaymentDetailsForm = {
    momo_agent_number: '',
    momo_name_primary: '',
    momo_name_alternate: '',
    momo_network: '',
};

export default function AdminSettings() {
    const [settings, setSettings] = useState({
        ghsCnyRate: '',
        procurementFee: '5.0',
        maintenanceMode: false,
        debugLogs: true,
        allowAutomaticPayouts: false
    });
    const [paymentDetails, setPaymentDetails] = useState<PaymentDetailsForm>(EMPTY_PAYMENT);
    const [rateLoading, setRateLoading] = useState(true);
    const [savingRate, setSavingRate] = useState(false);
    const [savingPayment, setSavingPayment] = useState(false);
    const [dbAction, setDbAction] = useState<'idle' | 'migrate' | 'seed' | 'migrate-seed'>('idle');

    useEffect(() => {
        (async () => {
            try {
                const [rateRes, payRes] = await Promise.all([
                    api.get('/finance/transfers/rate'),
                    api.get('/finance/transfers/admin/payment-details'),
                ]);
                setSettings((s) => ({ ...s, ghsCnyRate: String(rateRes.data.rate_ghs_to_cny ?? '') }));
                setPaymentDetails({ ...EMPTY_PAYMENT, ...payRes.data });
            } catch {
                setSettings((s) => ({ ...s, ghsCnyRate: '0.055' }));
            } finally {
                setRateLoading(false);
            }
        })();
    }, []);

    const handleSaveRate = async () => {
        const rate = Number(settings.ghsCnyRate);
        if (!Number.isFinite(rate) || rate <= 0) {
            toast.error('Enter a valid GHS → CNY rate (positive number)');
            return;
        }
        setSavingRate(true);
        try {
            await api.patch('/finance/transfers/admin/rate', { rate_ghs_to_cny: rate });
            toast.success('Exchange rate updated.');
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Failed to save rate');
        } finally {
            setSavingRate(false);
        }
    };

    const handleSavePaymentDetails = async () => {
        if (!paymentDetails.momo_agent_number.trim()) {
            toast.error('MoMo agent number is required');
            return;
        }
        setSavingPayment(true);
        try {
            const { data } = await api.patch('/finance/transfers/admin/payment-details', paymentDetails);
            setPaymentDetails({ ...EMPTY_PAYMENT, ...data });
            toast.success('Transfer payment details updated.');
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Failed to save payment details');
        } finally {
            setSavingPayment(false);
        }
    };

    const handleSave = async () => {
        await handleSaveRate();
        await handleSavePaymentDetails();
    };

    const runDbAction = async (action: 'migrate' | 'seed' | 'migrate-seed') => {
        setDbAction(action);
        try {
            const endpoint = action === 'migrate' ? '/admin/database/migrate' : action === 'seed' ? '/admin/database/seed' : '/admin/database/migrate-seed';
            const { data } = await api.post(endpoint);
            toast.success(data.message || `${action} complete`);
        } catch (e: any) {
            const msg = e.response?.data?.message || e.response?.data?.error || e.message || 'Action failed';
            toast.error(msg);
        } finally {
            setDbAction('idle');
        }
    };

    return (
        <DashboardLayout isAdmin={true}>
            <div className="pb-6 md:pb-8">
            <AdminPageHeader
                icon={Settings}
                title="Settings"
                subtitle="Manage operational controls and platform defaults"
                actions={
                    <Button
                        type="button"
                        size="sm"
                        onClick={handleSave}
                        disabled={savingRate || savingPayment || rateLoading}
                        loading={savingRate || savingPayment}
                        leftIcon={!(savingRate || savingPayment) ? <Save className="h-3.5 w-3.5" /> : undefined}
                    >
                        Save
                    </Button>
                }
            />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
                {/* Exchange & fees */}
                <div className="lg:col-span-2 space-y-4 min-w-0">
                    <div className="admin-card p-5">
                        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2.5 mb-4">
                            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-200">
                                <Globe className="h-4 w-4" />
                            </div>
                            Exchange rates
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-500">GHS to CNY (1 GHS = ? CNY)</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        step="0.0001"
                                        min="0"
                                        placeholder="e.g. 0.65"
                                        className="w-full h-11 bg-gray-50 border border-gray-100 rounded-lg px-3 pr-12 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                        value={settings.ghsCnyRate}
                                        onChange={(e) => setSettings({ ...settings, ghsCnyRate: e.target.value })}
                                        disabled={rateLoading}
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        {rateLoading ? <RefreshCw className="h-3.5 w-3.5 text-blue-600 animate-spin" /> : <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">Live</span>}
                                    </div>
                                </div>
                                <p className="text-xs text-gray-400">Used to convert customer transfer amounts.</p>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-500">Procurement fee (%)</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        step="0.1"
                                        className="w-full h-11 bg-gray-50 border border-gray-100 rounded-lg px-3 pr-10 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                        value={settings.procurementFee}
                                        onChange={(e) => setSettings({ ...settings, procurementFee: e.target.value })}
                                    />
                                    <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                </div>
                                <p className="text-xs text-gray-400">Not saved yet — display only until the fee API is wired.</p>
                            </div>
                        </div>
                    </div>

                    <div className="admin-card p-5">
                        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2.5 mb-4">
                            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-brand border border-blue-100">
                                <Smartphone className="h-4 w-4" />
                            </div>
                            Transfer payment details (offline)
                        </h3>
                        <p className="text-xs text-gray-500 mb-4">
                            Shown to customers when they pay by Mobile Money. They copy these details and pay manually.
                        </p>

                        <div className="space-y-4">
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <Smartphone className="h-3.5 w-3.5" /> Mobile Money
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-gray-500">MOMO Agent Number</label>
                                        <input
                                            type="text"
                                            className="w-full h-11 bg-gray-50 border border-gray-100 rounded-lg px-3 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                            value={paymentDetails.momo_agent_number}
                                            onChange={(e) => setPaymentDetails({ ...paymentDetails, momo_agent_number: e.target.value })}
                                            placeholder="0539761297"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-gray-500">Network</label>
                                        <input
                                            type="text"
                                            className="w-full h-11 bg-gray-50 border border-gray-100 rounded-lg px-3 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                            value={paymentDetails.momo_network}
                                            onChange={(e) => setPaymentDetails({ ...paymentDetails, momo_network: e.target.value })}
                                            placeholder="MTN"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-gray-500">Name (primary)</label>
                                        <input
                                            type="text"
                                            className="w-full h-11 bg-gray-50 border border-gray-100 rounded-lg px-3 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                            value={paymentDetails.momo_name_primary}
                                            onChange={(e) => setPaymentDetails({ ...paymentDetails, momo_name_primary: e.target.value })}
                                            placeholder="Gohdit Print and Computers"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-gray-500">Name (alternate)</label>
                                        <input
                                            type="text"
                                            className="w-full h-11 bg-gray-50 border border-gray-100 rounded-lg px-3 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                            value={paymentDetails.momo_name_alternate}
                                            onChange={(e) => setPaymentDetails({ ...paymentDetails, momo_name_alternate: e.target.value })}
                                            placeholder="Emmanuel ASIEDU"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleSavePaymentDetails}
                                disabled={savingPayment}
                                className="h-9 px-4 rounded-lg bg-brand text-white text-xs font-semibold hover:bg-brand/90 disabled:opacity-50"
                            >
                                {savingPayment ? 'Saving…' : 'Save payment details'}
                            </button>
                        </div>
                    </div>

                    <div className="admin-card p-5">
                        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2.5 mb-3">
                            <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500 border border-orange-100">
                                <Zap className="h-4 w-4" />
                            </div>
                            Safety & access
                        </h3>
                        <p className="text-sm text-gray-600">
                            Maintenance mode, auto-payouts, and debug logging are not wired to the API yet. They are omitted here so they cannot be mistaken for live controls.
                        </p>
                    </div>
                </div>

                {/* Status & audit – right column: stack cards with clear separation */}
                <div className="lg:sticky lg:top-6 flex flex-col gap-5 min-w-0">
                    <section className="admin-card p-5" aria-label="System tools">
                        <h3 className="text-sm font-bold text-gray-900 mb-1">System tools</h3>
                        <p className="text-xs text-gray-500 mb-4">Database actions require runtime admin to be enabled on the server.</p>
                        <p className="text-xs font-semibold text-gray-500 mb-2">Database</p>
                        <div className="flex flex-col gap-2">
                            <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                onClick={() => runDbAction('migrate')}
                                disabled={dbAction !== 'idle'}
                                loading={dbAction === 'migrate'}
                                leftIcon={dbAction !== 'migrate' ? <DatabaseIcon className="h-3.5 w-3.5" /> : undefined}
                                className="w-full border-blue-300 text-brand"
                            >
                                Run migrations
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                onClick={() => runDbAction('seed')}
                                disabled={dbAction !== 'idle'}
                                loading={dbAction === 'seed'}
                                leftIcon={dbAction !== 'seed' ? <Play className="h-3.5 w-3.5" /> : undefined}
                                className="w-full border-emerald-200 text-emerald-600"
                            >
                                Run seed
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                onClick={() => runDbAction('migrate-seed')}
                                disabled={dbAction !== 'idle'}
                                loading={dbAction === 'migrate-seed'}
                                leftIcon={dbAction !== 'migrate-seed' ? <RefreshCw className="h-3.5 w-3.5" /> : undefined}
                                className="w-full"
                            >
                                Migrate + seed
                            </Button>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">Apply migrations and/or seed data. Admin only.</p>
                    </section>

                    <section className="bg-gray-900 rounded-xl p-5 text-white" aria-label="Audit log">
                        <div className="flex items-center gap-2 mb-2">
                            <Shield className="h-4 w-4 text-blue-600/70" />
                            <h4 className="text-sm font-bold">Audit log</h4>
                        </div>
                        <p className="text-xs text-gray-400 leading-relaxed">Changes to settings are logged for security and compliance.</p>
                        <Link href="/admin/audit-logs" className="inline-flex mt-3 text-xs font-semibold text-blue-600/70 hover:text-white/90">
                            View audit logs {'->'}
                        </Link>
                    </section>
                </div>
            </div>
            </div>
        </DashboardLayout>
    );
}
