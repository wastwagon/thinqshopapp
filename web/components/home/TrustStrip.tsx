'use client';

import Link from 'next/link';
import { Shield, Truck, RotateCcw, Star, Lock, CheckCircle, LucideIcon } from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
    shield: Shield,
    truck: Truck,
    'rotate-ccw': RotateCcw,
    star: Star,
    lock: Lock,
    'check-circle': CheckCircle,
};

type Badge = { id: number; icon: string; label: string; optional_link?: string | null };

const FALLBACK_BADGES: Badge[] = [
    { id: 1, icon: 'shield', label: 'Secure checkout', optional_link: null },
    { id: 2, icon: 'truck', label: 'Global shipping 7–14 days', optional_link: '/privacy' },
    { id: 3, icon: 'rotate-ccw', label: 'Easy returns', optional_link: '/terms' },
    { id: 4, icon: 'star', label: 'Rated 4.8 by customers', optional_link: null },
    { id: 5, icon: 'lock', label: 'Paystack protected', optional_link: 'https://paystack.com' },
    { id: 6, icon: 'check-circle', label: 'Warranty available', optional_link: '/shop' },
];

export default function TrustStrip({ badges }: { badges: Badge[] }) {
    const list = badges?.length ? badges : FALLBACK_BADGES;
    if (!list.length) return null;
    return (
        <section className="bg-white/95 backdrop-blur-md border-b border-gray-100/90 py-4 sm:py-5 shadow-[0_1px_0_0_rgba(255,255,255,0.8)_inset]" aria-label="Trust badges">
            <div className="w-full px-3 sm:px-4">
                {/* Full-width: single row so labels don't wrap. Mobile: horizontal scroll with wider cards */}
                <div className="flex gap-3 overflow-x-auto pb-1 md:grid md:grid-cols-6 md:overflow-visible no-scrollbar">
                    {list.map((b) => {
                        const Icon = ICON_MAP[b.icon] ?? Star;
                        const content = (
                            <span className="flex items-center gap-3 min-w-[200px] sm:min-w-[220px] md:min-w-0 flex-1 p-3 rounded-xl bg-gradient-to-br from-orange-50/90 to-slate-50 border border-gray-100/90 hover:border-brand/25 hover:shadow-sm transition-all whitespace-nowrap">
                                <span className="flex-shrink-0 w-10 h-10 rounded-lg bg-brand/12 ring-1 ring-brand/15 flex items-center justify-center text-brand">
                                    <Icon className="w-5 h-5" aria-hidden />
                                </span>
                                <span className="text-sm font-medium text-gray-900 truncate">{b.label}</span>
                            </span>
                        );
                        if (b.optional_link && b.optional_link.startsWith('http')) {
                            return (
                                <a
                                    key={b.id}
                                    href={b.optional_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="touch-manipulation min-h-[44px] flex"
                                >
                                    {content}
                                </a>
                            );
                        }
                        if (b.optional_link) {
                            return (
                                <Link key={b.id} href={b.optional_link} className="touch-manipulation min-h-[44px] flex">
                                    {content}
                                </Link>
                            );
                        }
                        return <div key={b.id}>{content}</div>;
                    })}
                </div>
            </div>
        </section>
    );
}
