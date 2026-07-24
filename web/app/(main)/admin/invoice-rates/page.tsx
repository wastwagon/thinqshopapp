'use client';

import React, { useCallback, useEffect, useState } from 'react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
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
                    <Select
                        value={unitFilter}
                        onChange={(e) => setUnitFilter(e.target.value)}
                        aria-label="Filter by unit"
                        className="h-9 min-h-[36px] text-xs w-auto min-w-[9rem]"
                    >
                        <option value="">All units</option>
                        {UNITS.map((u) => (
                            <option key={u} value={u}>{u}</option>
                        ))}
                    </Select>
                    <Select
                        value={modeFilter}
                        onChange={(e) => setModeFilter(e.target.value)}
                        aria-label="Filter by mode"
                        className="h-9 min-h-[36px] text-xs w-auto min-w-[9rem]"
                    >
                        <option value="">All modes</option>
                        <option value="air">Air</option>
                        <option value="sea">Sea</option>
                        <option value="standard">Standard</option>
                    </Select>
                    <Select
                        value={activeFilter}
                        onChange={(e) => setActiveFilter(e.target.value)}
                        aria-label="Filter by active status"
                        className="h-9 min-h-[36px] text-xs w-auto min-w-[9rem]"
                    >
                        <option value="">All</option>
                        <option value="true">Active only</option>
                        <option value="false">Inactive only</option>
                    </Select>
                </div>

                <AdminTable>
                    <AdminTableHead>
                        <AdminTh>Name</AdminTh>
                        <AdminTh>Unit</AdminTh>
                        <AdminTh>Rate per unit</AdminTh>
                        <AdminTh>Mode</AdminTh>
                        <AdminTh>Status</AdminTh>
                        <AdminTh align="right">Actions</AdminTh>
                    </AdminTableHead>
                    <AdminTableBody>
                        {loading ? (
                            <AdminTableLoading colSpan={6} />
                        ) : rates.length === 0 ? (
                            <AdminTableEmpty
                                colSpan={6}
                                icon={<DollarSign className="h-10 w-10 mx-auto mb-2 text-gray-200" />}
                                message="No rates yet"
                            />
                        ) : (
                            rates.map((r) => (
                                <AdminTr key={r.id}>
                                    <AdminTd className="text-xs font-semibold text-gray-900">{r.name}</AdminTd>
                                    <AdminTd className="text-xs text-gray-600">{r.unit}</AdminTd>
                                    <AdminTd className="text-xs font-semibold text-gray-900 tabular-nums">
                                        GHS {Number(r.rate_per_unit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </AdminTd>
                                    <AdminTd className="text-xs text-gray-600">{r.mode || '—'}</AdminTd>
                                    <AdminTd>
                                        <Badge variant={r.is_active ? 'success' : 'default'}>
                                            {r.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </AdminTd>
                                    <AdminTd className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => openEdit(r)}
                                                className="h-8 min-h-[32px] px-2 text-xs"
                                                title="Edit"
                                            >
                                                <Edit3 className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="danger"
                                                size="sm"
                                                onClick={() => void handleDelete(r.id)}
                                                className="h-8 min-h-[32px] px-2 text-xs"
                                                title="Delete"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </AdminTd>
                                </AdminTr>
                            ))
                        )}
                    </AdminTableBody>
                </AdminTable>
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
