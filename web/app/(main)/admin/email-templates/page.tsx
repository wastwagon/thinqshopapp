'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import FormField from '@/components/ui/FormField';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import api from '@/lib/axios';
import { Edit3, Save, RefreshCw, Mail, ToggleLeft, ToggleRight } from 'lucide-react';
import toast from 'react-hot-toast';

interface EmailTemplate {
    id: number;
    trigger_key: string;
    name: string;
    subject: string;
    body: string;
    is_enabled: boolean;
}

export default function AdminEmailTemplatesPage() {
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<{ subject: string; body: string; is_enabled: boolean } | null>(null);
    const [saving, setSaving] = useState(false);

    const fetchTemplates = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/admin/email-templates');
            setTemplates(Array.isArray(data) ? data : []);
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Failed to load templates');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTemplates();
    }, []);

    const startEdit = (t: EmailTemplate) => {
        setEditingId(t.id);
        setEditForm({ subject: t.subject, body: t.body, is_enabled: t.is_enabled });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditForm(null);
    };

    const saveEdit = async () => {
        if (editingId == null || !editForm) return;
        setSaving(true);
        try {
            await api.patch(`/admin/email-templates/${editingId}`, editForm);
            toast.success('Template updated');
            setEditingId(null);
            setEditForm(null);
            fetchTemplates();
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const toggleEnabled = async (t: EmailTemplate) => {
        try {
            await api.patch(`/admin/email-templates/${t.id}`, { is_enabled: !t.is_enabled });
            toast.success(t.is_enabled ? 'Template disabled' : 'Template enabled');
            fetchTemplates();
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Failed to update');
        }
    };

    return (
        <DashboardLayout isAdmin={true}>
            <div className="pb-6 md:pb-8">
                <AdminPageHeader
                    icon={Mail}
                    title="Email templates"
                    subtitle="Notification templates and triggers. Placeholders: {{order_number}}, {{total}}, {{user_name}}, {{amount}}, {{transfer_token}}"
                    actions={
                        <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={fetchTemplates}
                            disabled={loading}
                            leftIcon={<RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />}
                        >
                            Refresh
                        </Button>
                    }
                />

                {loading && templates.length === 0 ? (
                    <div className="admin-card p-12 flex justify-center">
                        <LoadingSpinner label="Loading templates…" />
                    </div>
                ) : (
                    <div className="space-y-4">
                        {templates.map((t) => (
                            <div key={t.id} className="admin-card overflow-hidden">
                                <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/50 gap-3 flex-wrap">
                                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                                        <span className="text-sm font-bold text-gray-900">{t.name}</span>
                                        <code className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                            {t.trigger_key}
                                        </code>
                                        <Badge variant={t.is_enabled ? 'success' : 'default'}>
                                            {t.is_enabled ? 'Enabled' : 'Disabled'}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => toggleEnabled(t)}
                                            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
                                            aria-label={t.is_enabled ? 'Disable' : 'Enable'}
                                        >
                                            {t.is_enabled ? (
                                                <ToggleRight className="h-5 w-5 text-emerald-600" />
                                            ) : (
                                                <ToggleLeft className="h-5 w-5 text-gray-400" />
                                            )}
                                        </button>
                                        {editingId !== t.id ? (
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="secondary"
                                                leftIcon={<Edit3 className="h-3.5 w-3.5" />}
                                                onClick={() => startEdit(t)}
                                            >
                                                Edit
                                            </Button>
                                        ) : (
                                            <>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="secondary"
                                                    onClick={cancelEdit}
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    loading={saving}
                                                    disabled={saving}
                                                    leftIcon={!saving ? <Save className="h-3.5 w-3.5" /> : undefined}
                                                    onClick={saveEdit}
                                                >
                                                    Save
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                                {editingId === t.id && editForm && (
                                    <div className="p-5 space-y-4">
                                        <FormField label="Subject" htmlFor={`subj-${t.id}`}>
                                            <Input
                                                id={`subj-${t.id}`}
                                                type="text"
                                                value={editForm.subject}
                                                onChange={(e) =>
                                                    setEditForm((f) => f && { ...f, subject: e.target.value })
                                                }
                                            />
                                        </FormField>
                                        <FormField label="Body" htmlFor={`body-${t.id}`}>
                                            <Textarea
                                                id={`body-${t.id}`}
                                                value={editForm.body}
                                                onChange={(e) =>
                                                    setEditForm((f) => f && { ...f, body: e.target.value })
                                                }
                                                rows={6}
                                                className="font-mono"
                                            />
                                        </FormField>
                                    </div>
                                )}
                                {editingId !== t.id && (
                                    <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
                                                Subject
                                            </p>
                                            <p className="text-gray-900">{t.subject}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
                                                Body (preview)
                                            </p>
                                            <p className="text-gray-600 whitespace-pre-wrap line-clamp-3">{t.body}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
