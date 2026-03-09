'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Layers, Plus, Edit3, Trash2, FileText, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/axios';

type VariationValue = { id: number; value: string; sort_order: number };
type VariationOption = { id: number; name: string; slug: string; sort_order: number; values: VariationValue[] };

export default function AdminVariationsPage() {
    const [options, setOptions] = useState<VariationOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [optionModalOpen, setOptionModalOpen] = useState(false);
    const [editingOption, setEditingOption] = useState<VariationOption | null>(null);
    const [optionForm, setOptionForm] = useState({ name: '', slug: '', sort_order: '0' });
    const [valueModalOpen, setValueModalOpen] = useState(false);
    const [selectedOption, setSelectedOption] = useState<VariationOption | null>(null);
    const [editingValue, setEditingValue] = useState<VariationValue | null>(null);
    const [valueForm, setValueForm] = useState({ value: '', sort_order: '0' });
    const [saving, setSaving] = useState(false);

    const fetchOptions = async () => {
        try {
            const { data } = await api.get('/variations/admin/options');
            setOptions(Array.isArray(data) ? data : []);
        } catch {
            toast.error('Failed to load variations');
            setOptions([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOptions();
    }, []);

    const openOptionModal = (opt: VariationOption | null) => {
        setEditingOption(opt);
        setOptionForm({
            name: opt?.name ?? '',
            slug: opt?.slug ?? '',
            sort_order: String(opt?.sort_order ?? 0),
        });
        setOptionModalOpen(true);
    };

    const saveOption = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!optionForm.name.trim()) {
            toast.error('Name is required');
            return;
        }
        setSaving(true);
        try {
            const payload = {
                name: optionForm.name.trim(),
                slug: optionForm.slug.trim() || undefined,
                sort_order: parseInt(optionForm.sort_order, 10) || 0,
            };
            if (editingOption) {
                await api.patch(`/variations/admin/options/${editingOption.id}`, payload);
                toast.success('Variation option updated');
            } else {
                await api.post('/variations/admin/options', payload);
                toast.success('Variation option created');
            }
            setOptionModalOpen(false);
            fetchOptions();
        } catch (e: any) {
            toast.error(e?.response?.data?.message || 'Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const deleteOption = async (id: number) => {
        if (!confirm('Delete this option and all its values?')) return;
        try {
            await api.delete(`/variations/admin/options/${id}`);
            toast.success('Deleted');
            setOptions(options.filter((o) => o.id !== id));
        } catch (e: any) {
            toast.error(e?.response?.data?.message || 'Failed to delete');
        }
    };

    const openValueModal = (option: VariationOption, val: VariationValue | null) => {
        setSelectedOption(option);
        setEditingValue(val);
        setValueForm({
            value: val?.value ?? '',
            sort_order: String(val?.sort_order ?? 0),
        });
        setValueModalOpen(true);
    };

    const saveValue = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedOption || !valueForm.value.trim()) {
            toast.error('Value is required');
            return;
        }
        setSaving(true);
        try {
            if (editingValue) {
                await api.patch(`/variations/admin/values/${editingValue.id}`, {
                    value: valueForm.value.trim(),
                    sort_order: parseInt(valueForm.sort_order, 10) || 0,
                });
                toast.success('Value updated');
            } else {
                await api.post('/variations/admin/values', {
                    variation_option_id: selectedOption.id,
                    value: valueForm.value.trim(),
                    sort_order: parseInt(valueForm.sort_order, 10) || 0,
                });
                toast.success('Value added');
            }
            setValueModalOpen(false);
            fetchOptions();
        } catch (e: any) {
            toast.error(e?.response?.data?.message || 'Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const deleteValue = async (optionId: number, valueId: number) => {
        if (!confirm('Delete this value?')) return;
        try {
            await api.delete(`/variations/admin/values/${valueId}`);
            toast.success('Deleted');
            setOptions((prev) =>
                prev.map((o) =>
                    o.id === optionId ? { ...o, values: o.values.filter((v) => v.id !== valueId) } : o
                )
            );
        } catch (e: any) {
            toast.error(e?.response?.data?.message || 'Failed to delete');
        }
    };

    return (
        <DashboardLayout isAdmin={true}>
            <div className="pb-6 md:pb-8">
                <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <Layers className="h-7 w-7 text-blue-600" />
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Variations</h1>
                            <p className="text-xs text-gray-500 mt-0.5">Options (e.g. Size, Color) and values for product variants</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => openOptionModal(null)}
                        className="min-h-[44px] px-4 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 flex items-center gap-2"
                    >
                        <Plus className="h-4 w-4" /> Add option
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                        <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-2">
                            <FileText className="h-4 w-4" />
                        </div>
                        <p className="text-xs font-semibold text-gray-500 mb-0.5">Options</p>
                        <p className="text-xl font-bold text-gray-900">{options.length}</p>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="py-12 flex justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                        </div>
                    ) : options.length === 0 ? (
                        <div className="py-12 text-center text-gray-500">
                            <Layers className="h-12 w-12 mx-auto mb-3 text-gray-200" />
                            <p className="text-sm font-medium">No variation options yet</p>
                            <p className="text-xs mt-1">Add options like Size or Color, then add values (e.g. S, M, L).</p>
                            <button
                                type="button"
                                onClick={() => openOptionModal(null)}
                                className="mt-4 min-h-[44px] px-4 rounded-lg bg-blue-600 text-white text-sm font-semibold"
                            >
                                Add first option
                            </button>
                        </div>
                    ) : (
                        <ul className="divide-y divide-gray-50">
                            {options.map((opt) => (
                                <li key={opt.id} className="p-4 hover:bg-gray-50/50">
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <div>
                                            <p className="font-semibold text-gray-900">{opt.name}</p>
                                            <p className="text-xs text-gray-500">{opt.slug}</p>
                                        </div>
                                        <div className="flex gap-1 shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => openOptionModal(opt)}
                                                className="min-w-[44px] min-h-[44px] rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100"
                                                aria-label="Edit option"
                                            >
                                                <Edit3 className="h-4 w-4" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => deleteOption(opt.id)}
                                                className="min-w-[44px] min-h-[44px] rounded-lg border border-red-100 text-red-600 flex items-center justify-center hover:bg-red-50"
                                                aria-label="Delete option"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        {(opt.values || []).map((v) => (
                                            <span
                                                key={v.id}
                                                className="inline-flex items-center gap-1 pl-2 pr-1 py-1 rounded-lg bg-gray-100 border border-gray-200 text-sm"
                                            >
                                                {v.value}
                                                <button
                                                    type="button"
                                                    onClick={() => openValueModal(opt, v)}
                                                    className="p-0.5 rounded hover:bg-gray-200 text-gray-500"
                                                    aria-label="Edit value"
                                                >
                                                    <Edit3 className="h-3 w-3" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => deleteValue(opt.id, v.id)}
                                                    className="p-0.5 rounded hover:bg-red-100 text-red-500"
                                                    aria-label="Delete value"
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </button>
                                            </span>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => openValueModal(opt, null)}
                                            className="inline-flex items-center gap-1 min-h-[32px] px-2 rounded-lg border border-dashed border-gray-300 text-gray-500 text-sm hover:border-blue-400 hover:text-blue-600"
                                        >
                                            <Plus className="h-3.5 w-3.5" /> Add value
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {/* Option modal */}
            {optionModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setOptionModalOpen(false)}>
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-lg font-bold text-gray-900 mb-4">{editingOption ? 'Edit option' : 'New option'}</h2>
                        <form onSubmit={saveOption} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Name (e.g. Size, Color)</label>
                                <input
                                    type="text"
                                    required
                                    value={optionForm.name}
                                    onChange={(e) => setOptionForm((f) => ({ ...f, name: e.target.value }))}
                                    className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Slug (optional)</label>
                                <input
                                    type="text"
                                    value={optionForm.slug}
                                    onChange={(e) => setOptionForm((f) => ({ ...f, slug: e.target.value }))}
                                    placeholder="e.g. size"
                                    className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Sort order</label>
                                <input
                                    type="number"
                                    min={0}
                                    value={optionForm.sort_order}
                                    onChange={(e) => setOptionForm((f) => ({ ...f, sort_order: e.target.value }))}
                                    className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm"
                                />
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button type="submit" disabled={saving} className="min-h-[44px] px-4 rounded-lg bg-blue-600 text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-60">
                                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Save
                                </button>
                                <button type="button" onClick={() => setOptionModalOpen(false)} className="min-h-[44px] px-4 rounded-lg border border-gray-200 text-sm">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Value modal */}
            {valueModalOpen && selectedOption && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setValueModalOpen(false)}>
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-lg font-bold text-gray-900 mb-4">
                            {editingValue ? 'Edit value' : 'Add value'} for {selectedOption.name}
                        </h2>
                        <form onSubmit={saveValue} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Value (e.g. S, M, L or Red, Blue)</label>
                                <input
                                    type="text"
                                    required
                                    value={valueForm.value}
                                    onChange={(e) => setValueForm((f) => ({ ...f, value: e.target.value }))}
                                    className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Sort order</label>
                                <input
                                    type="number"
                                    min={0}
                                    value={valueForm.sort_order}
                                    onChange={(e) => setValueForm((f) => ({ ...f, sort_order: e.target.value }))}
                                    className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm"
                                />
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button type="submit" disabled={saving} className="min-h-[44px] px-4 rounded-lg bg-blue-600 text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-60">
                                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Save
                                </button>
                                <button type="button" onClick={() => setValueModalOpen(false)} className="min-h-[44px] px-4 rounded-lg border border-gray-200 text-sm">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
