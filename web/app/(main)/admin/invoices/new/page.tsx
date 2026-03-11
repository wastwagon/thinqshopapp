'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FileText, Plus, Trash2, ArrowLeft } from 'lucide-react';

const UNITS = ['pcs', 'kg', 'CBM', 'hour', 'box', 'set'];

export default function NewInvoicePage() {
    const router = useRouter();
    const today = new Date().toISOString().slice(0, 10);
    const [rates, setRates] = useState<any[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        customer_name: '',
        customer_email: '',
        customer_phone: '',
        customer_address: '',
        issue_date: today,
        due_date: today,
        currency: 'GHS',
        notes: '',
        discount_amount: '',
        discount_percent: '',
        tax_rate: '',
        items: [
            { description: '', quantity: 1, unit: 'pcs', unit_price: '' },
        ] as { description: string; quantity: number; unit: string; unit_price: string }[],
    });

    useEffect(() => {
        api.get('/invoice-rates', { params: { is_active: 'true' } })
            .then(({ data }) => setRates(Array.isArray(data) ? data : []))
            .catch(() => {});
    }, []);

    const addLine = () => {
        setForm((f) => ({ ...f, items: [...f.items, { description: '', quantity: 1, unit: 'pcs', unit_price: '' }] }));
    };

    const applyRateToLine = (index: number, rateId: string) => {
        const rate = rates.find((r) => r.id === Number(rateId));
        if (!rate) return;
        setForm((f) => ({
            ...f,
            items: f.items.map((item, i) =>
                i === index
                    ? { ...item, description: rate.name, unit: rate.unit, unit_price: String(Number(rate.rate_per_unit)) }
                    : item
            ),
        }));
    };

    const removeLine = (index: number) => {
        if (form.items.length <= 1) return;
        setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== index) }));
    };

    const updateLine = (index: number, field: string, value: string | number) => {
        setForm((f) => ({
            ...f,
            items: f.items.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
        }));
    };

    const subtotal = form.items.reduce((sum, i) => {
        const q = Number(i.quantity) || 0;
        const p = Number(i.unit_price) || 0;
        return sum + q * p;
    }, 0);
    const discountAmt = Number(form.discount_amount) || 0;
    const discountPct = Number(form.discount_percent) || 0;
    const discountTotal = discountAmt + (subtotal * discountPct) / 100;
    const afterDiscount = subtotal - discountTotal;
    const taxRate = Number(form.tax_rate) || 0;
    const taxAmount = (afterDiscount * taxRate) / 100;
    const total = afterDiscount + taxAmount;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.customer_name.trim() || !form.customer_email.trim()) {
            toast.error('Customer name and email are required');
            return;
        }
        const validItems = form.items.filter((i) => i.description.trim() && (Number(i.unit_price) || 0) >= 0 && (Number(i.quantity) || 0) > 0);
        if (validItems.length === 0) {
            toast.error('Add at least one line item with description, quantity and unit price');
            return;
        }
        setSubmitting(true);
        try {
            const payload = {
                customer_name: form.customer_name.trim(),
                customer_email: form.customer_email.trim(),
                customer_phone: form.customer_phone.trim() || undefined,
                customer_address: form.customer_address.trim() || undefined,
                issue_date: form.issue_date,
                due_date: form.due_date,
                currency: form.currency,
                notes: form.notes.trim() || undefined,
                discount_amount: discountAmt,
                discount_percent: form.discount_percent ? discountPct : undefined,
                tax_rate: form.tax_rate ? taxRate : undefined,
                items: validItems.map((i) => ({
                    description: i.description.trim(),
                    quantity: Number(i.quantity) || 0,
                    unit: i.unit,
                    unit_price: Number(i.unit_price) || 0,
                })),
            };
            const { data } = await api.post('/invoices', payload);
            toast.success('Invoice created');
            router.push(`/admin/invoices/${data.id}`);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to create invoice');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <DashboardLayout isAdmin={true}>
            <div className="pb-6 md:pb-8 max-w-4xl mx-auto">
                <div className="mb-6 flex items-center gap-3">
                    <Link
                        href="/admin/invoices"
                        className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                    <div className="flex items-center gap-2">
                        <FileText className="h-6 w-6 text-blue-600" />
                        <h1 className="text-xl font-bold text-gray-900">New invoice</h1>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
                        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Customer</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Name *</label>
                                <input
                                    value={form.customer_name}
                                    onChange={(e) => setForm((f) => ({ ...f, customer_name: e.target.value }))}
                                    className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Email *</label>
                                <input
                                    type="email"
                                    value={form.customer_email}
                                    onChange={(e) => setForm((f) => ({ ...f, customer_email: e.target.value }))}
                                    className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Phone</label>
                                <input
                                    value={form.customer_phone}
                                    onChange={(e) => setForm((f) => ({ ...f, customer_phone: e.target.value }))}
                                    className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Address</label>
                                <input
                                    value={form.customer_address}
                                    onChange={(e) => setForm((f) => ({ ...f, customer_address: e.target.value }))}
                                    className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Issue date</label>
                                <input
                                    type="date"
                                    value={form.issue_date}
                                    onChange={(e) => setForm((f) => ({ ...f, issue_date: e.target.value }))}
                                    className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Due date</label>
                                <input
                                    type="date"
                                    value={form.due_date}
                                    onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
                                    className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Line items</h2>
                            <button type="button" onClick={addLine} className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
                                <Plus className="h-4 w-4" /> Add line
                            </button>
                        </div>
                        <div className="space-y-3">
                            {form.items.map((item, idx) => (
                                <div key={idx} className="flex flex-wrap items-start gap-2 p-3 rounded-lg bg-gray-50 border border-gray-100">
                                    {rates.length > 0 && (
                                        <select
                                            className="w-full sm:w-44 h-9 px-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                                            value=""
                                            onChange={(e) => { const v = e.target.value; if (v) applyRateToLine(idx, v); e.target.value = ''; }}
                                            title="Use saved rate"
                                        >
                                            <option value="">Use rate…</option>
                                            {rates.map((r) => (
                                                <option key={r.id} value={r.id}>{r.name} — {r.unit} @ GHS {Number(r.rate_per_unit).toFixed(2)}</option>
                                            ))}
                                        </select>
                                    )}
                                    <input
                                        placeholder="Description"
                                        value={item.description}
                                        onChange={(e) => updateLine(idx, 'description', e.target.value)}
                                        className="flex-1 min-w-[120px] h-9 px-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    />
                                    <input
                                        type="number"
                                        min={0}
                                        step={1}
                                        placeholder="Qty"
                                        value={item.quantity}
                                        onChange={(e) => updateLine(idx, 'quantity', e.target.value)}
                                        className="w-20 h-9 px-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    />
                                    <select
                                        value={item.unit}
                                        onChange={(e) => updateLine(idx, 'unit', e.target.value)}
                                        className="w-24 h-9 px-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    >
                                        {UNITS.map((u) => (
                                            <option key={u} value={u}>{u}</option>
                                        ))}
                                    </select>
                                    <input
                                        type="number"
                                        min={0}
                                        step={0.01}
                                        placeholder="Unit price"
                                        value={item.unit_price}
                                        onChange={(e) => updateLine(idx, 'unit_price', e.target.value)}
                                        className="w-28 h-9 px-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    />
                                    <span className="text-sm font-medium text-gray-600 self-center">
                                        = {((Number(item.quantity) || 0) * (Number(item.unit_price) || 0)).toFixed(2)}
                                    </span>
                                    <button type="button" onClick={() => removeLine(idx)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg" aria-label="Remove line">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Discount amount</label>
                                <input
                                    type="number"
                                    min={0}
                                    step={0.01}
                                    value={form.discount_amount}
                                    onChange={(e) => setForm((f) => ({ ...f, discount_amount: e.target.value }))}
                                    className="w-full h-9 px-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Discount %</label>
                                <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    step={0.5}
                                    value={form.discount_percent}
                                    onChange={(e) => setForm((f) => ({ ...f, discount_percent: e.target.value }))}
                                    className="w-full h-9 px-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Tax %</label>
                                <input
                                    type="number"
                                    min={0}
                                    step={0.5}
                                    value={form.tax_rate}
                                    onChange={(e) => setForm((f) => ({ ...f, tax_rate: e.target.value }))}
                                    className="w-full h-9 px-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                            </div>
                        </div>
                        <div className="rounded-xl bg-amber-50/80 border border-amber-100 p-4 space-y-1">
                            <p className="text-sm text-gray-700"><span className="font-semibold">Subtotal:</span> {form.currency} {subtotal.toFixed(2)}</p>
                            {discountTotal > 0 && <p className="text-sm text-gray-700"><span className="font-semibold">Discount:</span> -{form.currency} {discountTotal.toFixed(2)}</p>}
                            {taxAmount > 0 && <p className="text-sm text-gray-700"><span className="font-semibold">Tax:</span> +{form.currency} {taxAmount.toFixed(2)}</p>}
                            <p className="text-base font-bold text-gray-900 pt-1">Total: {form.currency} {total.toFixed(2)}</p>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Notes</label>
                            <textarea
                                value={form.notes}
                                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-y"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="min-h-[44px] px-6 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-gray-900 disabled:opacity-50 transition-all"
                        >
                            {submitting ? 'Saving...' : 'Save as draft'}
                        </button>
                        <Link href="/admin/invoices" className="min-h-[44px] px-6 border border-gray-200 rounded-lg font-semibold text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-center">
                            Cancel
                        </Link>
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
}
