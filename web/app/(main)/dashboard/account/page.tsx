'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { GroupedList, GroupedListItem } from '@/components/ui/GroupedList';
import {
    Wallet,
    Heart,
    ClipboardList,
    User,
    Settings,
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
                <header className="mb-5 px-1">
                    <h1 className="page-title">Account</h1>
                    <p className="page-subtitle">Quick access to your account areas</p>
                </header>
                <GroupedList aria-label="Account sections">
                    {accountLinks.map((item) => (
                        <GroupedListItem
                            key={item.name}
                            href={item.href}
                            icon={item.icon}
                            title={item.name}
                            subtitle={item.description}
                        />
                    ))}
                </GroupedList>
                <p className="text-xs text-gray-400 mt-5 px-1 text-center">
                    Use the menu (top left) for Logistics, Procurement, Transfers & more.
                </p>
            </div>
        </DashboardLayout>
    );
}
