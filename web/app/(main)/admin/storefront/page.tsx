'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Type, Save, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/axios';

const FIELDS = [
    { key: 'free_shipping_threshold_ghs', label: 'Free shipping threshold (₵)', placeholder: '500', type: 'text' },
    { key: 'standard_shipping_fee_ghs', label: 'Standard shipping fee (₵)', placeholder: '0', type: 'text' },
    { key: 'site_orders_delivered_text', label: 'Orders delivered text', placeholder: '10,000+ orders delivered', type: 'text' },
    { key: 'support_phone', label: 'Support phone', placeholder: '+86 183 2070 9024', type: 'text' },
    { key: 'support_email', label: 'Support email', placeholder: 'info@thinqshopping.app', type: 'email' },
] as const;

export default function AdminStorefront() {
    const [settings, setSettings] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const { data } = await api.get('/content/admin/settings/storefront');
                setSettings(data || {});
            } catch {
                toast.error('Failed to load storefront settings');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.patch('/content/admin/settings/storefront', settings);
            toast.success('Storefront settings saved.');
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Failed to save');
        } finally {
            setSaving(false);
        }
    };

    return (
        <DashboardLayout isAdmin={true}>
            <div className="pb-6 md:pb-8">
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                    <Type className="h-7 w-7 text-blue-600" />
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Storefront</h1>
                        <p className="text-xs text-gray-500 mt-0.5">Manage storefront copy, shipping values, and support contacts</p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving || loading}
                    className="min-h-[44px] px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50 touch-manipulation"
                >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save
                </button>
            </div>

            {loading ? (
                <div className="min-h-[200px] flex items-center justify-center text-gray-500 text-sm">Loading…</div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6 space-y-5">
                    {FIELDS.map(({ key, label, placeholder, type }) => (
                        <div key={key}>
                            <label htmlFor={key} className="block text-sm font-semibold text-gray-700 mb-1.5">
                                {label}
                            </label>
                            <input
                                id={key}
                                type={type}
                                value={settings[key] ?? ''}
                                onChange={(e) => setSettings((s) => ({ ...s, [key]: e.target.value }))}
                                placeholder={placeholder}
                                className="w-full min-h-[44px] px-4 rounded-xl border border-gray-200 text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation"
                            />
                        </div>
                    ))}
                </div>
            )}
            </div>
        </DashboardLayout>
    );
}
