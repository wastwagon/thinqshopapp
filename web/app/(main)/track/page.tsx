'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, MapPin, Package, Truck, Wallet, ShoppingBag } from 'lucide-react';
import api from '@/lib/axios';
import ShopLayout from '@/components/layout/ShopLayout';
import PageHeader from '@/components/ui/PageHeader';

const TRACKABLE_SERVICES = [
    {
        icon: Package,
        title: 'E-commerce Orders',
        refExample: 'ORD-',
        description: 'Product orders from ThinQShop. Use your order number from the confirmation email (e.g. ORD-1772094117674-517).',
    },
    {
        icon: Truck,
        title: 'Shipments',
        refExample: 'SHP-',
        description: 'Logistics packages and freight. Enter your tracking number (e.g. SHP-1772094117674).',
    },
    {
        icon: Wallet,
        title: 'Money Transfers',
        refExample: 'TRF-',
        description: 'Send to China / Receive from China. Track via your transfer token (e.g. TRF-1772094117674).',
    },
    {
        icon: ShoppingBag,
        title: 'Procurement',
        refExample: 'PRQ- / POR-',
        description: 'Custom sourcing requests (PRQ-) and procurement orders (POR-). Use the number from your confirmation.',
    },
];

type TrackResultType = 'order' | 'shipment' | 'transfer' | 'procurement_request' | 'procurement_order';

interface TrackResult {
    type: TrackResultType;
    reference: string;
    status: string;
    label: string;
    created_at: string;
    data: Record<string, unknown>;
    timeline?: Array<{ date: string; status: string; notes?: string; location?: string }>;
}

