'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

export type BreadcrumbItem = {
    label: string;
    href?: string;
};

/** Brand navy bar only — amber/legacy accents map to brand for consistency */
export type PageHeaderAccent = 'default' | 'blue' | 'amber' | 'brand';

interface PageHeaderProps {
    title?: string;
    subtitle?: string;
    breadcrumbs?: BreadcrumbItem[];
    /** @deprecated All accents resolve to brand navy */
    accent?: PageHeaderAccent;
}

export default function PageHeader({
    title,
    subtitle,
    breadcrumbs = [],
}: PageHeaderProps) {
    return (
        <motion.header
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="mb-6 md:mb-8"
        >
            {breadcrumbs.length > 0 && (
                <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-xs text-gray-500 mb-3">
                    <Link href="/" className="hover:text-brand transition-colors">
                        Home
                    </Link>
                    {breadcrumbs.map((item, i) => (
                        <span key={i} className="flex items-center gap-1">
                            <ChevronRight className="h-3.5 w-3.5 text-gray-300 shrink-0" aria-hidden />
                            {item.href ? (
                                <Link href={item.href} className="hover:text-brand transition-colors">
                                    {item.label}
                                </Link>
                            ) : (
                                <span className="text-gray-700 font-medium">{item.label}</span>
                            )}
                        </span>
                    ))}
                </nav>
            )}
            {title != null && title !== '' && (
                <>
                    <div className="w-10 h-1 rounded-full bg-gradient-to-r from-blue-600 to-blue-800 mb-3" aria-hidden />
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight">{title}</h1>
                </>
            )}
            {subtitle ? <p className="text-sm text-gray-500 mt-1">{subtitle}</p> : null}
        </motion.header>
    );
}
