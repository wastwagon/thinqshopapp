'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { Package, Search, Truck } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Link from 'next/link';

export default function ShipmentsPage() {
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/logistics/history');
            setHistory(res.data);
        } catch (error) {
            console.error('Failed to load shipments', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <DashboardLayout>
            <div className="pb-6 md:pb-8">
            <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div className="flex items-center gap-3">
                    <Truck className="h-8 w-8 text-blue-600" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">My shipments</h1>
                        <p className="text-xs text-blue-600 flex items-center gap-1.5 mt-0.5">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                            Shipping & freight history
                        </p>
                    </div>
                </div>
                <Link
                    href="/dashboard/logistics"
                    className="h-9 px-4 border border-gray-200 rounded-xl text-xs font-semibold text-gray-500 hover:text-blue-600 hover:border-blue-600 transition-all flex items-center gap-2"
                >
                    Create shipment
                </Link>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-4 py-4 md:px-8 md:py-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                    <h3 className="text-xs font-bold tracking-wider text-gray-400 flex items-center">
                        <Package className="h-4 w-4 mr-3 text-blue-600" />
                        All shipments
                    </h3>
                    <button onClick={fetchData} className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-blue-600" aria-label="Refresh">
                        <Search className="h-3 w-3" />
                    </button>
                </div>
                {loading ? (
                    <div className="p-12 text-center">
                        <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto" />
                    </div>
                ) : history.length === 0 ? (
                    <div className="p-12 md:p-16 text-center">
                        <Package className="h-12 w-12 mx-auto mb-6 text-gray-200" />
                        <p className="text-sm text-gray-500 mb-4">No shipments yet</p>
                        <Link
                            href="/dashboard/logistics"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
                        >
                            Create your first shipment
                        </Link>
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-50 max-h-[70vh] overflow-y-auto">
                        {history.map((shipment) => (
                            <li key={shipment.id} className="px-4 py-4 md:px-8 md:py-6 hover:bg-gray-50 transition-all group">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <p className="text-sm font-bold text-gray-900 tracking-tight group-hover:text-blue-600 transition-colors">
                                            {shipment.tracking_number || 'PENDING_ID'}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                                            <p className="text-sm font-medium text-gray-500">
                                                {new Date(shipment.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right flex flex-col items-end gap-2">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                            shipment.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-blue-600'
                                        }`}>
                                            {shipment.status?.replace(/_/g, ' ') || 'Pending'}
                                        </span>
                                        <p className="text-sm font-bold text-gray-900">₵{Number(shipment.total_price || 0).toFixed(2)}</p>
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    <div className="flex items-center justify-between relative px-2">
                                        <div className="absolute left-4 right-4 h-0.5 bg-gray-100 top-1/2 -translate-y-1/2" />
                                        {[
                                            { label: 'Origin', color: 'bg-blue-600' },
                                            { label: 'Transit', color: shipment.status !== 'booked' ? 'bg-blue-600' : 'bg-gray-200' },
                                            { label: 'Customs', color: ['in_transit', 'out_for_delivery', 'delivered'].includes(shipment.status) ? 'bg-blue-600' : 'bg-gray-200' },
                                            { label: 'Final Hub', color: shipment.status === 'delivered' ? 'bg-emerald-500' : 'bg-gray-200' }
                                        ].map((point, idx) => (
                                            <div key={idx} className="relative z-10 flex flex-col items-center">
                                                <div className={`w-2.5 h-2.5 rounded-full ${point.color} border-4 border-white shadow-sm`} />
                                                <span className="text-xs font-medium text-gray-400 mt-2">{point.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            </div>
        </DashboardLayout>
    );
}
