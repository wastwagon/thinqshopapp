'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import FormField from '@/components/ui/FormField';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Type, Save } from 'lucide-react';
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
                <AdminPageHeader
                    icon={Type}
                    title="Storefront"
                    subtitle="Manage storefront copy, shipping values, and support contacts"
                    actions={
                        <Button
                            type="button"
                            size="sm"
                            onClick={handleSave}
                            disabled={saving || loading}
                            loading={saving}
                            leftIcon={!saving ? <Save className="h-4 w-4" /> : undefined}
                        >
                            Save
                        </Button>
                    }
                />

                {loading ? (
                    <div className="min-h-[200px] flex items-center justify-center">
                        <LoadingSpinner label="Loading…" />
                    </div>
                ) : (
                    <div className="admin-card p-4 sm:p-6 space-y-5">
                        {FIELDS.map(({ key, label, placeholder, type }) => (
                            <FormField key={key} label={label} htmlFor={key}>
                                <Input
                                    id={key}
                                    type={type}
                                    value={settings[key] ?? ''}
                                    onChange={(e) => setSettings((s) => ({ ...s, [key]: e.target.value }))}
                                    placeholder={placeholder}
                                />
                            </FormField>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
