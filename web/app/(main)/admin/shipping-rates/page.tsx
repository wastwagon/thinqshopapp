'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminToolbar from '@/components/admin/AdminToolbar';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import FormField from '@/components/ui/FormField';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { Package, Plus, Pencil, Trash2, Plane, Ship, CheckCircle, FileText } from 'lucide-react';
import { ADMIN_STAT_LOGISTICS } from '@/lib/status-styles';

interface ShippingRate {
    id: number;
    rate_id: string;
    method: string;
    name: string;
    price: string;
    type: string;
    duration: string | null;
    currency?: string | null;
    is_active: boolean;
    sort_order: number;
}

function rateSymbol(r: ShippingRate): string {
    return r.currency === 'RMB' || ['air_phone', 'air_laptop'].includes(r.rate_id) ? '¥' : '$';
}

export default function AdminShippingRatesPage() {
    const { confirm, confirmDialog } = useConfirmDialog();
    const [rates, setRates] = useState<ShippingRate[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [modal, setModal] = useState<'add' | 'edit' | null>(null);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        rate_id: '',
        method: 'air_freight',
        name: '',
        price: '',
        type: 'KG',
        duration: '',
        currency: 'USD',
        is_active: true,
        sort_order: 0,
    });

    useEffect(() => {
        fetchRates();
    }, []);

    const fetchRates = async () => {
        try {
            const { data } = await api.get('/logistics/admin/freight-rates');
            setRates(Array.isArray(data) ? data : data?.data ?? []);
        } catch {
            toast.error('Failed to load shipping rates');
        } finally {
            setLoading(false);
        }
    };

    const openAdd = () => {
        setForm({
            rate_id: '',
            method: 'air_freight',
            name: '',
            price: '',
            type: 'KG',
            duration: '',
            currency: 'USD',
            is_active: true,
            sort_order: 0,
        });
        setEditingId(null);
        setModal('add');
    };

    const openEdit = (r: ShippingRate) => {
        setForm({
            rate_id: r.rate_id,
            method: r.method,
            name: r.name,
            price: r.price,
            type: r.type,
            duration: r.duration || '',
            currency: r.currency || 'USD',
            is_active: r.is_active,
            sort_order: r.sort_order,
        });
        setEditingId(r.id);
        setModal('edit');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const price = parseFloat(form.price);
        if (!form.rate_id.trim() || !form.name.trim() || isNaN(price) || price < 0) {
            toast.error('Fill rate ID, name and a valid price');
            return;
        }
        setSaving(true);
        try {
            if (modal === 'add') {
                await api.post('/logistics/admin/freight-rates', {
                    ...form,
                    price,
                    currency: form.currency || 'USD',
                    sort_order: form.sort_order || 0,
                });
                toast.success('Rate added');
            } else if (editingId != null) {
                await api.patch(`/logistics/admin/freight-rates/${editingId}`, {
                    ...form,
                    price,
                    currency: form.currency || 'USD',
                    sort_order: form.sort_order ?? 0,
                });
                toast.success('Rate updated');
            }
            setModal(null);
            fetchRates();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        const ok = await confirm({
            title: 'Delete this rate?',
            description: 'This shipping rate will be removed permanently.',
            confirmLabel: 'Delete',
        });
        if (!ok) return;
        try {
            await api.delete(`/logistics/admin/freight-rates/${id}`);
            toast.success('Rate deleted');
            fetchRates();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to delete');
        }
    };

    const matchesSearch = (r: ShippingRate) => {
        if (!searchTerm.trim()) return true;
        const q = searchTerm.toLowerCase();
        return (
            (r.rate_id ?? '').toLowerCase().includes(q) ||
            (r.name ?? '').toLowerCase().includes(q) ||
            (r.method ?? '').toLowerCase().includes(q)
        );
    };

    const filteredRates = rates.filter(matchesSearch);
    const airRates = filteredRates.filter((r) => r.method === 'air_freight');
    const seaRates = filteredRates.filter((r) => r.method === 'sea_freight');
    const activeCount = rates.filter((r) => r.is_active).length;

    const stats = [
        { label: 'Total', value: rates.length, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
        { label: 'Air freight', value: rates.filter((r) => r.method === 'air_freight').length, icon: Plane, color: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-100' },
        { label: 'Sea freight', value: rates.filter((r) => r.method === 'sea_freight').length, icon: Ship, ...ADMIN_STAT_LOGISTICS },
        { label: 'Active', value: activeCount, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
    ];

    const Table = ({ list, title }: { list: ShippingRate[]; title: string }) => (
        <div className="mb-4">
            <h3 className="text-xs font-bold text-gray-600 mb-2">{title}</h3>
            <div className="admin-table-wrap overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-50">
                            <th className="admin-th">Rate ID</th>
                            <th className="admin-th">Name</th>
                            <th className="admin-th">Rate</th>
                            <th className="admin-th">Type</th>
                            <th className="admin-th">Duration</th>
                            <th className="admin-th">Status</th>
                            <th className="admin-th">Sort</th>
                            <th className="px-3 py-2.5 text-xs font-semibold text-gray-500 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {list.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-3 py-6 text-center text-xs text-gray-500">No rates</td>
                            </tr>
                        ) : (
                            list.map((r) => (
                                <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-3 py-2.5 text-xs font-mono text-gray-900">{r.rate_id}</td>
                                    <td className="px-3 py-2.5 text-xs font-medium text-gray-900">{r.name}</td>
                                    <td className="px-3 py-2.5 text-xs font-semibold text-gray-900">{rateSymbol(r)}{Number(r.price).toFixed(2)}/{r.type}</td>
                                    <td className="px-3 py-2.5 text-xs font-semibold text-gray-600">{r.type}</td>
                                    <td className="px-3 py-2.5 text-xs text-gray-500">{r.duration || '—'}</td>
                                    <td className="px-3 py-2.5">
                                        <Badge variant={r.is_active ? 'success' : 'default'}>
                                            {r.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </td>
                                    <td className="px-3 py-2.5 text-xs text-gray-500">{r.sort_order}</td>
                                    <td className="px-3 py-2.5 text-right">
                                        <button type="button" onClick={() => openEdit(r)} className="p-1.5 text-gray-400 hover:text-brand rounded-lg" aria-label="Edit">
                                            <Pencil className="h-3.5 w-3.5" />
                                        </button>
                                        <button type="button" onClick={() => void handleDelete(r.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg ml-0.5" aria-label="Delete">
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <DashboardLayout isAdmin={true}>
            <div className="pb-6 md:pb-8">
            <AdminPageHeader
                icon={Package}
                title="Shipping rates"
                subtitle="Air & sea freight (Ship for Me). Does not affect shop checkout."
                actions={
                    <AdminToolbar
                        searchValue={searchTerm}
                        onSearchChange={setSearchTerm}
                        searchPlaceholder="Search rates..."
                        searchAriaLabel="Search shipping rates"
                    >
                        <Button type="button" size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={openAdd}>
                            Add rate
                        </Button>
                    </AdminToolbar>
                }
            />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {stats.map((s, i) => (
                    <div key={i} className="admin-stat-card">
                        <div className={`w-9 h-9 rounded-lg ${s.bg} ${s.border} border flex items-center justify-center ${s.color} mb-2`}>
                            <s.icon className="h-4 w-4" />
                        </div>
                        <p className="text-xs font-semibold text-gray-500 mb-0.5">{s.label}</p>
                        <p className="text-xl font-bold text-gray-900">{s.value}</p>
                    </div>
                ))}
            </div>

            {loading ? (
                <div className="py-10 text-center admin-card">
                    <div className="animate-spin h-7 w-7 border-2 border-blue-600 border-t-transparent rounded-full mx-auto" />
                    <p className="text-sm text-gray-500 mt-2">Loading...</p>
                </div>
            ) : (
                <>
                    <Table list={airRates} title="Air freight" />
                    <Table list={seaRates} title="Sea freight" />
                </>
            )}

            <Modal
                open={!!modal}
                onClose={() => setModal(null)}
                title={modal === 'add' ? 'Add rate' : 'Edit rate'}
                size="md"
                footer={
                    <>
                        <Button type="button" variant="secondary" onClick={() => setModal(null)}>
                            Cancel
                        </Button>
                        <Button type="submit" form="shipping-rate-form" variant="primary" loading={saving}>
                            {modal === 'add' ? 'Add' : 'Save'}
                        </Button>
                    </>
                }
            >
                <form id="shipping-rate-form" onSubmit={handleSubmit} className="space-y-3">
                    <FormField label="Rate ID" htmlFor="rate-id">
                        <Input
                            id="rate-id"
                            value={form.rate_id}
                            onChange={(e) => setForm({ ...form, rate_id: e.target.value })}
                            placeholder="e.g. air_express"
                            required
                            disabled={modal === 'edit'}
                        />
                    </FormField>
                    <FormField label="Method" htmlFor="rate-method">
                        <Select
                            id="rate-method"
                            value={form.method}
                            onChange={(e) => setForm({ ...form, method: e.target.value })}
                        >
                            <option value="air_freight">Air freight</option>
                            <option value="sea_freight">Sea freight</option>
                        </Select>
                    </FormField>
                    <FormField label="Name" htmlFor="rate-name">
                        <Input
                            id="rate-name"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            placeholder="e.g. Express (3-5 days)"
                            required
                        />
                    </FormField>
                    <div className="grid grid-cols-2 gap-3">
                        <FormField label="Price" htmlFor="rate-price">
                            <Input
                                id="rate-price"
                                type="number"
                                step="0.01"
                                min={0}
                                value={form.price}
                                onChange={(e) => setForm({ ...form, price: e.target.value })}
                                required
                            />
                        </FormField>
                        <FormField label="Type" htmlFor="rate-type">
                            <Select
                                id="rate-type"
                                value={form.type}
                                onChange={(e) => setForm({ ...form, type: e.target.value })}
                            >
                                <option value="KG">KG</option>
                                <option value="UNIT">UNIT</option>
                                <option value="CBM">CBM</option>
                            </Select>
                        </FormField>
                    </div>
                    <FormField label="Currency" htmlFor="rate-currency">
                        <Select
                            id="rate-currency"
                            value={form.currency}
                            onChange={(e) => setForm({ ...form, currency: e.target.value })}
                        >
                            <option value="USD">USD ($)</option>
                            <option value="RMB">RMB (¥)</option>
                        </Select>
                    </FormField>
                    <FormField label="Duration (optional)" htmlFor="rate-duration">
                        <Input
                            id="rate-duration"
                            value={form.duration}
                            onChange={(e) => setForm({ ...form, duration: e.target.value })}
                            placeholder="e.g. 3-5 days"
                        />
                    </FormField>
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="is_active"
                            checked={form.is_active}
                            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                            className="rounded border-gray-300 text-brand focus:ring-brand/20"
                        />
                        <label htmlFor="is_active" className="text-xs font-medium text-gray-700">
                            Active
                        </label>
                    </div>
                </form>
            </Modal>
            {confirmDialog}
            </div>
        </DashboardLayout>
    );
}
