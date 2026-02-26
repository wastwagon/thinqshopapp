'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    Home,
    Truck,
    ShoppingBag,
    User,
    Send,
} from 'lucide-react';

const navItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Logistics', href: '/track', icon: Truck },
    { name: 'Supply', href: '/dashboard/procurement', icon: ShoppingBag },
    { name: 'Transfers', href: '/dashboard/transfers', icon: Send },
    { name: 'Account', href: '/dashboard', icon: User },
];

export default function MobileBottomNav() {
    const pathname = usePathname();

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[100] md:hidden px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,20px))] pt-1.5">
            <motion.div
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                transition={{ type: 'spring', damping: 22, stiffness: 120 }}
                className="bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-700/50 flex items-center justify-between px-1 py-2 shadow-xl shadow-black/20"
            >
                {navItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className="relative flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 py-1.5 px-1 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                            aria-label={item.name}
                            aria-current={isActive ? 'page' : undefined}
                        >
                            <div className={`p-1.5 rounded-lg transition-all duration-200 ${isActive ? 'bg-blue-500 text-white' : 'text-white'}`}>
                                <Icon className="h-4 w-4" strokeWidth={isActive ? 2.5 : 2} aria-hidden />
                            </div>
                            <span className={`text-[8px] font-semibold uppercase tracking-wider truncate w-full text-center ${isActive ? 'text-blue-300' : 'text-white'}`}>
                                {item.name}
                            </span>
                        </Link>
                    );
                })}
            </motion.div>
        </div>
    );
}
