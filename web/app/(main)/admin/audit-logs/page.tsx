'use client';

import { useCallback, useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/axios';
import { Shield, Search, RefreshCw, Download, X } from 'lucide-react';
import toast from 'react-hot-toast';

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
                <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <Shield className="h-7 w-7 text-blue-600" />
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Audit logs</h1>
                            <p className="text-xs text-gray-500 mt-0.5">Security and admin action history</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={fetchLogs}
                        className="min-h-[44px] px-4 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-500 transition-all flex items-center justify-center gap-2"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Refresh
                    </button>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-gray-100 space-y-3">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                            <div className="relative">
                                <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    value={draftFilters.action}
                                    onChange={(e) => setDraftFilters((prev) => ({ ...prev, action: e.target.value }))}
                                    placeholder="Filter by action (e.g. order, wallet, product)"
                                    className="w-full min-h-[44px] pl-9 pr-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                            </div>
                            <input
                                type="text"
                                value={draftFilters.table_name}
                                onChange={(e) => setDraftFilters((prev) => ({ ...prev, table_name: e.target.value }))}
                                placeholder="Filter by table (e.g. orders, users, wallets)"
                                className="w-full min-h-[44px] px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                            <input
                                type="datetime-local"
                                value={draftFilters.from}
                                onChange={(e) => setDraftFilters((prev) => ({ ...prev, from: e.target.value }))}
                                className="w-full min-h-[44px] px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                            <input
                                type="datetime-local"
                                value={draftFilters.to}
                                onChange={(e) => setDraftFilters((prev) => ({ ...prev, to: e.target.value }))}
                                className="w-full min-h-[44px] px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={applyFilter}
                                className="min-h-[44px] px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50"
                            >
                                Apply
                            </button>
                            <button
                                type="button"
                                onClick={clearFilter}
                                className="min-h-[44px] px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50"
                            >
                                Clear
                            </button>
                            <button
                                type="button"
                                onClick={exportCsv}
                                disabled={exporting}
                                className="min-h-[44px] px-4 py-2.5 bg-gray-900 text-white rounded-xl font-semibold text-sm hover:bg-black transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <Download className="h-4 w-4" />
                                {exporting ? 'Exporting...' : 'Export CSV'}
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px]">
                            <thead className="bg-gray-50">
                                <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                                    <th className="px-4 py-3">Time</th>
                                    <th className="px-4 py-3">Actor</th>
                                    <th className="px-4 py-3">Action</th>
                                    <th className="px-4 py-3">Target</th>
                                    <th className="px-4 py-3">IP</th>
                                    <th className="px-4 py-3">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">Loading audit logs...</td>
                                    </tr>
                                ) : rows.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">No audit entries found.</td>
                                    </tr>
                                ) : (
                                    rows.map((row) => (
                                        <tr key={row.id} className="text-sm text-gray-700">
                                            <td className="px-4 py-3 whitespace-nowrap">{new Date(row.created_at).toLocaleString()}</td>
                                            <td className="px-4 py-3">
                                                <p className="font-semibold text-gray-900">{row.admin?.name || 'System'}</p>
                                                <p className="text-xs text-gray-500">{row.admin?.email || '-'}</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold">
                                                    {formatActionName(row.action)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-xs">
                                                <p>{formatTableName(row.table_name)}</p>
                                                <p className="text-gray-500">ID: {row.record_id ?? '-'}</p>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-gray-500">{row.ip_address || '-'}</td>
                                            <td className="px-4 py-3 text-xs text-gray-500 max-w-[320px]">
                                                {(() => {
                                                    const detailObj = getDetailObject(row.details);
                                                    if (!detailObj) return <span>-</span>;
                                                    const route = formatValue(detailObj.route);
                                                    const method = formatValue(detailObj.method);
                                                    const actorRole = formatValue(detailObj.actor_role);
                                                    const otherEntries = Object.entries(detailObj).filter(
                                                        ([key]) => !['route', 'method', 'actor_role'].includes(key),
                                                    );

                                                    return (
                                                        <div className="space-y-2">
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {method !== '-' && (
                                                                    <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-semibold">
                                                                        {method}
                                                                    </span>
                                                                )}
                                                                {actorRole !== '-' && (
                                                                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold">
                                                                        {actorRole}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {route !== '-' && (
                                                                <p className="text-gray-600 break-words">
                                                                    <span className="font-semibold text-gray-700">Route:</span> {route}
                                                                </p>
                                                            )}
                                                            {otherEntries.length > 0 && (
                                                                <p className="text-gray-500">
                                                                    <span className="font-semibold text-gray-700">{otherEntries.length}</span> more detail field(s)
                                                                </p>
                                                            )}
                                                            <button
                                                                type="button"
                                                                onClick={() => setSelectedRow(row)}
                                                                className="text-blue-600 hover:text-blue-700 font-semibold"
                                                            >
                                                                View details
                                                            </button>
                                                        </div>
                                                    );
                                                })()}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-4 border-t border-gray-100 flex items-center justify-between">
                        <p className="text-xs text-gray-500">Page {page} of {totalPages}</p>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page <= 1}
                                className="min-h-[40px] px-3 py-2 rounded-lg border border-gray-200 text-xs font-semibold disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <button
                                type="button"
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages}
                                className="min-h-[40px] px-3 py-2 rounded-lg border border-gray-200 text-xs font-semibold disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            {selectedRow && (
                <div
                    className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4"
                    onClick={() => setSelectedRow(null)}
                >
                    <div
                        className="w-full sm:max-w-2xl bg-white rounded-t-2xl sm:rounded-2xl shadow-xl border border-gray-100 max-h-[85vh] overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-bold text-gray-900">Audit details</h3>
                                <p className="text-xs text-gray-500">
                                    {selectedRow.action} • {new Date(selectedRow.created_at).toLocaleString()}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedRow(null)}
                                className="min-h-[40px] min-w-[40px] rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="p-4 overflow-y-auto max-h-[calc(85vh-64px)]">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                                    <p className="text-[11px] uppercase tracking-wide text-gray-500">Actor</p>
                                    <p className="text-sm font-semibold text-gray-900">{selectedRow.admin?.name || 'System'}</p>
                                    <p className="text-xs text-gray-500">{selectedRow.admin?.email || '-'}</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                                    <p className="text-[11px] uppercase tracking-wide text-gray-500">Target</p>
                                    <p className="text-sm font-semibold text-gray-900">{formatTableName(selectedRow.table_name)}</p>
                                    <p className="text-xs text-gray-500">Record ID: {selectedRow.record_id ?? '-'}</p>
                                </div>
                            </div>

                            {(() => {
                                const detailObj = getDetailObject(selectedRow.details);
                                if (!detailObj) {
                                    return <p className="text-sm text-gray-500">No detail payload available.</p>;
                                }
                                const entries = Object.entries(detailObj);
                                return (
                                    <div className="space-y-2">
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
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
