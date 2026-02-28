'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
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
            <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div className="flex items-center gap-3">
                    <Mail className="h-8 w-8 text-blue-600" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Email templates</h1>
                        <p className="text-xs text-gray-500 mt-0.5">Notification templates and triggers. Placeholders: &#123;&#123;order_number&#125;&#125;, &#123;&#123;total&#125;&#125;, &#123;&#123;user_name&#125;&#125;, &#123;&#123;amount&#125;&#125;, &#123;&#123;transfer_token&#125;&#125;</p>
                    </div>
                </div>
                <button type="button" onClick={fetchTemplates} disabled={loading} className="h-9 px-4 border border-gray-200 rounded-lg font-medium text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50">
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {loading && templates.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-500">Loading…</div>
            ) : (
                <div className="space-y-6">
                    {templates.map((t) => (
                        <div key={t.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-bold text-gray-900">{t.name}</span>
                                    <code className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{t.trigger_key}</code>
                                    {t.is_enabled ? (
                                        <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded">Enabled</span>
                                    ) : (
                                        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">Disabled</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button type="button" onClick={() => toggleEnabled(t)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600" aria-label={t.is_enabled ? 'Disable' : 'Enable'}>
                                        {t.is_enabled ? <ToggleRight className="h-5 w-5 text-green-600" /> : <ToggleLeft className="h-5 w-5 text-gray-400" />}
                                    </button>
                                    {editingId !== t.id ? (
                                        <button type="button" onClick={() => startEdit(t)} className="h-8 px-3 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                            <Edit3 className="h-3.5 w-3.5" /> Edit
                                        </button>
                                    ) : (
                                        <>
                                            <button type="button" onClick={cancelEdit} className="h-8 px-3 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                                            <button type="button" onClick={saveEdit} disabled={saving} className="h-8 px-3 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-gray-900 flex items-center gap-2 disabled:opacity-50">
                                                <Save className="h-3.5 w-3.5" /> Save
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                            {editingId === t.id && editForm && (
                                <div className="p-6 space-y-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Subject</label>
                                        <input type="text" value={editForm.subject} onChange={(e) => setEditForm((f) => f && { ...f, subject: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Body</label>
                                        <textarea value={editForm.body} onChange={(e) => setEditForm((f) => f && { ...f, body: e.target.value })} rows={6} className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm font-mono" />
                                    </div>
                                </div>
                            )}
                            {editingId !== t.id && (
                                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Subject</p>
                                        <p className="text-gray-900">{t.subject}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Body (preview)</p>
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