function StatusBadge({ status }: { status: string }) {
    const statusLower = status?.toLowerCase() || '';
    const colors: Record<string, string> = {
        pending: 'bg-orange-100 text-orange-800 border-orange-200',
        processing: 'bg-blue-100 text-blue-800 border-blue-200',
        packed: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        shipped: 'bg-purple-100 text-purple-800 border-purple-200',
        out_for_delivery: 'bg-orange-100 text-orange-800 border-orange-200',
        delivered: 'bg-green-100 text-green-800 border-green-200',
        cancelled: 'bg-red-100 text-red-800 border-red-200',
        payment_received: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        sourcing: 'bg-blue-100 text-blue-800 border-blue-200',
        items_received: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        ready_for_delivery: 'bg-orange-100 text-orange-800 border-orange-200',
        submitted: 'bg-slate-100 text-slate-800 border-slate-200',
        accepted: 'bg-green-100 text-green-800 border-green-200',
    };
    const style = colors[statusLower] || 'bg-gray-100 text-gray-800 border-gray-200';
    return (
        <span className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border ${style}`}>
            {status?.replace(/_/g, ' ') ?? status}
        </span>
    );
}

export default function TrackPage() {
    const [trackingNumber, setTrackingNumber] = useState('');
    const [result, setResult] = useState<TrackResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleTrack = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!trackingNumber?.trim()) return;
        setLoading(true);
        setError('');
        setResult(null);

        try {
            const { data } = await api.get(`/track/${encodeURIComponent(trackingNumber.trim())}`);
            setResult(data);
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Tracking ID not found. Please verify and try again.';
            setError(typeof msg === 'string' ? msg : 'Tracking ID not found. Please verify and try again.');
            setResult(null);
        } finally {
            setLoading(false);
        }
    };

    const timeline = result?.timeline ?? [];
    const hasTimeline = timeline.length > 0;

    return (
        <ShopLayout>
            <div className="max-w-4xl mx-auto px-6 py-12">
                <PageHeader
                    title="Track Your Order"
                    subtitle="Real-time status for shipments, orders, transfers, and procurement"
                    breadcrumbs={[{ label: 'Track' }]}
                />

                {/* Track input */}
                <div className="mb-16">
                    <form
                        onSubmit={handleTrack}
                        className="flex flex-col sm:flex-row gap-3 p-4 bg-white border border-gray-200 rounded-2xl shadow-sm shadow-gray-100 hover:shadow-md transition-shadow focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500"
                    >
                        <div className="relative flex-1">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                value={trackingNumber}
                                onChange={(e) => setTrackingNumber(e.target.value)}
                                placeholder="Enter tracking or order number (e.g. ORD-..., SHP-..., TRF-..., PRQ-..., POR-...)"
                                className="w-full h-14 pl-14 pr-6 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="h-14 px-8 bg-gray-900 text-white rounded-xl font-semibold text-sm hover:bg-gray-800 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shrink-0"
                        >
                            <Search className="h-4 w-4" />
                            {loading ? 'Searching...' : 'Track'}
                        </button>
                    </form>

                    {error && (
                        <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3">
                            <div className="w-2 h-2 bg-red-500 rounded-full" />
                            <p className="text-red-700 text-sm font-medium">{error}</p>
                        </div>
                    )}

                    {result && (
                        <div className="mt-8 bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                            {/* Header */}
                            <div className="bg-gray-900 px-6 py-5 sm:px-8 sm:py-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{result.label}</p>
                                    <p className="text-xl font-bold text-white">{result.reference}</p>
                                    {result.created_at && (
                                        <p className="text-xs text-gray-400 mt-1">
                                            Created {new Date(result.created_at).toLocaleString()}
                                        </p>
                                    )}
                                </div>
                                <StatusBadge status={result.status} />
                            </div>

                            {/* Type-specific summary */}
                            <div className="px-6 py-4 sm:px-8 border-b border-gray-100 bg-gray-50/50">
                                {result.type === 'order' && result.data && (
                                    <div className="flex flex-wrap gap-4 text-sm">
                                        <span><strong>Total:</strong> ₵{Number(result.data.total || 0).toFixed(2)}</span>
                                        <span><strong>Items:</strong> {Number(result.data.items_count || 0)}</span>
                                        {result.data.payment_method ? (
                                            <span><strong>Payment:</strong> {String(result.data.payment_method).replace(/_/g, ' ')}</span>
                                        ) : null}
                                        {result.data.shipping_region ? (
                                            <span><strong>Region:</strong> {String(result.data.shipping_region)}</span>
                                        ) : null}
                                    </div>
                                )}
                                {result.type === 'shipment' && result.data?.carrier_tracking_number ? (
                                    <p className="text-sm"><strong>Carrier tracking:</strong> {String(result.data.carrier_tracking_number)}</p>
                                ) : null}
                                {result.type === 'transfer' && result.data ? (
                                    <div className="flex flex-wrap gap-4 text-sm">
                                        <span><strong>Amount:</strong> ₵{Number(result.data.amount_ghs || 0).toFixed(2)}</span>
                                        {result.data.transfer_direction ? (
                                            <span><strong>Direction:</strong> {String(result.data.transfer_direction).replace(/_/g, ' ')}</span>
                                        ) : null}
                                    </div>
                                ) : null}
                                {result.type === 'procurement_order' && result.data ? (
                                    <div className="flex flex-wrap gap-4 text-sm">
                                        <span><strong>Amount:</strong> ₵{Number(result.data.amount || 0).toFixed(2)}</span>
                                        {result.data.request_number ? (
                                            <span><strong>Request:</strong> {String(result.data.request_number)}</span>
                                        ) : null}
                                    </div>
                                ) : null}
                                {result.type === 'procurement_request' && result.data ? (
                                    <p className="text-sm"><strong>Quotes:</strong> {Number(result.data.quotes_count || 0)}</p>
                                ) : null}
                            </div>

                            {/* Timeline */}
                            <div className="p-6 sm:p-8">
                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-6">
                                    {result.type === 'shipment' ? 'Shipment Journey' : 'Status Timeline'}
                                </h3>
                                <div className="relative border-l-2 border-gray-200 ml-2 space-y-8 pl-8">
                                    {hasTimeline ? (
                                        timeline.map((event: any, idx: number) => (
                                            <div key={idx} className="relative">
                                                <div className={`absolute -left-[42px] w-4 h-4 rounded-full border-2 border-white shadow ${idx === 0 ? 'bg-blue-600' : 'bg-gray-300'}`} />
                                                <p className="text-xs text-gray-500 mb-1">
                                                    {event.date ? new Date(event.date).toLocaleString() : '—'}
                                                </p>
                                                <p className="font-semibold text-gray-900">{event.status?.replace?.(/_/g, ' ') ?? event.status}</p>
                                                {event.location && (
                                                    <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                                                        <MapPin className="h-3.5 w-3 shrink-0" /> {event.location}
                                                    </p>
                                                )}
                                                {event.notes && (
                                                    <p className="text-sm text-gray-600 mt-2 italic bg-gray-50 p-3 rounded-lg">&quot;{event.notes}&quot;</p>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="relative">
                                            <div className="absolute -left-[42px] w-4 h-4 rounded-full border-2 border-white shadow bg-blue-600" />
                                            <p className="text-xs text-gray-500 mb-1">
                                                {result.created_at ? new Date(result.created_at).toLocaleString() : '—'}
                                            </p>
                                            <p className="font-semibold text-gray-900">{result.status?.replace?.(/_/g, ' ') ?? 'Recorded'}</p>
                                            <p className="text-sm text-gray-500 mt-1">Your request has been recorded.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* What you can track */}
                <div className="border-t border-gray-100 pt-16">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">What you can track</h2>
                    <p className="text-gray-500 mb-8">Enter your tracking or order number above to get real-time status for any of these services.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {TRACKABLE_SERVICES.map((service, idx) => {
                            const Icon = service.icon;
                            return (
                                <div
                                    key={idx}
                                    className="p-6 bg-gray-50 rounded-2xl border border-gray-100 hover:border-gray-200 transition-colors"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center shrink-0">
                                            <Icon className="h-6 w-6 text-gray-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900 mb-1">{service.title}</h3>
                                            <p className="text-xs font-mono text-blue-600 mb-1">{service.refExample}</p>
                                            <p className="text-sm text-gray-500 leading-relaxed">{service.description}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="mt-12 text-center">
                    <Link href="/dashboard" className="text-sm font-medium text-blue-600 hover:text-blue-700">
                        View order history in Dashboard →
                    </Link>
                </div>
            </div>
        </ShopLayout>
    );
}
