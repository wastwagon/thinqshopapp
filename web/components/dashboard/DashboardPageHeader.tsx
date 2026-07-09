'use client';

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export type DashboardAccent = 'default' | 'blue' | 'green' | 'purple' | 'orange' | 'navy';

const ACCENT_GRADIENTS: Record<DashboardAccent, string> = {
    default: 'from-blue-600 to-blue-700',
    blue: 'from-blue-500 to-blue-700',
    green: 'from-emerald-500 to-green-700',
    purple: 'from-violet-500 to-purple-700',
    orange: 'from-orange-400 to-amber-600',
    navy: 'from-blue-950 to-blue-800',
};

type DashboardPageHeaderProps = {
    title: string;
    subtitle?: React.ReactNode;
    accent?: DashboardAccent;
    backHref?: string;
    backLabel?: string;
    action?: React.ReactNode;
    className?: string;
};

export default function DashboardPageHeader({
    title,
    subtitle,
    accent = 'default',
    backHref,
    backLabel = 'Back',
    action,
    className = '',
}: DashboardPageHeaderProps) {
    return (
        <motion.header
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className={`mb-5 ${className}`}
        >
            {backHref && (
                <Link
                    href={backHref}
                    className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors mb-3 min-h-[44px] -ml-1 px-1"
                >
                    <ChevronLeft className="h-4 w-4" aria-hidden />
                    {backLabel}
                </Link>
            )}
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <div
                        className={`w-10 h-1 rounded-full bg-gradient-to-r ${ACCENT_GRADIENTS[accent]} mb-3`}
                        aria-hidden
                    />
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight">{title}</h1>
                    {subtitle && (
                        <div className="text-sm text-gray-500 mt-1 leading-snug">{subtitle}</div>
                    )}
                </div>
                {action && <div className="shrink-0">{action}</div>}
            </div>
        </motion.header>
    );
}
