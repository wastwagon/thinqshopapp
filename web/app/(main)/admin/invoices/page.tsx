'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Link from 'next/link';
import { FileText, Search, Plus, Eye, Edit3 } from 'lucide-react';

const STATUSES = ['draft', 'sent', 'paid', 'overdue'];
const formatCmsLabel = (value?: string | null): string =>
    (value || '')
        .replace(/_/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/\b\w/g, (c) => c.toUpperCase()) || '—';

export default function AdminInvoicesPage() {
    const [invoices, setInvoices] = useState<any[]>([]);
    const [meta, setMeta] = useState<{ total: number; page: number; totalPages: number }>({ total: 0, page: 1, totalPages: 0 });
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchInvoices();
    }, [statusFilter]);

    const fetchInvoices = async () => {
        try {
            setLoading(true);
            const params: { status?: string; page?: number; limit?: number } = { page: 1, limit: 100 };
            if (statusFilter) params.status = statusFilter;
            const { data } = await api.get('/invoices', { params });
            setInvoices(Array.isArray(data?.data) ? data.data : []);
            setMeta(data?.meta ?? { total: 0, page: 1, totalPages: 0 });
        } catch {
            toast.error('Failed to load invoices');
        } finally {
            setLoading(false);
        }
    };

    const filtered = invoices.filter(
        (inv) =>
            (inv.invoice_number ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (inv.customer_name ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (inv.customer_email ?? '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const statusColor: Record<string, string> = {
        draft: 'bg-gray-50 text-gray-700 border-gray-200',
        sent: 'bg-blue-50 text-blue-700 border-blue-200',
        paid: 'bg-green-50 text-green-700 border-green-200',
        overdue: 'bg-red-50 text-red-700 border-red-200',
    };

    return (
        <DashboardLayout isAdmin={true}>
            <div className="pb-6 md:pb-8">
                <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <FileText className="h-7 w-7 text-blue-600" />
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Invoices</h1>
                            <p className="text-xs text-gray-500 mt-0.5">Create, send, and track customer invoices</p>
                        </div>
                    </div>
                    <Link
                        href="/admin/invoices/new"
                        className="min-h-[44px] h-9 px-4 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-gray-900 transition-all flex items-center justify-center gap-1.5 shrink-0"
                    >
                        <Plus className="h-4 w-4" /> New invoice
                    </Link>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                    <div className="relative min-w-0 flex-1 sm:max-w-[200px]">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by invoice number, customer name, or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-9 pl-8 pr-2.5 border border-gray-100 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="h-9 pl-3 pr-8 border border-gray-100 rounded-lg text-sm font-medium text-gray-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none bg-white"
                    >
                        <option value="">All statuses</option>
                        {STATUSES.map((s) => (
                            <option key={s} value={s}>{formatCmsLabel(s)}</option>
                        ))}
                    </select>
                </div>

                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-50">
                                    <th className="px-3 py-2.5 text-xs font-semibold text-gray-500">Number</th>
                                    <th className="px-3 py-2.5 text-xs font-semibold text-gray-500">Customer</th>
                                    <th className="px-3 py-2.5 text-xs font-semibold text-gray-500">Issue date</th>
                                    <th className="px-3 py-2.5 text-xs font-semibold text-gray-500">Total</th>
                                    <th className="px-3 py-2.5 text-xs font-semibold text-gray-500">Status</th>
                                    <th className="px-3 py-2.5 text-xs font-semibold text-gray-500 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="py-10 text-center text-gray-500 text-sm">Loading...</td>
                                    </tr>
                                ) : filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-10 text-center text-gray-500">
                                            <FileText className="h-10 w-10 mx-auto mb-2 text-gray-200" />
                                            <p className="text-sm">No invoices found</p>
                                            <Link href="/admin/invoices/new" className="text-blue-600 text-sm font-medium mt-2 inline-block">Create one</Link>
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map((inv) => (
                                        <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-3 py-2.5">
                                                <span className="text-sm font-semibold text-gray-900">{inv.invoice_number}</span>
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <p className="text-sm font-medium text-gray-900">{inv.customer_name}</p>
                                                <p className="text-xs text-gray-500">{inv.customer_email}</p>
                                            </td>
                                            <td className="px-3 py-2.5 text-sm text-gray-600">
                                                {inv.issue_date ? new Date(inv.issue_date).toLocaleDateString() : '—'}
                                            </td>
                                            <td className="px-3 py-2.5 text-sm font-semibold text-gray-900">
                                                {inv.currency ?? 'GHS'} {Number(inv.total).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <span className={`px-2 py-0.5 text-xs font-semibold rounded-lg border ${statusColor[inv.status] || 'bg-gray-50 text-gray-700'}`}>
                                                    {formatCmsLabel(inv.status)}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2.5 text-right">
                                                <Link
                                                    href={`/admin/invoices/${inv.id}`}
                                                    className="inline-flex items-center gap-1 min-w-[44px] min-h-[44px] w-9 h-9 justify-center rounded-lg border border-gray-100 text-gray-400 hover:text-blue-600 hover:border-blue-600 transition-all"
                                                    title={inv.status === 'draft' ? 'View / Edit' : 'View'}
                                                >
                                                    {inv.status === 'draft' ? <Edit3 className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
