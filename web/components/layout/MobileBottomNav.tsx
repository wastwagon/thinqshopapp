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
    Zap
} from 'lucide-react';

const navItems = [
    { name: 'Home', href: '/', icon: Zap },
    { name: 'Logistics', href: '/track', icon: Truck },
    { name: 'Supply', href: '/dashboard/procurement', icon: ShoppingBag },
    { name: 'Transfers', href: '/dashboard/transfers', icon: Send },
    { name: 'Account', href: '/dashboard', icon: User },
];

export default function MobileBottomNav() {
    const pathname = usePathname();

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[100] md:hidden px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom,24px))] pt-2">
            <motion.div
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] border border-gray-100 flex items-center justify-around px-2 py-3 shadow-2xl shadow-gray-200 relative overflow-hidden"
            >
                {navItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className="relative flex flex-col items-center justify-center gap-1 group touch-target py-2 px-4 rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                            aria-label={item.name}
                            aria-current={isActive ? 'page' : undefined}
                        >
                            <div className={`p-2 rounded-xl transition-all duration-300 ${isActive ? 'bg-blue-600 text-white scale-110 shadow-lg shadow-blue-200' : 'text-gray-400 group-hover:text-gray-600'}`}>
                                <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} aria-hidden />
                            </div>
                            <span className={`text-[9px] font-bold uppercase tracking-tight transition-all duration-300 ${isActive ? 'text-blue-600' : 'text-gray-400 opacity-60'}`}>
                                {item.name}
                            </span>
                        </Link>
                    );
                })}
            </motion.div>
        </div>
    );
}
