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
        <div className="fixed bottom-0 left-0 right-0 z-[100] md:hidden bg-white/92 backdrop-blur-xl border-t border-gray-200/90">
            <div className="flex items-center justify-between px-0.5 sm:px-2 pt-1 pb-[calc(0.35rem+env(safe-area-inset-bottom,0px))]">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className="relative flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 py-1 px-0.5 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 min-h-[44px]"
                            aria-label={item.name}
                            aria-current={isActive ? 'page' : undefined}
                        >
                            <Icon
                                className={`h-[22px] w-[22px] shrink-0 transition-colors ${isActive ? 'text-brand' : 'text-gray-400'}`}
                                strokeWidth={isActive ? 2.25 : 1.75}
                                aria-hidden
                            />
                            <span
                                className={`text-[10px] sm:text-[11px] font-medium leading-tight text-center w-full truncate ${
                                    isActive ? 'text-brand' : 'text-gray-500'
                                }`}
                            >
                                {item.name}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
