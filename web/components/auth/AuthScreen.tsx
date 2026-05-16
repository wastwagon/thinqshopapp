'use client';

import type { ReactNode } from 'react';
import ShopLayout from '@/components/layout/ShopLayout';
import { ShieldCheck } from 'lucide-react';

type AuthScreenProps = {
    title: string;
    subtitle: string;
    children: ReactNode;
    footer?: ReactNode;
};

/** Light flat auth shell — matches storefront Apple-style UI (no dark hero). */
export default function AuthScreen({ title, subtitle, children, footer }: AuthScreenProps) {
    return (
        <ShopLayout>
            <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-10 sm:py-14 bg-app">
                <div className="w-full max-w-md flat-card p-8 sm:p-10">
                    <header className="mb-8 text-center">
                        <h1 className="page-title text-center">{title}</h1>
                        <p className="page-subtitle text-center mt-2">{subtitle}</p>
                    </header>
                    {children}
                    {footer}
                </div>
                <p className="mt-6 flex items-center justify-center gap-2 text-gray-400 text-xs">
                    <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                    Secure connection
                </p>
            </div>
        </ShopLayout>
    );
}

export const authInputClass =
    'block w-full px-4 py-3 bg-white border border-gray-200/90 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-colors';

export const authLabelClass = 'text-sm font-medium text-gray-700 mb-1.5 block';

export const authPrimaryBtnClass =
    'w-full min-h-[44px] bg-brand text-white h-12 rounded-xl font-semibold text-sm hover:bg-brand/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2';
