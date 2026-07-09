'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Search, MapPin, Package, Truck, Wallet, ShoppingBag } from 'lucide-react';
import api from '@/lib/axios';
import ShopLayout from '@/components/layout/ShopLayout';
import PageHeader from '@/components/ui/PageHeader';
import ShopPageShell from '@/components/shop/ShopContent';
import ShopTrustRow from '@/components/shop/ShopTrustRow';
import { STATUS_PROGRESS_BADGE_STRONG } from '@/lib/status-styles';

const TRACKABLE_SERVICES = [
    {
        icon: Package,
        title: 'E-commerce Orders',
        refExample: 'ORD-',
        description: 'Product orders from ThinQShop. Use your order number from the confirmation email.',
        gradient: 'from-orange-400 to-amber-600',
        iconBg: 'bg-orange-50 text-orange-600',
    },
    {
        icon: Truck,
        title: 'Shipments',
        refExample: 'SHP-',
        description: 'Logistics packages and freight. Enter your tracking number.',
        gradient: 'from-blue-500 to-blue-700',
        iconBg: 'bg-blue-50 text-blue-600',
    },
    {
        icon: Wallet,
        title: 'Money Transfers',
        refExample: 'TRF-',
        description: 'Send to China / Receive from China. Track via your transfer token.',
        gradient: 'from-violet-500 to-purple-700',
        iconBg: 'bg-violet-50 text-violet-600',
    },
    {
        icon: ShoppingBag,
        title: 'Procurement',
        refExample: 'PRQ- / POR-',
        description: 'Custom sourcing requests and procurement orders from your confirmation.',
        gradient: 'from-emerald-500 to-green-700',
        iconBg: 'bg-emerald-50 text-emerald-600',
    },
] as const;

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
        processing: 'bg-blue-50 text-blue-700 border-blue-200',
        packed: STATUS_PROGRESS_BADGE_STRONG,
        shipped: 'bg-purple-100 text-purple-800 border-purple-200',
        out_for_delivery: 'bg-orange-100 text-orange-800 border-orange-200',
        delivered: 'bg-green-100 text-green-800 border-green-200',
        cancelled: 'bg-red-100 text-red-800 border-red-200',
        payment_received: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        sourcing: 'bg-blue-50 text-blue-700 border-blue-200',
        items_received: STATUS_PROGRESS_BADGE_STRONG,
        ready_for_delivery: 'bg-orange-100 text-orange-800 border-orange-200',
        submitted: 'bg-slate-100 text-slate-800 border-slate-200',
        accepted: 'bg-green-100 text-green-800 border-green-200',
    };
    const style = colors[statusLower] || 'bg-gray-100 text-gray-800 border-gray-200';
    return (
        <span className={`px-2.5 py-1 rounded-md text-xs font-semibold capitalize border ${style}`}>
            {status?.replace(/_/g, ' ') ?? status}
        </span>
    );
}

