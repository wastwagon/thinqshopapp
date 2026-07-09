'use client';

import { Shield, Headphones, Truck, BadgeCheck } from 'lucide-react';

const ITEMS = [
    { icon: Shield, label: 'Secure checkout' },
    { icon: Headphones, label: '24/7 Support' },
    { icon: Truck, label: 'Fast Delivery' },
    { icon: BadgeCheck, label: 'Trusted' },
] as const;

export default function ShopTrustRow({ compact }: { compact?: boolean }) {
    return (
        <div className={`flex gap-3 overflow-x-auto no-scrollbar ${compact ? 'py-2' : 'py-3'}`}>
            {ITEMS.map(({ icon: Icon, label }) => (
                <span
                    key={label}
                    className={`flex items-center gap-1.5 shrink-0 rounded-xl bg-gray-50 border border-gray-100/80 text-gray-600 ${
                        compact ? 'px-2.5 py-1.5 text-[10px] font-medium' : 'px-3 py-2 text-xs font-medium'
                    }`}
                >
                    <Icon className={`text-blue-500 ${compact ? 'h-3 w-3' : 'h-3.5 w-3.5'}`} aria-hidden />
                    {label}
                </span>
            ))}
        </div>
    );
}
