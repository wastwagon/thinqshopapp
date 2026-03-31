'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Link from 'next/link';
import {
    Wallet,
    ShoppingBag,
    Heart,
    ClipboardList,
    User,
    Settings,
    ChevronRight,
} from 'lucide-react';

const accountLinks = [
    { name: 'Wallet', href: '/dashboard/wallet', icon: Wallet, description: 'Balance, deposit & history' },
    { name: 'Order history', href: '/dashboard/orders', icon: ClipboardList, description: 'Track and manage orders' },
    { name: 'Wishlist', href: '/wishlist', icon: Heart, description: 'Saved items' },
    { name: 'Profile', href: '/dashboard/profile', icon: User, description: 'Personal details & security' },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings, description: 'Preferences & notifications' },
];

export default function AccountHubPage() {
    return (
        <DashboardLayout>
            <div className="pb-20 md:pb-10">
                <div className="mb-6">
                    <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 tracking-tight">Account</h1>
                    <p className="text-xs text-gray-500 mt-0.5">Quick access to your account areas</p>
                </div>
                <nav className="space-y-2" aria-label="Account sections">
                    {accountLinks.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all group min-h-[56px]"
                            >
                                <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors">
                                    <Icon className="h-5 w-5 text-gray-600 group-hover:text-blue-600 transition-colors" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                                    <p className="text-xs text-gray-500 truncate">{item.description}</p>
                                </div>
                                <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-blue-500 shrink-0" aria-hidden />
                            </Link>
                        );
                    })}
                </nav>
                <p className="text-xs text-gray-400 mt-6 text-center">
                    Use the menu (top left) for Logistics, Procurement, Transfers & more.
                </p>
            </div>
        </DashboardLayout>
    );
}
