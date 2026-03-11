'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { DollarSign, Plus, Edit3, Trash2 } from 'lucide-react';

const UNITS = ['kg', 'CBM', 'pcs', 'hour', 'box', 'set'];
const MODES = ['', 'sea', 'air', 'standard'];

export default function AdminInvoiceRatesPage() {
    const [rates, setRates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [unitFilter, setUnitFilter] = useState<string>('');
    const [activeFilter, setActiveFilter] = useState<string>('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        name: '',
        unit: 'kg',
        rate_per_unit: '',
        mode: '',
        sort_order: '0',
        is_active: true,
    });

    useEffect(() => {
        fetchRates();
    }, [unitFilter, activeFilter]);

    const fetchRates = async () => {
        try {
            setLoading(true);
            const params: { unit?: string; is_active?: string } = {};
            if (unitFilter) params.unit = unitFilter;
            if (activeFilter !== '') params.is_active = activeFilter;
            const { data } = await api.get('/invoice-rates', { params });
            setRates(Array.isArray(data) ? data : []);
        } catch {
            toast.error('Failed to load rates');
        } finally {
            setLoading(false);
        }
    };

    const openCreate = () => {
        setEditingId(null);
        setForm({ name: '', unit: 'kg', rate_per_unit: '', mode: '', sort_order: '0', is_active: true });
        setModalOpen(true);
    };

    const openEdit = (rate: any) => {
        setEditingId(rate.id);
        setForm({
            name: rate.name ?? '',
            unit: rate.unit ?? 'kg',
            rate_per_unit: String(Number(rate.rate_per_unit) ?? ''),
            mode: rate.mode ?? '',
            sort_order: String(Number(rate.sort_order) ?? 0),
            is_active: rate.is_active !== false,
        });
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditingId(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const ratePerUnit = Number(form.rate_per_unit);
        if (!form.name.trim()) {
            toast.error('Name is required');
            return;
        }
        if (isNaN(ratePerUnit) || ratePerUnit < 0) {
            toast.error('Valid rate per unit is required');
            return;
        }
        setSubmitting(true);
        try {
            const payload = {
                name: form.name.trim(),
                unit: form.unit,
                rate_per_unit: ratePerUnit,
                mode: form.mode || undefined,
                sort_order: Number(form.sort_order) || 0,
                is_active: form.is_active,
            };
            if (editingId) {
                await api.patch(`/invoice-rates/${editingId}`, payload);
                toast.success('Rate updated');
            } else {
                await api.post('/invoice-rates', payload);
                toast.success('Rate created');
            }
            closeModal();
            fetchRates();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to save rate');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this rate?')) return;
        try {
            await api.delete(`/invoice-rates/${id}`);
            toast.success('Rate deleted');
            fetchRates();
        } catch {
            toast.error('Failed to delete rate');
        }
    };

    return (
        <DashboardLayout isAdmin={true}>
            <div className="pb-6 md:pb-8">
                <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <DollarSign className="h-7 w-7 text-blue-600" />
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Invoice rates</h1>
                            <p className="text-xs text-gray-500 mt-0.5">Pricing per unit for invoice line items</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={openCreate}
                        className="min-h-[44px] h-9 px-4 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-gray-900 transition-all flex items-center justify-center gap-1.5 shrink-0"
                    >
                        <Plus className="h-4 w-4" /> Add rate
                    </button>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                    <select
                        value={unitFilter}
                        onChange={(e) => setUnitFilter(e.target.value)}
                        className="h-9 pl-3 pr-8 border border-gray-100 rounded-lg text-sm font-medium text-gray-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none bg-white"
                    >
                        <option value="">All units</option>
                        {UNITS.map((u) => (
                            <option key={u} value={u}>{u}</option>
                        ))}
                    </select>
                    <select
                        value={activeFilter}
                        onChange={(e) => setActiveFilter(e.target.value)}
                        className="h-9 pl-3 pr-8 border border-gray-100 rounded-lg text-sm font-medium text-gray-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none bg-white"
                    >
                        <option value="">All</option>
                        <option value="true">Active only</option>
                        <option value="false">Inactive only</option>
                    </select>
                </div>

                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-50">
                                    <th className="px-3 py-2.5 text-xs font-semibold text-gray-500">Name</th>
                                    <th className="px-3 py-2.5 text-xs font-semibold text-gray-500">Unit</th>
                                    <th className="px-3 py-2.5 text-xs font-semibold text-gray-500">Rate per unit</th>
                                    <th className="px-3 py-2.5 text-xs font-semibold text-gray-500">Mode</th>
                                    <th className="px-3 py-2.5 text-xs font-semibold text-gray-500">Status</th>
                                    <th className="px-3 py-2.5 text-xs font-semibold text-gray-500 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="py-10 text-center text-gray-500 text-sm">Loading...</td>
                                    </tr>
                                ) : rates.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-10 text-center text-gray-500">
                                            <DollarSign className="h-10 w-10 mx-auto mb-2 text-gray-200" />
                                            <p className="text-sm">No rates yet</p>
                                            <button type="button" onClick={openCreate} className="text-blue-600 text-sm font-medium mt-2 inline-block">Add a rate</button>
                                        </td>
                                    </tr>
                                ) : (
                                    rates.map((r) => (
                                        <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-3 py-2.5 text-sm font-medium text-gray-900">{r.name}</td>
                                            <td className="px-3 py-2.5 text-sm text-gray-600">{r.unit}</td>
                                            <td className="px-3 py-2.5 text-sm font-semibold text-gray-900">
                                                GHS {Number(r.rate_per_unit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-3 py-2.5 text-sm text-gray-600">{r.mode || '—'}</td>
                                            <td className="px-3 py-2.5">
                                                <span className={`px-2 py-0.5 text-xs font-semibold rounded-lg border ${r.is_active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                                    {r.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2.5 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => openEdit(r)}
                                                    className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-gray-100 text-gray-400 hover:text-blue-600 hover:border-blue-600 transition-all mr-1"
                                                    title="Edit"
                                                >
                                                    <Edit3 className="h-4 w-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(r.id)}
                                                    className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-gray-100 text-gray-400 hover:text-red-600 hover:border-red-600 transition-all"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={closeModal}>
                    <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-lg font-bold text-gray-900 mb-4">{editingId ? 'Edit rate' : 'Add rate'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Name *</label>
                                <input
                                    value={form.name}
                                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                                    placeholder="e.g. Regular Goods, Sea – per CBM"
                                    className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Unit *</label>
                                <select
                                    value={form.unit}
                                    onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                                    className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                >
                                    {UNITS.map((u) => (
                                        <option key={u} value={u}>{u}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Rate per unit (GHS) *</label>
                                <input
                                    type="number"
                                    min={0}
                                    step={0.01}
                                    value={form.rate_per_unit}
                                    onChange={(e) => setForm((f) => ({ ...f, rate_per_unit: e.target.value }))}
                                    placeholder="0.00"
                                    className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Mode (optional)</label>
                                <select
                                    value={form.mode}
                                    onChange={(e) => setForm((f) => ({ ...f, mode: e.target.value }))}
                                    className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                >
                                    {MODES.map((m) => (
                                        <option key={m || '_'} value={m}>{m || '—'}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Sort order</label>
                                <input
                                    type="number"
                                    min={0}
                                    value={form.sort_order}
                                    onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))}
                                    className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={form.is_active}
                                    onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="is_active" className="text-sm text-gray-700">Active</label>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="min-h-[44px] px-6 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-gray-900 disabled:opacity-50"
                                >
                                    {submitting ? 'Saving...' : editingId ? 'Update' : 'Create'}
                                </button>
                                <button type="button" onClick={closeModal} className="min-h-[44px] px-6 border border-gray-200 rounded-lg font-semibold text-sm text-gray-700 hover:bg-gray-50">
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
