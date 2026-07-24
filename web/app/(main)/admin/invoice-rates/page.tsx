'use client';

import React, { useCallback, useEffect, useState } from 'react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import FormField from '@/components/ui/FormField';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import Link from 'next/link';
import { DollarSign, Plus, Edit3, Trash2, Calculator, Info } from 'lucide-react';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';

const UNITS = ['kg', 'CBM', 'pcs', 'hour', 'box', 'set'];
const MODES = ['', 'sea', 'air', 'standard'];

export default function AdminInvoiceRatesPage() {
    const { confirm, confirmDialog } = useConfirmDialog();
    const [rates, setRates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [unitFilter, setUnitFilter] = useState<string>('');
    const [modeFilter, setModeFilter] = useState<string>('');
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
    }, [unitFilter, modeFilter, activeFilter]);

    const fetchRates = async () => {
        try {
            setLoading(true);
            const params: { unit?: string; mode?: string; is_active?: string } = {};
            if (unitFilter) params.unit = unitFilter;
            if (modeFilter) params.mode = modeFilter;
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

    const closeModal = useCallback(() => {
        setModalOpen(false);
        setEditingId(null);
    }, []);

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
        const ok = await confirm({ title: 'Delete this rate?', confirmLabel: 'Delete' });
        if (!ok) return;
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
                <AdminPageHeader
                icon={DollarSign}
                title="Invoice rates"
                subtitle="Pricing per unit for invoice line items"
                actions={
                    <Button type="button" size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
                        Add rate
                    </Button>
                }
            />

                <div className="mb-5 p-4 rounded-2xl bg-gradient-to-br from-brand/5 to-gray-50/80 border border-blue-200 flex gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 text-blue-600 shrink-0">
                        <Info className="h-5 w-5" />
                    </div>
                    <div className="text-sm text-gray-700 min-w-0">
                        <p className="font-semibold text-gray-900 mb-1">Shipping Calculator</p>
                        <p className="mb-2">
                            Invoice rates here drive the{' '}
                            <Link href="/admin/invoices/new" className="text-blue-600 hover:text-blue-700 hover:underline font-medium inline-flex items-center gap-1">
                                <Calculator className="h-3.5 w-3.5" /> Shipping Calculator
                            </Link>
                            . Freight catalog rates from{' '}
                            <Link href="/admin/shipping-rates" className="text-blue-600 hover:text-blue-700 hover:underline font-medium">
                                Shipping Rates
                            </Link>{' '}
                            are merged in the calculator as well.
                        </p>
                        <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
                            <li><strong className="text-gray-800">Air:</strong> mode = air, unit = kg → weight × rate × quantity. Est. 3–10 days.</li>
                            <li><strong className="text-gray-800">Sea:</strong> mode = sea, unit = CBM → volume (L×W×H in cm/m/mm) × rate × quantity. Est. 35–40 days.</li>
                        </ul>
                    </div>
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
                        value={modeFilter}
                        onChange={(e) => setModeFilter(e.target.value)}
                        className="h-9 pl-3 pr-8 border border-gray-100 rounded-lg text-sm font-medium text-gray-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none bg-white"
                    >
                        <option value="">All modes</option>
                        <option value="air">Air</option>
                        <option value="sea">Sea</option>
                        <option value="standard">Standard</option>
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

                <div className="admin-table-wrap">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/80 border-b border-gray-100">
                                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Unit</th>
                                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Rate per unit</th>
                                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Mode</th>
                                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
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
                                        <tr key={r.id} className="hover:bg-gray-50/60 transition-colors">
                                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{r.name}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{r.unit}</td>
                                            <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                                                GHS {Number(r.rate_per_unit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{r.mode || '—'}</td>
                                            <td className="px-4 py-3">
                                                <Badge variant={r.is_active ? 'success' : 'default'}>
                                                    {r.is_active ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-right">
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
                                                    onClick={() => void handleDelete(r.id)}
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

            <Modal
                open={modalOpen}
                onClose={closeModal}
                title={editingId ? 'Edit rate' : 'Add rate'}
                size="md"
                footer={
                    <>
                        <Button type="button" variant="secondary" onClick={closeModal}>
                            Cancel
                        </Button>
                        <Button type="submit" form="invoice-rate-form" variant="primary" loading={submitting}>
                            {submitting ? 'Saving...' : editingId ? 'Update' : 'Create'}
                        </Button>
                    </>
                }
            >
                <form id="invoice-rate-form" onSubmit={handleSubmit} className="space-y-4">
                    <FormField label="Name" htmlFor="inv-rate-name" required>
                        <Input
                            id="inv-rate-name"
                            value={form.name}
                            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                            placeholder="e.g. Regular Goods, Sea – per CBM"
                            required
                        />
                    </FormField>
                    <FormField label="Unit" htmlFor="inv-rate-unit" required>
                        <Select
                            id="inv-rate-unit"
                            value={form.unit}
                            onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                        >
                            {UNITS.map((u) => (
                                <option key={u} value={u}>
                                    {u}
                                </option>
                            ))}
                        </Select>
                    </FormField>
                    <FormField label="Rate per unit (GHS)" htmlFor="inv-rate-amount" required>
                        <Input
                            id="inv-rate-amount"
                            type="number"
                            min={0}
                            step={0.01}
                            value={form.rate_per_unit}
                            onChange={(e) => setForm((f) => ({ ...f, rate_per_unit: e.target.value }))}
                            placeholder="0.00"
                            required
                        />
                    </FormField>
                    <FormField label="Mode (optional)" htmlFor="inv-rate-mode">
                        <Select
                            id="inv-rate-mode"
                            value={form.mode}
                            onChange={(e) => setForm((f) => ({ ...f, mode: e.target.value }))}
                        >
                            {MODES.map((m) => (
                                <option key={m || '_'} value={m}>
                                    {m || '—'}
                                </option>
                            ))}
                        </Select>
                    </FormField>
                    <FormField label="Sort order" htmlFor="inv-rate-sort">
                        <Input
                            id="inv-rate-sort"
                            type="number"
                            min={0}
                            value={form.sort_order}
                            onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))}
                        />
                    </FormField>
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="is_active"
                            checked={form.is_active}
                            onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                            className="rounded border-gray-300 text-brand focus:ring-brand/20"
                        />
                        <label htmlFor="is_active" className="text-sm text-gray-700">
                            Active
                        </label>
                    </div>
                </form>
            </Modal>
            {confirmDialog}
        </DashboardLayout>
    );
}
