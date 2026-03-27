'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/axios';
import {
    Settings,
    Globe,
    Lock,
    Zap,
    Save,
    Database,
    RefreshCw,
    Percent,
    Shield,
    Play,
    DatabaseIcon,
    Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminSettings() {
    const [settings, setSettings] = useState({
        ghsCnyRate: '',
        procurementFee: '5.0',
        maintenanceMode: false,
        debugLogs: true,
        allowAutomaticPayouts: false
    });
    const [rateLoading, setRateLoading] = useState(true);
    const [savingRate, setSavingRate] = useState(false);
    const [dbAction, setDbAction] = useState<'idle' | 'migrate' | 'seed' | 'migrate-seed'>('idle');

    useEffect(() => {
        (async () => {
            try {
                const { data } = await api.get('/finance/transfers/rate');
                setSettings((s) => ({ ...s, ghsCnyRate: String(data.rate_ghs_to_cny ?? '') }));
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

    const handleSave = async () => {
        await handleSaveRate();
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

    const toggles = [
        { id: 'maintenanceMode', label: 'Maintenance mode', desc: 'When on, users cannot place orders or use the dashboard.', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100', icon: Lock },
        { id: 'allowAutomaticPayouts', label: 'Auto-approve small payouts', desc: 'Automatically approve transfer payouts under ₵5,000.', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', icon: Database },
        { id: 'debugLogs', label: 'Debug logging', desc: 'Save detailed logs for troubleshooting.', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', icon: Settings },
    ];

    return (
        <DashboardLayout isAdmin={true}>
            <div className="pb-6 md:pb-8">
            <div className="mb-4 flex flex-col md:flex-row justify-between items-start md:items-end gap-3">
                <div className="flex items-center gap-3">
                    <Settings className="h-7 w-7 text-blue-600" />
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Settings</h1>
                        <p className="text-xs text-gray-500 mt-0.5">System configuration</p>
                    </div>
                </div>
                <button type="button" onClick={handleSave} disabled={savingRate || rateLoading} className="h-9 px-4 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-gray-900 transition-all flex items-center gap-2 disabled:opacity-50">
                    <Save className="h-3.5 w-3.5" />
                    {savingRate ? 'Saving…' : 'Save'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
                {/* Exchange & fees */}
                <div className="lg:col-span-2 space-y-4 min-w-0">
                    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2.5 mb-4">
                            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
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
                                <p className="text-xs text-gray-400">Used for transfers.</p>
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
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2.5 mb-3">
                            <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500 border border-orange-100">
                                <Zap className="h-4 w-4" />
                            </div>
                            Safety & access
                        </h3>
                        <div className="space-y-2">
                            {toggles.map((t) => (
                                <div key={t.id} className="flex items-center justify-between py-3 px-4 bg-gray-50/50 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                                    <div className="flex gap-3 items-center min-w-0">
                                        <div className={`p-2 rounded-lg ${t.bg} ${t.border} border shrink-0 ${t.color}`}>
                                            <t.icon className="h-4 w-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-gray-900">{t.label}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">{t.desc}</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setSettings({ ...settings, [t.id]: !settings[t.id as keyof typeof settings] })}
                                        className={`w-12 h-6 rounded-full transition-all relative shrink-0 ${settings[t.id as keyof typeof settings] ? 'bg-blue-600' : 'bg-gray-200'}`}
                                    >
                                        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${settings[t.id as keyof typeof settings] ? 'left-6' : 'left-0.5'}`} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Status & audit – right column: stack cards with clear separation */}
                <div className="lg:sticky lg:top-6 flex flex-col gap-5 min-w-0">
                    <section className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm" aria-label="System status">
                        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-4">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" aria-hidden />
                            System status
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <p className="text-xs font-semibold text-gray-500 mb-1">Uptime</p>
                                <p className="text-2xl font-bold text-gray-900">99.9%</p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-500 mb-2">Services</p>
                                <div className="flex gap-1.5">
                                    {[1, 2, 3, 4, 5].map((n) => (
                                        <div key={n} className="flex-1 h-8 bg-gray-100 rounded-md overflow-hidden relative">
                                            <div className="absolute bottom-0 left-0 w-full h-2/3 bg-blue-500 rounded-b-md" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {/* Database migration & seeding */}
                        <div className="space-y-2">
                            <p className="text-xs font-semibold text-gray-500 mb-2">Database</p>
                            <div className="flex flex-col gap-2">
                                <button
                                    type="button"
                                    onClick={() => runDbAction('migrate')}
                                    disabled={dbAction !== 'idle'}
                                    className="w-full h-9 border border-blue-200 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {dbAction === 'migrate' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <DatabaseIcon className="h-3.5 w-3.5" />}
                                    Run migrations
                                </button>
                                <button
                                    type="button"
                                    onClick={() => runDbAction('seed')}
                                    disabled={dbAction !== 'idle'}
                                    className="w-full h-9 border border-emerald-200 text-emerald-600 rounded-lg text-xs font-semibold hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {dbAction === 'seed' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                                    Run seed
                                </button>
                                <button
                                    type="button"
                                    onClick={() => runDbAction('migrate-seed')}
                                    disabled={dbAction !== 'idle'}
                                    className="w-full h-9 border border-violet-200 text-violet-600 rounded-lg text-xs font-semibold hover:bg-violet-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {dbAction === 'migrate-seed' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                                    Migrate + seed
                                </button>
                            </div>
                            <p className="text-xs text-gray-400">Apply migrations and/or seed data. Admin only.</p>
                        </div>
                        <button type="button" className="w-full h-9 border border-red-200 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-50 transition-colors">
                            Clear cache
                        </button>
                        </div>
                    </section>

                    <section className="bg-gray-900 rounded-xl p-5 text-white" aria-label="Audit log">
                        <div className="flex items-center gap-2 mb-2">
                            <Shield className="h-4 w-4 text-blue-400" />
                            <h4 className="text-sm font-bold">Audit log</h4>
                        </div>
                        <p className="text-xs text-gray-400 leading-relaxed">Changes to settings are logged for security and compliance.</p>
                    </section>
                </div>
            </div>
            </div>
        </DashboardLayout>
    );
}
