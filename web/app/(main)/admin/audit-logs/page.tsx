'use client';

import { useCallback, useEffect, useState } from 'react';
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
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import api from '@/lib/axios';
import { Shield, Search, RefreshCw, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { AUDIT_PATCH_BADGE } from '@/lib/status-styles';

type AuditRow = {
    id: number;
    action: string;
    table_name?: string | null;
    record_id?: number | null;
    ip_address?: string | null;
    details?: unknown;
    created_at: string;
    admin?: { id: number; email?: string | null; name?: string | null } | null;
};

type Filters = {
    action: string;
    table_name: string;
    from: string;
    to: string;
};

const getDetailObject = (details: unknown): Record<string, unknown> | null => {
    if (!details || typeof details !== 'object' || Array.isArray(details)) return null;
    return details as Record<string, unknown>;
};

const formatLabel = (key: string) =>
    key
        .replace(/_/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/^./, (c) => c.toUpperCase());

const toTitleWords = (value: string) =>
    value
        .replace(/[._-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/\b\w/g, (c) => c.toUpperCase());

const formatActionName = (action: string) => toTitleWords(action || 'Unknown action');
const formatTableName = (tableName?: string | null) => (tableName ? toTitleWords(tableName) : 'General');

const formatValue = (value: unknown): string => {
    if (value == null) return '-';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (Array.isArray(value)) {
        return value
            .map((item) => (typeof item === 'object' ? JSON.stringify(item) : String(item)))
            .join(', ');
    }
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
};

export default function AdminAuditLogsPage() {
    const [rows, setRows] = useState<AuditRow[]>([]);
    const [page, setPage] = useState(1);
    const [limit] = useState(30);
    const [totalPages, setTotalPages] = useState(1);
    const [draftFilters, setDraftFilters] = useState<Filters>({
        action: '',
        table_name: '',
        from: '',
        to: '',
    });
    const [filters, setFilters] = useState<Filters>({
        action: '',
        table_name: '',
        from: '',
        to: '',
    });
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [selectedRow, setSelectedRow] = useState<AuditRow | null>(null);

    const renderDetailValue = (value: unknown) => {
        if (value == null) {
            return <p className="text-sm text-gray-500">-</p>;
        }

        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
            return <p className="text-sm text-gray-800 break-words">{String(value)}</p>;
        }

        if (Array.isArray(value)) {
            if (value.length === 0) return <p className="text-sm text-gray-500">No items</p>;
            return (
                <div className="space-y-1">
                    {value.map((item, idx) => (
                        <div key={idx} className="text-sm text-gray-800 break-words bg-gray-50 rounded-md px-2.5 py-1.5">
                            {typeof item === 'object' ? JSON.stringify(item) : String(item)}
                        </div>
                    ))}
                </div>
            );
        }

        if (typeof value === 'object') {
            const entries = Object.entries(value as Record<string, unknown>);
            if (entries.length === 0) return <p className="text-sm text-gray-500">No values</p>;
            return (
                <div className="space-y-1.5">
                    {entries.map(([childKey, childValue]) => (
                        <div key={childKey} className="bg-gray-50 rounded-md px-2.5 py-1.5">
                            <p className="text-[11px] uppercase tracking-wide text-gray-500">{formatLabel(childKey)}</p>
                            <p className="text-sm text-gray-800 break-words">{formatValue(childValue)}</p>
                        </div>
                    ))}
                </div>
            );
        }

        return <p className="text-sm text-gray-800 break-words">{String(value)}</p>;
    };

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/admin/audit-logs', {
                params: {
                    page,
                    limit,
                    action: filters.action.trim() || undefined,
                    table_name: filters.table_name.trim() || undefined,
                    from: filters.from || undefined,
                    to: filters.to || undefined,
                },
            });
            setRows(Array.isArray(data?.data) ? data.data : []);
            setTotalPages(Number(data?.meta?.totalPages || 1));
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Failed to load audit logs');
        } finally {
            setLoading(false);
        }
    }, [page, limit, filters]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const applyFilter = () => {
        setPage(1);
        setFilters({ ...draftFilters });
    };

    const clearFilter = () => {
        const reset = { action: '', table_name: '', from: '', to: '' };
        setDraftFilters(reset);
        setFilters(reset);
        setPage(1);
    };

    const exportCsv = async () => {
        setExporting(true);
        try {
            const response = await api.get('/admin/audit-logs/export.csv', {
                params: {
                    action: filters.action.trim() || undefined,
                    table_name: filters.table_name.trim() || undefined,
                    from: filters.from || undefined,
                    to: filters.to || undefined,
                },
                responseType: 'blob',
            });

            const fallbackName = `admin-audit-logs-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.csv`;
            const disposition = response.headers?.['content-disposition'] as string | undefined;
            const matched = disposition?.match(/filename="([^"]+)"/i);
            const filename = matched?.[1] || fallbackName;

            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv;charset=utf-8;' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Failed to export CSV');
        } finally {
            setExporting(false);
        }
    };

    return (
        <DashboardLayout isAdmin={true}>
            <div className="pb-6 md:pb-8">
                <AdminPageHeader
                    icon={Shield}
                    title="Audit logs"
                    subtitle="Security and admin action history"
                    actions={
                        <Button
                            type="button"
                            size="sm"
                            leftIcon={<RefreshCw className="h-4 w-4" />}
                            onClick={fetchLogs}
                        >
                            Refresh
                        </Button>
                    }
                />

                <div className="admin-card overflow-hidden mb-4">
                    <div className="p-4 border-b border-gray-100 space-y-3">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                            <div className="relative">
                                <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <Input
                                    type="text"
                                    value={draftFilters.action}
                                    onChange={(e) =>
                                        setDraftFilters((prev) => ({ ...prev, action: e.target.value }))
                                    }
                                    placeholder="Filter by action (e.g. order, wallet, product)"
                                    className="pl-9"
                                />
                            </div>
                            <Input
                                type="text"
                                value={draftFilters.table_name}
                                onChange={(e) =>
                                    setDraftFilters((prev) => ({ ...prev, table_name: e.target.value }))
                                }
                                placeholder="Filter by table (e.g. orders, users, wallets)"
                            />
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                            <Input
                                type="datetime-local"
                                value={draftFilters.from}
                                onChange={(e) =>
                                    setDraftFilters((prev) => ({ ...prev, from: e.target.value }))
                                }
                            />
                            <Input
                                type="datetime-local"
                                value={draftFilters.to}
                                onChange={(e) =>
                                    setDraftFilters((prev) => ({ ...prev, to: e.target.value }))
                                }
                            />
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button type="button" size="sm" variant="secondary" onClick={applyFilter}>
                                Apply
                            </Button>
                            <Button type="button" size="sm" variant="secondary" onClick={clearFilter}>
                                Clear
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                onClick={exportCsv}
                                loading={exporting}
                                disabled={exporting}
                                leftIcon={!exporting ? <Download className="h-4 w-4" /> : undefined}
                            >
                                Export CSV
                            </Button>
                        </div>
                    </div>

                    <AdminTable className="border-0 rounded-none shadow-none">
                        <AdminTableHead>
                            <AdminTh>Time</AdminTh>
                            <AdminTh>Actor</AdminTh>
                            <AdminTh>Action</AdminTh>
                            <AdminTh>Target</AdminTh>
                            <AdminTh>IP</AdminTh>
                            <AdminTh>Details</AdminTh>
                        </AdminTableHead>
                        <AdminTableBody>
                            {loading ? (
                                <AdminTableLoading colSpan={6} label="Loading audit logs…" />
                            ) : rows.length === 0 ? (
                                <AdminTableEmpty colSpan={6} message="No audit entries found." />
                            ) : (
                                rows.map((row) => (
                                    <AdminTr key={row.id}>
                                        <AdminTd className="whitespace-nowrap text-sm text-gray-700">
                                            {new Date(row.created_at).toLocaleString()}
                                        </AdminTd>
                                        <AdminTd>
                                            <p className="font-semibold text-gray-900 text-sm">
                                                {row.admin?.name || 'System'}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {row.admin?.email || '-'}
                                            </p>
                                        </AdminTd>
                                        <AdminTd>
                                            <Badge variant="brand">{formatActionName(row.action)}</Badge>
                                        </AdminTd>
                                        <AdminTd className="text-xs">
                                            <p>{formatTableName(row.table_name)}</p>
                                            <p className="text-gray-500">ID: {row.record_id ?? '-'}</p>
                                        </AdminTd>
                                        <AdminTd className="text-xs text-gray-500">
                                            {row.ip_address || '-'}
                                        </AdminTd>
                                        <AdminTd className="text-xs text-gray-500 max-w-[320px]">
                                            {(() => {
                                                const detailObj = getDetailObject(row.details);
                                                if (!detailObj) return <span>-</span>;
                                                const route = formatValue(detailObj.route);
                                                const method = formatValue(detailObj.method);
                                                const actorRole = formatValue(detailObj.actor_role);
                                                const otherEntries = Object.entries(detailObj).filter(
                                                    ([key]) =>
                                                        !['route', 'method', 'actor_role'].includes(key)
                                                );

                                                return (
                                                    <div className="space-y-2">
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {method !== '-' && (
                                                                <span className={AUDIT_PATCH_BADGE}>
                                                                    {method}
                                                                </span>
                                                            )}
                                                            {actorRole !== '-' && (
                                                                <Badge variant="success">{actorRole}</Badge>
                                                            )}
                                                        </div>
                                                        {route !== '-' && (
                                                            <p className="text-gray-600 break-words">
                                                                <span className="font-semibold text-gray-700">
                                                                    Route:
                                                                </span>{' '}
                                                                {route}
                                                            </p>
                                                        )}
                                                        {otherEntries.length > 0 && (
                                                            <p className="text-gray-500">
                                                                <span className="font-semibold text-gray-700">
                                                                    {otherEntries.length}
                                                                </span>{' '}
                                                                more detail field(s)
                                                            </p>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedRow(row)}
                                                            className="text-brand hover:text-brand/80 font-semibold"
                                                        >
                                                            View details
                                                        </button>
                                                    </div>
                                                );
                                            })()}
                                        </AdminTd>
                                    </AdminTr>
                                ))
                            )}
                        </AdminTableBody>
                    </AdminTable>

                    <div className="p-4 border-t border-gray-100 flex items-center justify-between">
                        <p className="text-xs text-gray-500">
                            Page {page} of {totalPages}
                        </p>
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page <= 1}
                            >
                                Previous
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <Modal
                open={!!selectedRow}
                onClose={() => setSelectedRow(null)}
                title="Audit details"
                description={
                    selectedRow
                        ? `${selectedRow.action} • ${new Date(selectedRow.created_at).toLocaleString()}`
                        : undefined
                }
                size="xl"
                footer={
                    <Button type="button" variant="secondary" onClick={() => setSelectedRow(null)}>
                        Close
                    </Button>
                }
            >
                {selectedRow && (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                            <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                                <p className="text-[11px] uppercase tracking-wide text-gray-500">Actor</p>
                                <p className="text-sm font-semibold text-gray-900">
                                    {selectedRow.admin?.name || 'System'}
                                </p>
                                <p className="text-xs text-gray-500">{selectedRow.admin?.email || '-'}</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                                <p className="text-[11px] uppercase tracking-wide text-gray-500">Target</p>
                                <p className="text-sm font-semibold text-gray-900">
                                    {formatTableName(selectedRow.table_name)}
                                </p>
                                <p className="text-xs text-gray-500">
                                    Record ID: {selectedRow.record_id ?? '-'}
                                </p>
                            </div>
                        </div>

                        {(() => {
                            const detailObj = getDetailObject(selectedRow.details);
                            if (!detailObj) {
                                return <p className="text-sm text-gray-500">No detail payload available.</p>;
                            }
                            const entries = Object.entries(detailObj);
                            return (
                                <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                                    {entries.map(([key, value]) => (
                                        <div key={key} className="border border-gray-100 rounded-lg p-3">
                                            <p className="text-[11px] uppercase tracking-wide text-gray-500 mb-1">
                                                {formatLabel(key)}
                                            </p>
                                            {renderDetailValue(value)}
                                        </div>
                                    ))}
                                </div>
                            );
                        })()}
                    </>
                )}
            </Modal>
        </DashboardLayout>
    );
}
