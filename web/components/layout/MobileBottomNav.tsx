'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Home,
    Truck,
    ShoppingBag,
    User,
    Send,
} from 'lucide-react';

const navItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Logistics', href: '/dashboard/logistics', icon: Truck },
    { name: 'Procure', href: '/dashboard/procurement', icon: ShoppingBag },
    { name: 'Transfers', href: '/dashboard/transfers', icon: Send },
    { name: 'Account', href: '/dashboard/account', icon: User },
];

export default function MobileBottomNav() {
    const pathname = usePathname();

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[100] md:hidden bg-slate-950 border-t border-slate-700/80 shadow-[0_-4px_24px_rgba(0,0,0,0.2)]">
            <div className="flex items-center justify-between px-0.5 sm:px-2 pt-1.5 pb-[calc(0.25rem+env(safe-area-inset-bottom,0px))]">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className="relative flex flex-col items-center justify-center gap-0 min-w-0 flex-1 py-1 px-0.5 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 min-h-[44px]"
                            aria-label={item.name}
                            aria-current={isActive ? 'page' : undefined}
                        >
                            <div className={`p-1 rounded-md transition-all duration-200 shrink-0 ${isActive ? 'bg-brand text-white shadow-md shadow-brand/25' : 'text-white'}`}>
                                <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={isActive ? 2.5 : 2} aria-hidden />
                            </div>
                            <span className={`text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide leading-tight text-center w-full break-words line-clamp-2 ${isActive ? 'text-amber-200' : 'text-white'}`}>
                                {item.name}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