export default function TrackPage() {
    const searchParams = useSearchParams();
    const [trackingNumber, setTrackingNumber] = useState('');
    const [result, setResult] = useState<TrackResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const prefilled = searchParams.get('n')?.trim();
        if (prefilled) setTrackingNumber(prefilled);
    }, [searchParams]);

    const handleTrack = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!trackingNumber?.trim()) return;
        setLoading(true);
        setError('');
        setResult(null);

        try {
            const { data } = await api.get(`/track/${encodeURIComponent(trackingNumber.trim())}`);
            setResult(data);
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Tracking ID not found. Please verify and try again.';
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
            <div className="bg-white min-h-full pb-8">
                <ShopPageShell wide className="py-8 sm:py-12">
                    <PageHeader
                        title="Track order"
                        subtitle="Status for shipments, orders, transfers, and procurement"
                        accent="blue"
                        breadcrumbs={[{ label: 'Track' }]}
                    />
                    <ShopTrustRow compact />

                    <div className="mt-5 mb-10">
                        <form
                            onSubmit={handleTrack}
                            className="flex flex-col sm:flex-row gap-3 p-4 rounded-2xl bg-white border border-gray-100 shadow-[0_4px_24px_-12px_rgba(0,0,0,0.08)] focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-300"
                        >
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                                <input
                                    type="text"
                                    value={trackingNumber}
                                    onChange={(e) => setTrackingNumber(e.target.value)}
                                    placeholder="Enter tracking or order number (e.g. ORD-..., SHP-..., TRF-...)"
                                    className="w-full h-12 pl-12 pr-4 bg-gray-50 border border-gray-200/90 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="h-12 px-6 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shrink-0"
                            >
                                <Search className="h-4 w-4" />
                                {loading ? 'Searching...' : 'Track'}
                            </button>
                        </form>

                        {error && (
                            <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3">
                                <div className="w-2 h-2 bg-red-500 rounded-full shrink-0" />
                                <p className="text-red-700 text-sm font-medium">{error}</p>
                            </div>
                        )}

                        {result && (
                            <div className="mt-6 rounded-2xl bg-white border border-gray-100 shadow-[0_4px_24px_-12px_rgba(0,0,0,0.08)] overflow-hidden">
                                <div className="px-5 py-4 sm:px-6 border-b border-gray-100 border-l-4 border-l-blue-600 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/50">
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 mb-1">{result.label}</p>
                                        <p className="text-lg font-bold text-gray-900">{result.reference}</p>
                                        {result.created_at && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                Created {new Date(result.created_at).toLocaleString()}
                                            </p>
                                        )}
                                    </div>
                                    <StatusBadge status={result.status} />
                                </div>

                                <div className="px-6 py-4 sm:px-8 border-b border-gray-100 bg-white">
                                    {result.type === 'order' && result.data && (
                                        <div className="flex flex-wrap gap-4 text-sm">
                                            <span><strong>Total:</strong> ₵{Number(result.data.total || 0).toFixed(2)}</span>
                                            <span><strong>Items:</strong> {Number(result.data.items_count || 0)}</span>
                                            {result.data.payment_method ? (
                                                <span><strong>Payment:</strong> {String(result.data.payment_method).replace(/_/g, ' ')}</span>
                                            ) : null}
                                        </div>
                                    )}
                                    {result.type === 'shipment' && result.data?.carrier_tracking_number ? (
                                        <p className="text-sm"><strong>Carrier tracking:</strong> {String(result.data.carrier_tracking_number)}</p>
                                    ) : null}
                                    {result.type === 'transfer' && result.data ? (
                                        <div className="flex flex-wrap gap-4 text-sm">
                                            <span><strong>Amount:</strong> ₵{Number(result.data.amount_ghs || 0).toFixed(2)}</span>
                                        </div>
                                    ) : null}
                                </div>

                                <div className="p-6 sm:p-8">
                                    <h3 className="text-sm font-bold text-gray-900 mb-6">
                                        {result.type === 'shipment' ? 'Shipment Journey' : 'Status Timeline'}
                                    </h3>
                                    <div className="relative border-l-2 border-gray-200 ml-2 space-y-8 pl-8">
                                        {hasTimeline ? (
                                            timeline.map((event, idx) => (
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

                    <div className="border-t border-gray-100 pt-10">
                        <h2 className="text-lg font-bold text-gray-900 mb-2">What you can track</h2>
                        <p className="text-gray-500 text-sm mb-6">Enter your tracking or order number above to get real-time status.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {TRACKABLE_SERVICES.map((service) => {
                                const Icon = service.icon;
                                return (
                                    <div
                                        key={service.title}
                                        className="rounded-2xl bg-white border border-gray-100 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.08)] overflow-hidden"
                                    >
                                        <div className={`h-1 bg-gradient-to-r ${service.gradient}`} />
                                        <div className="p-5 flex items-start gap-4">
                                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${service.iconBg}`}>
                                                <Icon className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900 mb-1">{service.title}</h3>
                                                <p className="text-xs font-mono text-blue-600 mb-1">{service.refExample}</p>
                                                <p className="text-sm text-gray-500 leading-relaxed">{service.description}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="mt-10 text-center">
                        <Link href="/dashboard/orders" className="text-sm font-semibold text-blue-600 hover:underline">
                            View order history in Dashboard →
                        </Link>
                    </div>
                </ShopPageShell>
            </div>
        </ShopLayout>
    );
}
