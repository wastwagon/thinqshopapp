'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminToolbar from '@/components/admin/AdminToolbar';
import AdminTable, {
    AdminTableBody,
    AdminTableEmpty,
    AdminTableHead,
    AdminTableLoading,
    AdminTd,
    AdminTh,
    AdminTr,
} from '@/components/admin/AdminTable';
import Select from '@/components/ui/Select';
import { buttonVariants } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import Link from 'next/link';
import { FileText, Plus, Eye, Edit3 } from 'lucide-react';

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

    return (
        <DashboardLayout isAdmin={true}>
            <div className="pb-6 md:pb-8">
                <AdminPageHeader
                    icon={FileText}
                    title="Invoices"
                    subtitle="Create, send, and track customer invoices"
                    actions={
                        <AdminToolbar
                            searchValue={searchTerm}
                            onSearchChange={setSearchTerm}
                            searchPlaceholder="Search number, customer, email…"
                            searchAriaLabel="Search invoices"
                        >
                            <Select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                aria-label="Filter by status"
                                className="h-9 min-h-[36px] text-xs w-auto min-w-[9rem]"
                            >
                                <option value="">All statuses</option>
                                {STATUSES.map((s) => (
                                    <option key={s} value={s}>{formatCmsLabel(s)}</option>
                                ))}
                            </Select>
                            <Link
                                href="/admin/invoices/new"
                                className={buttonVariants({ size: 'sm', className: 'shrink-0' })}
                            >
                                <Plus className="h-3.5 w-3.5" /> New invoice
                            </Link>
                        </AdminToolbar>
                    }
                />

                <AdminTable>
                    <AdminTableHead>
                        <AdminTh>Number</AdminTh>
                        <AdminTh>Customer</AdminTh>
                        <AdminTh>Issue date</AdminTh>
                        <AdminTh>Total</AdminTh>
                        <AdminTh>Status</AdminTh>
                        <AdminTh align="right">Actions</AdminTh>
                    </AdminTableHead>
                    <AdminTableBody>
                        {loading ? (
                            <AdminTableLoading colSpan={6} />
                        ) : filtered.length === 0 ? (
                            <AdminTableEmpty
                                colSpan={6}
                                icon={<FileText className="h-10 w-10 mx-auto mb-2 text-gray-200" />}
                                message="No invoices found"
                            />
                        ) : (
                            filtered.map((inv) => (
                                <AdminTr key={inv.id}>
                                    <AdminTd>
                                        <span className="text-xs font-semibold text-gray-900">{inv.invoice_number}</span>
                                    </AdminTd>
                                    <AdminTd>
                                        <p className="text-xs font-semibold text-gray-900">{inv.customer_name}</p>
                                        <p className="text-[10px] text-gray-500">{inv.customer_email}</p>
                                    </AdminTd>
                                    <AdminTd className="text-xs text-gray-500">
                                        {inv.issue_date ? new Date(inv.issue_date).toLocaleDateString() : '—'}
                                    </AdminTd>
                                    <AdminTd className="text-xs font-semibold text-gray-900 tabular-nums">
                                        {inv.currency ?? 'GHS'} {Number(inv.total).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </AdminTd>
                                    <AdminTd>
                                        <StatusBadge status={inv.status}>{formatCmsLabel(inv.status)}</StatusBadge>
                                    </AdminTd>
                                    <AdminTd className="text-right">
                                        <Link
                                            href={`/admin/invoices/${inv.id}`}
                                            className={buttonVariants({
                                                variant: 'secondary',
                                                size: 'sm',
                                                className: 'h-8 min-h-[32px] px-2 text-xs',
                                            })}
                                            title={inv.status === 'draft' ? 'View / Edit' : 'View'}
                                        >
                                            {inv.status === 'draft' ? <Edit3 className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                        </Link>
                                    </AdminTd>
                                </AdminTr>
                            ))
                        )}
                    </AdminTableBody>
                </AdminTable>
            </div>
        </DashboardLayout>
    );
}
