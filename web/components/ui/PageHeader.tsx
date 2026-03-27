'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export type BreadcrumbItem = {
    label: string;
    href?: string;
};

interface PageHeaderProps {
    title?: string;
    subtitle?: string;
    breadcrumbs?: BreadcrumbItem[];
}

export default function PageHeader({ title, subtitle, breadcrumbs = [] }: PageHeaderProps) {
    return (
        <div className="w-screen relative left-1/2 -translate-x-1/2 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-b border-slate-700/80 mb-10 -mt-4 pt-5 pb-8 ring-1 ring-inset ring-white/[0.06]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
            {breadcrumbs.length > 0 && (
                <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs">
                    <Link href="/" className="text-slate-400 hover:text-white transition-colors font-medium">
                        Home
                    </Link>
                    {breadcrumbs.map((item, i) => (
                        <span key={i} className="flex items-center gap-1.5">
                            <ChevronRight className="h-4 w-4 text-slate-600 shrink-0" />
                            {item.href ? (
                                <Link href={item.href} className="text-slate-400 hover:text-white transition-colors font-medium">
                                    {item.label}
                                </Link>
                            ) : (
                                <span className="text-white font-semibold">{item.label}</span>
                            )}
                        </span>
                    ))}
                </nav>
            )}
            {title != null && title !== '' && (
                <h1 className="text-xl md:text-2xl font-semibold text-white tracking-tight leading-tight mt-4">
                    {title}
                </h1>
            )}
            {subtitle && (
                <p className="mt-1.5 text-sm text-slate-400">
                    {subtitle}
                </p>
            )}
            </div>
        </div>
    );
}
