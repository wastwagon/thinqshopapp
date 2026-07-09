'use client';

import type { LucideIcon } from 'lucide-react';

type AdminPageHeaderProps = {
    icon: LucideIcon;
    title: string;
    subtitle?: string;
    actions?: React.ReactNode;
};

export default function AdminPageHeader({ icon: Icon, title, subtitle, actions }: AdminPageHeaderProps) {
    return (
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 border border-blue-100 text-blue-600">
                    <Icon className="h-5 w-5" aria-hidden />
                </span>
                <div className="min-w-0">
                    <h1 className="admin-page-title">{title}</h1>
                    {subtitle ? <p className="admin-page-subtitle">{subtitle}</p> : null}
                </div>
            </div>
            {actions ? <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div> : null}
        </div>
    );
}
