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

/** Light flat page header — breadcrumbs + title (no dark hero strip). */
export default function PageHeader({ title, subtitle, breadcrumbs = [] }: PageHeaderProps) {
    return (
        <header className="mb-6 md:mb-8">
            {breadcrumbs.length > 0 && (
                <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-xs text-gray-500 mb-3">
                    <Link href="/" className="hover:text-gray-700 transition-colors">
                        Home
                    </Link>
                    {breadcrumbs.map((item, i) => (
                        <span key={i} className="flex items-center gap-1">
                            <ChevronRight className="h-3.5 w-3.5 text-gray-300 shrink-0" aria-hidden />
                            {item.href ? (
                                <Link href={item.href} className="hover:text-gray-700 transition-colors">
                                    {item.label}
                                </Link>
                            ) : (
                                <span className="text-gray-700 font-medium">{item.label}</span>
                            )}
                        </span>
                    ))}
                </nav>
            )}
            {title != null && title !== '' && <h1 className="page-title">{title}</h1>}
            {subtitle ? <p className="page-subtitle">{subtitle}</p> : null}
        </header>
    );
}
