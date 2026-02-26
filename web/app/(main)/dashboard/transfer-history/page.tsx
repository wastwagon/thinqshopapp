'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { Send, RefreshCw, FileDown } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Link from 'next/link';

interface Transfer {
    id: number;
    token: string;
    amount_ghs: number;
    amount_cny: number;
    recipient_name: string;
    status: string;
    created_at: string;
    admin_reply_images?: string[];
}

export default function TransferHistoryPage() {
    const [history, setHistory] = useState<Transfer[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/finance/transfers');
            setHistory(res.data);
        } catch (error) {
            console.error('Failed to load transfers', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <DashboardLayout>
            <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Recent transfers</h1>
                    <p className="text-xs text-gray-500 mt-1">Cross-border transfer history</p>
                </div>
                <Link
                    href="/dashboard/transfers"
                    className="h-9 px-4 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-all flex items-center gap-2"
                >
                    New transfer
                </Link>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-4 py-4 md:px-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">All transfers</h3>
                    <button onClick={fetchData} className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-blue-600" aria-label="Refresh">
                        <RefreshCw className="h-4 w-4" />
                    </button>
                </div>
                {loading ? (
                    <div className="p-12 text-center">
                        <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto" />
                    </div>
                ) : history.length === 0 ? (
                    <div className="p-12 md:p-16 text-center">
                        <Send className="h-12 w-12 mx-auto mb-6 text-gray-200" />
                        <p className="text-sm text-gray-500 mb-4">No transfers yet</p>
                        <Link
                            href="/dashboard/transfers"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
                        >
                            Send your first transfer
                        </Link>
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-50 max-h-[70vh] overflow-y-auto">
                        {history.map((tx) => (
                            <li key={tx.id} className="px-4 py-4 md:px-6 hover:bg-gray-50 transition-all group">
                                <div className="flex justify-between items-start gap-4">
                                    <div className="min-w-0 space-y-0.5">
                                        <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 truncate">{tx.recipient_name}</p>
                                        <p className="text-xs text-gray-500">{new Date(tx.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                        <p className="text-xs text-gray-400 font-mono">Ref: {tx.token.slice(0, 12)}</p>
                                    </div>
                                    <div className="text-right shrink-0 space-y-0.5">
                                        <p className="text-base font-bold text-gray-900">¥{Number(tx.amount_cny).toFixed(2)}</p>
                                        <p className="text-xs text-gray-500">₵{Number(tx.amount_ghs).toFixed(2)}</p>
                                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold uppercase mt-1 ${
                                            tx.status === 'completed' ? 'bg-green-50 text-green-700' :
                                            tx.status === 'failed' ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-600'
                                        }`}>
                                            {tx.status?.replace(/_/g, ' ') || 'Pending'}
                                        </span>
                                    </div>
                                </div>
                                {tx.admin_reply_images && tx.admin_reply_images.length > 0 && (
                                    <div className="mt-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                        <p className="text-xs font-semibold text-gray-500 mb-2">Proof</p>
                                        <div className="flex gap-2 overflow-x-auto pb-1">
                                            {tx.admin_reply_images.map((img: string, i: number) => (
                                                <a key={i} href={img} target="_blank" rel="noopener noreferrer" className="block w-12 h-12 flex-shrink-0 border bg-white rounded-lg overflow-hidden hover:opacity-90">
                                                    <img src={img} alt="Proof" className="w-full h-full object-cover" />
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div className="mt-4">
                                    <Link
                                        href={`/dashboard/transfers/${tx.id}/confirmation`}
                                        className="inline-flex items-center gap-2 text-xs font-semibold text-blue-600 hover:text-blue-800"
                                    >
                                        <FileDown className="h-3.5 w-3.5" /> Download payment confirmation
                                    </Link>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </DashboardLayout>
    );
}
