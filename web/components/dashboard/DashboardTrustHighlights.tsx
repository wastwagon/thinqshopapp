'use client';

import { BadgeCheck, Headphones, Shield, Truck } from 'lucide-react';
import { motion } from 'framer-motion';

const HIGHLIGHTS = [
    {
        icon: Shield,
        title: 'Secure',
        subtitle: '100% Secure Transactions',
        color: 'text-blue-600 bg-blue-50',
    },
    {
        icon: Headphones,
        title: 'Support',
        subtitle: '24/7 Customer Support',
        color: 'text-sky-600 bg-sky-50',
    },
    {
        icon: Truck,
        title: 'Fast Delivery',
        subtitle: 'Reliable & Timely Delivery',
        color: 'text-emerald-600 bg-emerald-50',
    },
    {
        icon: BadgeCheck,
        title: 'Trusted',
        subtitle: 'Trusted by Thousands',
        color: 'text-indigo-600 bg-indigo-50',
    },
] as const;

export default function DashboardTrustHighlights() {
    return (
        <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
            aria-label="Trust and service highlights"
            className="mt-5"
        >
            <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar snap-x snap-mandatory md:grid md:grid-cols-4 md:overflow-visible">
                {HIGHLIGHTS.map((item) => {
                    const Icon = item.icon;
                    return (
                        <div
                            key={item.title}
                            className="snap-start shrink-0 w-[132px] md:w-auto flex flex-col items-center text-center px-2 py-3 rounded-xl bg-white/60 border border-gray-100/80"
                        >
                            <span className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${item.color}`}>
                                <Icon className="h-5 w-5" aria-hidden />
                            </span>
                            <p className="text-xs font-bold text-gray-900">{item.title}</p>
                            <p className="text-[10px] leading-tight text-gray-500 mt-0.5">{item.subtitle}</p>
                        </div>
                    );
                })}
            </div>
        </motion.section>
    );
}
