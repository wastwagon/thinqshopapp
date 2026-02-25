'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, MapPin, Package, Truck, Wallet, ShoppingBag } from 'lucide-react';
import api from '@/lib/axios';
import ShopLayout from '@/components/layout/ShopLayout';
import PageHeader from '@/components/ui/PageHeader';

const TRACKABLE_SERVICES = [
    {
        icon: Truck,
        title: 'Shipments',
        description: 'Logistics packages and freight. Enter your tracking number (e.g. TQ-ABC123XY).',
    },
    {
        icon: Package,
        title: 'E-commerce Orders',
        description: 'Product orders placed on ThinQShop. Use your order number from confirmation email.',
    },
    {
        icon: Wallet,
        title: 'Money Transfers',
        description: 'Send to China / Receive from China transfers. Track via your transfer token.',
    },
    {
        icon: ShoppingBag,
        title: 'Procurement Orders',
        description: 'Custom sourcing requests. Track status with your procurement order number.',
    },
];

export default function TrackPage() {
    const [trackingNumber, setTrackingNumber] = useState('');
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleTrack = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!trackingNumber) return;
        setLoading(true);
        setError('');
        setResult(null);

        try {
            const { data } = await api.get(`/logistics/track/${trackingNumber}`);
            setResult(data);
        } catch (err) {
            setError('Tracking ID not found. Please verify and try again.');
            setResult(null);
        } finally {
            setLoading(false);
        }
    };

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
                                placeholder="Enter tracking or order number (e.g. TQ-ABC123XY)"
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
                            <div className="bg-gray-900 px-8 py-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Tracking</p>
                                    <p className="text-xl font-bold text-white">{result.trackingNumber}</p>
                                </div>
                                <span className="px-4 py-2 bg-white text-gray-900 rounded-lg text-xs font-bold uppercase">
                                    {result.status?.replace?.(/_/g, ' ') ?? result.status}
                                </span>
                            </div>
                            <div className="p-8">
                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-6">Shipment Journey</h3>
                                <div className="relative border-l-2 border-gray-200 ml-2 space-y-8 pl-8">
                                    {result.tracking && result.tracking.length > 0 ? (
                                        result.tracking.map((event: any, idx: number) => (
                                            <div key={idx} className="relative">
                                                <div className={`absolute -left-[42px] w-4 h-4 rounded-full border-2 border-white shadow ${idx === 0 ? 'bg-blue-600' : 'bg-gray-300'}`} />
                                                <p className="text-xs text-gray-500 mb-1">{new Date(event.created_at).toLocaleString()}</p>
                                                <p className="font-semibold text-gray-900">{event.status}</p>
                                                {event.location && (
                                                    <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                                                        <MapPin className="h-3.5 w-3" /> {event.location}
                                                    </p>
                                                )}
                                                {event.notes && <p className="text-sm text-gray-600 mt-2 italic bg-gray-50 p-3 rounded-lg">&quot;{event.notes}&quot;</p>}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="relative">
                                            <div className="absolute -left-[42px] w-4 h-4 rounded-full border-2 border-white shadow bg-blue-600" />
                                            <p className="text-xs text-gray-500 mb-1">{result.created_at ? new Date(result.created_at).toLocaleString() : '—'}</p>
                                            <p className="font-semibold text-gray-900">Shipment booked</p>
                                            <p className="text-sm text-gray-500 mt-1">Your package is being prepared.</p>
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
