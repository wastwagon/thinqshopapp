'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { FileText, ArrowLeft, Edit3, Trash2, Download, MessageSquare } from 'lucide-react';

const UNITS = ['pcs', 'kg', 'CBM', 'hour', 'box', 'set'];
const STATUSES = ['draft', 'sent', 'paid', 'overdue'];
const formatCmsLabel = (value?: string | null): string =>
    (value || '')
        .replace(/_/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/\b\w/g, (c) => c.toUpperCase()) || '—';

export default function InvoiceDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = Number(params.id);
    const [invoice, setInvoice] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState<any>(null);
    const [downloadingPdf, setDownloadingPdf] = useState(false);
    const [sendingSms, setSendingSms] = useState(false);
    const [rates, setRates] = useState<any[]>([]);

    useEffect(() => {
        if (id) fetchInvoice();
    }, [id]);

    useEffect(() => {
        api.get('/invoice-rates', { params: { is_active: 'true' } })
            .then(({ data }) => setRates(Array.isArray(data) ? data : []))
            .catch(() => {});
    }, []);

    const fetchInvoice = async () => {
        try {
            setLoading(true);
            const { data } = await api.get(`/invoices/${id}`);
            setInvoice(data);
            setForm(data ? {
                customer_name: data.customer_name,
                customer_email: data.customer_email,
                customer_phone: data.customer_phone ?? '',
                customer_address: data.customer_address ?? '',
                issue_date: data.issue_date ? new Date(data.issue_date).toISOString().slice(0, 10) : '',
                due_date: data.due_date ? new Date(data.due_date).toISOString().slice(0, 10) : '',
                notes: data.notes ?? '',
                discount_amount: String(Number(data.discount_amount) || 0),
                discount_percent: data.discount_percent != null ? String(data.discount_percent) : '',
                tax_rate: data.tax_rate != null ? String(data.tax_rate) : '',
                items: (data.items || []).map((i: any) => ({
                    description: i.description,
                    quantity: Number(i.quantity) || 0,
                    unit: i.unit,
                    unit_price: String(Number(i.unit_price) || 0),
                })),
            } : null);
        } catch {
            toast.error('Invoice not found');
            router.push('/admin/invoices');
        } finally {
            setLoading(false);
        }
    };

    const updateLine = (index: number, field: string, value: string | number) => {
        setForm((f: any) => ({
            ...f,
            items: f.items.map((item: any, i: number) => (i === index ? { ...item, [field]: value } : item)),
        }));
    };

    const addLine = () => {
        setForm((f: any) => ({ ...f, items: [...f.items, { description: '', quantity: 1, unit: 'pcs', unit_price: '' }] }));
    };

    const removeLine = (index: number) => {
        if (form.items.length <= 1) return;
        setForm((f: any) => ({ ...f, items: f.items.filter((_: any, i: number) => i !== index) }));
    };

    const applyRateToLine = (index: number, rateId: string) => {
        const rate = rates.find((r) => r.id === Number(rateId));
        if (!rate || !form) return;
        setForm((f: any) => ({
            ...f,
            items: f.items.map((item: any, i: number) =>
                i === index
                    ? { ...item, description: rate.name, unit: rate.unit, unit_price: String(Number(rate.rate_per_unit)) }
                    : item
            ),
        }));
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form) return;
        const validItems = form.items.filter((i: any) => i.description?.trim() && (Number(i.unit_price) || 0) >= 0 && (Number(i.quantity) || 0) > 0);
        if (validItems.length === 0) {
            toast.error('At least one line item required');
            return;
        }
        setSubmitting(true);
        try {
            await api.patch(`/invoices/${id}`, {
                customer_name: form.customer_name,
                customer_email: form.customer_email,
                customer_phone: form.customer_phone || undefined,
                customer_address: form.customer_address || undefined,
                issue_date: form.issue_date,
                due_date: form.due_date,
                notes: form.notes || undefined,
                discount_amount: Number(form.discount_amount) || 0,
                discount_percent: form.discount_percent ? Number(form.discount_percent) : undefined,
                tax_rate: form.tax_rate ? Number(form.tax_rate) : undefined,
                items: validItems.map((i: any) => ({
                    description: i.description.trim(),
                    quantity: Number(i.quantity) || 0,
                    unit: i.unit,
                    unit_price: Number(i.unit_price) || 0,
                })),
            });
            toast.success('Invoice updated');
            setEditing(false);
            fetchInvoice();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Update failed');
        } finally {
            setSubmitting(false);
        }
    };

    const handleStatusChange = async (status: string) => {
        try {
            await api.patch(`/invoices/${id}/status`, { status });
            toast.success('Status updated');
            fetchInvoice();
        } catch {
            toast.error('Failed to update status');
        }
    };

    const handleDownloadPdf = async () => {
        setDownloadingPdf(true);
        try {
            const { data } = await api.get(`/invoices/${id}/pdf`, { responseType: 'blob' });
            const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
            const a = document.createElement('a');
            a.href = url;
            a.download = `invoice-${invoice?.invoice_number ?? id}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast.success('PDF downloaded');
        } catch {
            toast.error('Failed to download PDF');
        } finally {
            setDownloadingPdf(false);
        }
    };

    const handleSendSms = async () => {
        setSendingSms(true);
        try {
            const { data } = await api.post(`/invoices/${id}/send-sms`);
            if (data?.sent) {
                toast.success('SMS summary sent to customer');
            } else {
                toast.error(data?.message || 'SMS could not be sent');
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to send SMS');
        } finally {
            setSendingSms(false);
        }
    };

    if (loading || !invoice) {
        return (
            <DashboardLayout isAdmin={true}>
                <div className="flex items-center justify-center min-h-[40vh]"><div className="text-gray-500">Loading...</div></div>
            </DashboardLayout>
        );
    }

    const isDraft = invoice.status === 'draft';

    return (
        <DashboardLayout isAdmin={true}>
            <div className="pb-6 md:pb-8 max-w-4xl mx-auto">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <Link href="/admin/invoices" className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">{invoice.invoice_number}</h1>
                            <p className="text-sm text-gray-500">{invoice.customer_name} · {invoice.currency} {Number(invoice.total).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-lg text-xs font-semibold border ${invoice.status === 'draft' ? 'bg-gray-100 text-gray-700 border-gray-200' : invoice.status === 'paid' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                            {formatCmsLabel(invoice.status)}
                        </span>
                        {isDraft && !editing && (
                            <button type="button" onClick={() => setEditing(true)} className="min-h-[44px] px-4 rounded-lg border border-gray-200 text-gray-700 font-medium text-sm hover:bg-gray-50 flex items-center gap-1.5">
                                <Edit3 className="h-4 w-4" /> Edit
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={handleDownloadPdf}
                            disabled={downloadingPdf}
                            className="min-h-[44px] px-4 rounded-lg border border-gray-200 text-gray-700 font-medium text-sm hover:bg-gray-50 flex items-center gap-1.5 disabled:opacity-50"
                        >
                            <Download className="h-4 w-4" /> {downloadingPdf ? 'Preparing…' : 'Download PDF'}
                        </button>
                        <button
                            type="button"
                            onClick={handleSendSms}
                            disabled={sendingSms || !invoice?.customer_phone}
                            title={invoice?.customer_phone ? 'Send invoice summary via SMS' : 'Add customer phone to send SMS'}
                            className="min-h-[44px] px-4 rounded-lg border border-gray-200 text-gray-700 font-medium text-sm hover:bg-gray-50 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <MessageSquare className="h-4 w-4" /> {sendingSms ? 'Sending…' : 'Send SMS summary'}
                        </button>
                        <select
                            value={invoice.status}
                            onChange={(e) => handleStatusChange(e.target.value)}
                            className="h-9 px-3 border border-gray-200 rounded-lg text-sm font-medium bg-white"
                        >
                            {STATUSES.map((s) => (
                                <option key={s} value={s}>{formatCmsLabel(s)}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {editing && form ? (
                    <form onSubmit={handleUpdate} className="space-y-6">
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Customer name</label>
                                    <input value={form.customer_name} onChange={(e) => setForm((f: any) => ({ ...f, customer_name: e.target.value }))} className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm" required />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Customer email</label>
                                    <input type="email" value={form.customer_email} onChange={(e) => setForm((f: any) => ({ ...f, customer_email: e.target.value }))} className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm" required />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Phone</label>
                                    <input value={form.customer_phone} onChange={(e) => setForm((f: any) => ({ ...f, customer_phone: e.target.value }))} className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm" />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Address</label>
                                    <input value={form.customer_address} onChange={(e) => setForm((f: any) => ({ ...f, customer_address: e.target.value }))} className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Issue date</label>
                                    <input type="date" value={form.issue_date} onChange={(e) => setForm((f: any) => ({ ...f, issue_date: e.target.value }))} className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Due date</label>
                                    <input type="date" value={form.due_date} onChange={(e) => setForm((f: any) => ({ ...f, due_date: e.target.value }))} className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm" />
                                </div>
                            </div>
                            <div className="flex justify-between items-center">
                                <h3 className="text-sm font-bold text-gray-700">Invoice items</h3>
                                <button type="button" onClick={addLine} className="text-sm text-blue-600 font-medium">+ Add item</button>
                            </div>
                            {form.items.map((item: any, idx: number) => (
                                <div key={idx} className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg">
                                    {rates.length > 0 && (
                                        <select
                                            className="w-full sm:w-40 h-9 px-2 border border-gray-200 rounded-lg text-sm bg-white"
                                            value=""
                                            onChange={(e) => { const v = e.target.value; if (v) applyRateToLine(idx, v); e.target.value = ''; }}
                                            title="Use saved pricing rate"
                                        >
                                            <option value="">Apply saved rate...</option>
                                            {rates.map((r) => (
                                                <option key={r.id} value={r.id}>{r.name} — {r.unit} @ GHS {Number(r.rate_per_unit).toFixed(2)}</option>
                                            ))}
                                        </select>
                                    )}
                                    <input placeholder="Description" value={item.description} onChange={(e) => updateLine(idx, 'description', e.target.value)} className="flex-1 min-w-[100px] h-9 px-3 border rounded-lg text-sm" />
                                    <input type="number" min={0} value={item.quantity} onChange={(e) => updateLine(idx, 'quantity', e.target.value)} className="w-16 h-9 px-2 border rounded-lg text-sm" />
                                    <select value={item.unit} onChange={(e) => updateLine(idx, 'unit', e.target.value)} className="w-20 h-9 px-2 border rounded-lg text-sm">
                                        {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                                    </select>
                                    <input type="number" min={0} step={0.01} placeholder="Price" value={item.unit_price} onChange={(e) => updateLine(idx, 'unit_price', e.target.value)} className="w-24 h-9 px-2 border rounded-lg text-sm" />
                                    <button type="button" onClick={() => removeLine(idx)} className="p-2 text-red-500 hover:bg-red-50 rounded"><Trash2 className="h-4 w-4" /></button>
                                </div>
                            ))}
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Notes</label>
                                <textarea value={form.notes} onChange={(e) => setForm((f: any) => ({ ...f, notes: e.target.value }))} rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-y" />
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button type="submit" disabled={submitting} className="min-h-[44px] px-6 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-gray-900 disabled:opacity-50">
                                {submitting ? 'Saving...' : 'Save'}
                            </button>
                            <button type="button" onClick={() => { setEditing(false); fetchInvoice(); }} className="min-h-[44px] px-6 border border-gray-200 rounded-lg font-semibold text-sm text-gray-700 hover:bg-gray-50">
                                Cancel
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-500">Customer</p>
                                    <p className="font-medium text-gray-900">{invoice.customer_name}</p>
                                    <p className="text-gray-600">{invoice.customer_email}</p>
                                    {invoice.customer_phone && <p className="text-gray-600">{invoice.customer_phone}</p>}
                                    {invoice.customer_address && <p className="text-gray-600">{invoice.customer_address}</p>}
                                </div>
                                <div>
                                    <p className="text-gray-500">Dates</p>
                                    <p className="font-medium text-gray-900">Issue: {invoice.issue_date ? new Date(invoice.issue_date).toLocaleDateString() : '—'}</p>
                                    <p className="font-medium text-gray-900">Due: {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : '—'}</p>
                                </div>
                            </div>
                        </div>
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="px-4 py-2 text-xs font-semibold text-gray-500">Description</th>
                                <th className="px-4 py-2 text-xs font-semibold text-gray-500">Quantity</th>
                                    <th className="px-4 py-2 text-xs font-semibold text-gray-500">Unit</th>
                                    <th className="px-4 py-2 text-xs font-semibold text-gray-500 text-right">Unit price</th>
                                    <th className="px-4 py-2 text-xs font-semibold text-gray-500 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {(invoice.items || []).map((item: any) => (
                                    <tr key={item.id}>
                                        <td className="px-4 py-3 text-sm text-gray-900">{item.description}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{Number(item.quantity)}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{item.unit}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600 text-right">{invoice.currency} {Number(item.unit_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">{invoice.currency} {Number(item.line_total).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="p-6 bg-gray-50 border-t border-gray-100 space-y-1 text-sm">
                            <p className="flex justify-between"><span className="text-gray-600">Subtotal</span><span>{invoice.currency} {Number(invoice.subtotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></p>
                            {Number(invoice.discount_amount) > 0 && <p className="flex justify-between text-gray-600"><span>Discount</span><span>-{invoice.currency} {Number(invoice.discount_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></p>}
                            {Number(invoice.tax_amount) > 0 && <p className="flex justify-between text-gray-600"><span>Tax</span><span>+{invoice.currency} {Number(invoice.tax_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></p>}
                            <p className="flex justify-between font-bold text-base pt-2"><span>Total</span><span>{invoice.currency} {Number(invoice.total).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></p>
                        </div>
                        {invoice.notes && <div className="p-6 border-t border-gray-100"><p className="text-xs text-gray-500 uppercase font-semibold mb-1">Notes</p><p className="text-sm text-gray-700">{invoice.notes}</p></div>}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
