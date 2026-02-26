'use client';

import React from 'react';
import Link from 'next/link';
import { CheckCircle, LucideIcon } from 'lucide-react';

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
    accentColor?: 'blue' | 'emerald' | 'violet' | 'amber';
}

const accentStyles = {
    blue: { bg: 'bg-blue-500', glow: 'shadow-blue-500/30', badge: 'bg-blue-50 text-blue-700 border-blue-100' },
    emerald: { bg: 'bg-emerald-500', glow: 'shadow-emerald-500/30', badge: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
    violet: { bg: 'bg-violet-500', glow: 'shadow-violet-500/30', badge: 'bg-violet-50 text-violet-700 border-violet-100' },
    amber: { bg: 'bg-amber-500', glow: 'shadow-amber-500/30', badge: 'bg-amber-50 text-amber-700 border-amber-100' },
};

export default function ThankYouCard({
    title,
    subtitle,
    details,
    primaryAction,
    secondaryAction,
    accentColor = 'blue',
}: ThankYouCardProps) {
    const style = accentStyles[accentColor];

    return (
        <div className="w-full max-w-md mx-auto px-4 sm:px-6">
            <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-white border border-gray-100 shadow-lg shadow-gray-200/40 sm:shadow-xl sm:shadow-gray-200/50">
                {/* Top accent bar */}
                <div className={`h-1 ${style.bg}`} />

                <div className="p-5 sm:p-6">
                    {/* Success icon - compact on mobile */}
                    <div className="flex justify-center mb-5 sm:mb-6">
                        <div className={`relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl ${style.bg} shadow-lg ${style.glow}`}>
                            <CheckCircle className="w-7 h-7 sm:w-8 sm:h-8 text-white" strokeWidth={2.5} />
                        </div>
                    </div>

                    {/* Title & subtitle - mobile-first typography */}
                    <div className="text-center mb-5 sm:mb-6">
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-1.5 sm:mb-2">
                            {title}
                        </h1>
                        <p className="text-xs sm:text-sm text-gray-500 leading-snug max-w-[280px] sm:max-w-sm mx-auto">
                            {subtitle}
                        </p>
                    </div>

                    {/* Transaction details - compact rows */}
                    <div className="space-y-2 sm:space-y-2.5 mb-5 sm:mb-6">
                        {details.map((d, i) => (
                            <div
                                key={i}
                                className="flex justify-between items-center gap-3 py-2.5 px-3 sm:px-4 rounded-lg sm:rounded-xl bg-gray-50/80 border border-gray-100"
                            >
                                <span className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider shrink-0">
                                    {d.label}
                                </span>
                                <span className="text-xs sm:text-sm font-bold text-gray-900 text-right truncate min-w-0">
                                    {d.value}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Actions - stacked on mobile, row on desktop; touch-friendly 44px min */}
                    <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
                        {primaryAction && (
                            <Link
                                href={primaryAction.href}
                                className="flex-1 flex items-center justify-center gap-2 min-h-[44px] sm:h-11 py-3 sm:py-2.5 rounded-xl bg-gray-900 text-white font-semibold text-xs sm:text-sm hover:bg-gray-800 active:scale-[0.98] transition-all shadow-lg shadow-gray-900/10"
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
        </div>
    );
}
