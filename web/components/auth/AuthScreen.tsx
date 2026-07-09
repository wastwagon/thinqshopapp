'use client';

import type { ReactNode } from 'react';
import ShopLayout from '@/components/layout/ShopLayout';
import AuthBrand, { AuthCard } from '@/components/auth/AuthBrand';
import { ShieldCheck, Headphones, Truck, BadgeCheck } from 'lucide-react';

type AuthScreenProps = {
    title: string;
    subtitle: string;
    children: ReactNode;
    footer?: ReactNode;
};

const TRUST_ITEMS = [
    { icon: ShieldCheck, label: 'Secure' },
    { icon: Headphones, label: '24/7 Support' },
    { icon: Truck, label: 'Fast Delivery' },
    { icon: BadgeCheck, label: 'Trusted' },
];

export default function AuthScreen({ title, subtitle, children, footer }: AuthScreenProps) {
    return (
        <ShopLayout>
            <div className="min-h-[calc(100dvh-6rem)] flex flex-col items-center justify-center px-4 py-8 sm:py-12 bg-white">
                <AuthBrand />
                <AuthCard>
                    <header className="mb-8 text-center">
                        <div className="w-10 h-1 rounded-full bg-gradient-to-r from-blue-500 to-blue-700 mx-auto mb-4" />
                        <h1 className="text-xl font-bold text-gray-900 tracking-tight">{title}</h1>
                        <p className="text-sm text-gray-500 mt-2 leading-snug">{subtitle}</p>
                    </header>
                    {children}
                    {footer}
                </AuthCard>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 max-w-md">
                    {TRUST_ITEMS.map(({ icon: Icon, label }) => (
                        <span key={label} className="flex items-center gap-1.5 text-[11px] font-medium text-gray-400">
                            <Icon className="h-3.5 w-3.5 text-blue-500" aria-hidden />
                            {label}
                        </span>
                    ))}
                </div>
                <p className="mt-4 flex items-center justify-center gap-2 text-gray-400 text-xs">
                    <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                    Secure connection
                </p>
            </div>
        </ShopLayout>
    );
}

export const authInputClass =
    'block w-full px-4 py-3 bg-white border border-gray-200/90 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors';

export const authLabelClass = 'text-sm font-medium text-gray-700 mb-1.5 block';

export const authPrimaryBtnClass =
    'w-full min-h-[44px] bg-blue-600 text-white h-12 rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.99]';

export const authLinkClass = 'text-blue-600 hover:text-blue-700 font-medium';
