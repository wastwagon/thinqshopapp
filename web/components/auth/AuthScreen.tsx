'use client';

import type { ReactNode } from 'react';
import ShopLayout from '@/components/layout/ShopLayout';
import AuthBrand, { AuthCard } from '@/components/auth/AuthBrand';
import { ShieldCheck, Headphones, Truck, BadgeCheck } from 'lucide-react';
import { inputClassName } from '@/components/ui/Input';
import { labelClassName } from '@/components/ui/Label';
import { buttonVariants } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

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
                        <div className="w-10 h-1 rounded-full bg-gradient-to-r from-blue-600 to-blue-800 mx-auto mb-4" />
                        <h1 className="text-xl font-bold text-gray-900 tracking-tight">{title}</h1>
                        <p className="text-sm text-gray-500 mt-2 leading-snug">{subtitle}</p>
                    </header>
                    {children}
                    {footer}
                </AuthCard>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 max-w-md">
                    {TRUST_ITEMS.map(({ icon: Icon, label }) => (
                        <span key={label} className="flex items-center gap-1.5 text-[11px] font-medium text-gray-400">
                            <Icon className="h-3.5 w-3.5 text-brand" aria-hidden />
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

/** @deprecated Prefer `<Input />` — kept for auth/support pages mid-migration */
export const authInputClass = inputClassName;

/** @deprecated Prefer `<Label />` */
export const authLabelClass = labelClassName;

/** @deprecated Prefer `<Button variant="primary" size="lg" className="w-full" />` */
export const authPrimaryBtnClass = buttonVariants({
    variant: 'primary',
    size: 'lg',
    className: 'w-full',
});

export const authLinkClass = cn('text-brand hover:text-brand/80 font-medium');
