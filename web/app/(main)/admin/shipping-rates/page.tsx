'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Package, Plus, Pencil, Trash2, Plane, Ship, CheckCircle, FileText } from 'lucide-react';

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
    const [rates, setRates] = useState<ShippingRate[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [modal, setModal] = useState<'add' | 'edit' | null>(null);
    const [editingId, setEditingId] = useState<number | null>(null);
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
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this rate?')) return;
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
        { label: 'Total', value: rates.length, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
        { label: 'Air freight', value: rates.filter((r) => r.method === 'air_freight').length, icon: Plane, color: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-100' },
        { label: 'Sea freight', value: rates.filter((r) => r.method === 'sea_freight').length, icon: Ship, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
        { label: 'Active', value: activeCount, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
    ];

    const Table = ({ list, title }: { list: ShippingRate[]; title: string }) => (
        <div className="mb-4">
            <h3 className="text-xs font-bold text-gray-600 mb-2">{title}</h3>
            <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-50">
                            <th className="px-3 py-2.5 text-[10px] font-semibold text-gray-500">Rate ID</th>
                            <th className="px-3 py-2.5 text-[10px] font-semibold text-gray-500">Name</th>
                            <th className="px-3 py-2.5 text-[10px] font-semibold text-gray-500">Rate</th>
                            <th className="px-3 py-2.5 text-[10px] font-semibold text-gray-500">Type</th>
                            <th className="px-3 py-2.5 text-[10px] font-semibold text-gray-500">Duration</th>
                            <th className="px-3 py-2.5 text-[10px] font-semibold text-gray-500">Status</th>
                            <th className="px-3 py-2.5 text-[10px] font-semibold text-gray-500">Sort</th>
                            <th className="px-3 py-2.5 text-[10px] font-semibold text-gray-500 text-right">Actions</th>
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
                                    <td className="px-3 py-2.5 text-[10px] font-semibold text-gray-600">{r.type}</td>
                                    <td className="px-3 py-2.5 text-[10px] text-gray-500">{r.duration || '—'}</td>
                                    <td className="px-3 py-2.5">
                                        <span className={`inline-flex px-2 py-0.5 rounded-lg text-[10px] font-semibold ${r.is_active ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-gray-50 text-gray-500 border border-gray-100'}`}>
                                            {r.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2.5 text-xs text-gray-500">{r.sort_order}</td>
                                    <td className="px-3 py-2.5 text-right">
                                        <button type="button" onClick={() => openEdit(r)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg" aria-label="Edit">
                                            <Pencil className="h-3.5 w-3.5" />
                                        </button>
                                        <button type="button" onClick={() => handleDelete(r.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg ml-0.5" aria-label="Delete">
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
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                    <Package className="h-7 w-7 text-blue-600" />
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Shipping rates</h1>
                        <p className="text-xs text-gray-500 mt-0.5">Air & sea freight (Ship for Me). Does not affect shop checkout.</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Search rates..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="h-9 px-3 border border-gray-100 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-40 sm:w-48"
                    />
                    <button
                        type="button"
                        onClick={openAdd}
                        className="h-9 px-4 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-gray-900 flex items-center gap-1.5 shrink-0"
                    >
                        <Plus className="h-3.5 w-3.5" /> Add rate
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {stats.map((s, i) => (
                    <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                        <div className={`w-9 h-9 rounded-lg ${s.bg} ${s.border} border flex items-center justify-center ${s.color} mb-2`}>
                            <s.icon className="h-4 w-4" />
                        </div>
                        <p className="text-[10px] font-semibold text-gray-500 mb-0.5">{s.label}</p>
                        <p className="text-xl font-bold text-gray-900">{s.value}</p>
                    </div>
                ))}
            </div>

            {loading ? (
                <div className="py-10 text-center bg-white rounded-xl border border-gray-100">
                    <div className="animate-spin h-7 w-7 border-2 border-blue-600 border-t-transparent rounded-full mx-auto" />
                    <p className="text-sm text-gray-500 mt-2">Loading...</p>
                </div>
            ) : (
                <>
                    <Table list={airRates} title="Air freight" />
                    <Table list={seaRates} title="Sea freight" />
                </>
            )}

            {modal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setModal(null)}>
                    <div className="bg-white rounded-xl shadow-xl border border-gray-100 w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-base font-bold text-gray-900 mb-4">{modal === 'add' ? 'Add rate' : 'Edit rate'}</h3>
                        <form onSubmit={handleSubmit} className="space-y-3">
                            <div>
                                <label className="block text-[10px] font-semibold text-gray-500 mb-1">Rate ID</label>
                                <input
                                    type="text"
                                    value={form.rate_id}
                                    onChange={(e) => setForm({ ...form, rate_id: e.target.value })}
                                    placeholder="e.g. air_express"
                                    className="w-full h-9 px-3 border border-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    required
                                    disabled={modal === 'edit'}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-semibold text-gray-500 mb-1">Method</label>
                                <select
                                    value={form.method}
                                    onChange={(e) => setForm({ ...form, method: e.target.value })}
                                    className="w-full h-9 px-3 border border-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                >
                                    <option value="air_freight">Air freight</option>
                                    <option value="sea_freight">Sea freight</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-semibold text-gray-500 mb-1">Name</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    placeholder="e.g. Express (3-5 days)"
                                    className="w-full h-9 px-3 border border-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] font-semibold text-gray-500 mb-1">Price</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={form.price}
                                        onChange={(e) => setForm({ ...form, price: e.target.value })}
                                        className="w-full h-9 px-3 border border-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-semibold text-gray-500 mb-1">Type</label>
                                    <select
                                        value={form.type}
                                        onChange={(e) => setForm({ ...form, type: e.target.value })}
                                        className="w-full h-9 px-3 border border-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    >
                                        <option value="KG">KG</option>
                                        <option value="UNIT">UNIT</option>
                                        <option value="CBM">CBM</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-semibold text-gray-500 mb-1">Currency</label>
                                <select
                                    value={form.currency}
                                    onChange={(e) => setForm({ ...form, currency: e.target.value })}
                                    className="w-full h-9 px-3 border border-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                >
                                    <option value="USD">USD ($)</option>
                                    <option value="RMB">RMB (¥)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-semibold text-gray-500 mb-1">Duration (optional)</label>
                                <input
                                    type="text"
                                    value={form.duration}
                                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                                    placeholder="e.g. 3-5 days"
                                    className="w-full h-9 px-3 border border-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={form.is_active}
                                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="is_active" className="text-xs font-medium text-gray-700">Active</label>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setModal(null)} className="h-9 px-4 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-semibold">
                                    Cancel
                                </button>
                                <button type="submit" className="h-9 px-4 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-gray-900">
                                    {modal === 'add' ? 'Add' : 'Save'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            </div>
        </DashboardLayout>
    );
}
