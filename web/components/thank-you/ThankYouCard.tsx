'use client';

import React from 'react';
import Link from 'next/link';
import { CheckCircle, LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

export interface ThankYouDetail {
    label: string;
    value: string | React.ReactNode;
}

interface ThankYouCardProps {
    title: string;
    subtitle: string;
    details: ThankYouDetail[];
    primaryAction?: { label: string; href: string; icon?: LucideIcon };
    secondaryAction?: { label: string; href: string; icon?: LucideIcon };
    primaryVariant?: 'filled' | 'outlined';
    accentColor?: 'blue' | 'emerald' | 'violet' | 'amber';
}

const accentStyles = {
    blue: {
        bar: 'bg-gradient-to-r from-blue-500 to-blue-700',
        icon: 'bg-gradient-to-br from-blue-500 to-blue-700 shadow-[0_8px_24px_-6px_rgba(37,99,235,0.5)]',
        btn: 'bg-blue-600 text-white hover:bg-blue-700',
    },
    emerald: {
        bar: 'bg-gradient-to-r from-emerald-500 to-green-700',
        icon: 'bg-gradient-to-br from-emerald-500 to-green-700 shadow-[0_8px_24px_-6px_rgba(16,185,129,0.45)]',
        btn: 'bg-emerald-600 text-white hover:bg-emerald-700',
    },
    violet: {
        bar: 'bg-gradient-to-r from-violet-500 to-purple-700',
        icon: 'bg-gradient-to-br from-violet-500 to-purple-700 shadow-[0_8px_24px_-6px_rgba(139,92,246,0.45)]',
        btn: 'bg-violet-600 text-white hover:bg-violet-700',
    },
    amber: {
        bar: 'bg-gradient-to-r from-orange-400 to-amber-600',
        icon: 'bg-gradient-to-br from-orange-400 to-amber-600 shadow-[0_8px_24px_-6px_rgba(245,158,11,0.45)]',
        btn: 'bg-orange-500 text-white hover:bg-orange-600',
    },
};

export default function ThankYouCard({
    title,
    subtitle,
    details,
    primaryAction,
    secondaryAction,
    primaryVariant = 'filled',
    accentColor = 'blue',
}: ThankYouCardProps) {
    const style = accentStyles[accentColor];

    return (
        <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md mx-auto"
        >
            <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-[0_12px_40px_-16px_rgba(0,0,0,0.12)]">
                <div className={`h-1.5 ${style.bar}`} />

                <div className="p-5 sm:p-6">
                    <div className="flex justify-center mb-5 sm:mb-6">
                        <div className={`relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl ${style.icon}`}>
                            <CheckCircle className="w-7 h-7 sm:w-8 sm:h-8 text-white" strokeWidth={2.5} />
                        </div>
                    </div>

                    <div className="text-center mb-5 sm:mb-6">
                        <h1 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight mb-1.5 sm:mb-2">
                            {title}
                        </h1>
                        <p className="text-xs sm:text-sm text-gray-500 leading-snug max-w-[280px] sm:max-w-sm mx-auto">
                            {subtitle}
                        </p>
                    </div>

                    <div className="space-y-2 mb-5 sm:mb-6">
                        {details.map((d, i) => (
                            <div
                                key={i}
                                className="flex justify-between items-center gap-3 py-2.5 px-3 sm:px-4 rounded-xl bg-gray-50/90 border border-gray-100/80"
                            >
                                <span className="text-xs font-medium text-gray-500 capitalize shrink-0">
                                    {d.label}
                                </span>
                                <span className="text-xs sm:text-sm font-semibold text-gray-900 text-right truncate min-w-0">
                                    {d.value}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
                        {primaryAction && (
                            <Link
                                href={primaryAction.href}
                                className={`flex-1 flex items-center justify-center gap-2 min-h-[44px] sm:h-11 py-3 sm:py-2.5 rounded-xl font-semibold text-xs sm:text-sm active:scale-[0.98] transition-all ${
                                    primaryVariant === 'outlined'
                                        ? 'border-2 border-gray-200 text-gray-700 hover:bg-gray-50'
                                        : style.btn
                                }`}
                            >
                                {primaryAction.icon && <primaryAction.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />}
                                <span className="truncate">{primaryAction.label}</span>
                            </Link>
                        )}
                        {secondaryAction && (
                            <Link
                                href={secondaryAction.href}
                                className="flex-1 flex items-center justify-center gap-2 min-h-[44px] sm:h-11 py-3 sm:py-2.5 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold text-xs sm:text-sm hover:bg-gray-50 active:scale-[0.98] transition-all"
                            >
                                {secondaryAction.icon && <secondaryAction.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />}
                                <span className="truncate">{secondaryAction.label}</span>
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
