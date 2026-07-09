'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DashboardPageHeader from '@/components/dashboard/DashboardPageHeader';
import DashboardContent from '@/components/dashboard/DashboardContent';
import { GroupedList, GroupedListItem } from '@/components/ui/GroupedList';
import {
    Wallet,
    Heart,
    ClipboardList,
    User,
    Settings,
    Tag,
} from 'lucide-react';

const accountLinks = [
    { name: 'Wallet', href: '/dashboard/wallet', icon: Wallet, description: 'Balance, deposit & withdrawals' },
    { name: 'Sell for Me', href: '/dashboard/sell-for-me', icon: Tag, description: 'List items for us to sell' },
    { name: 'Order history', href: '/dashboard/orders', icon: ClipboardList, description: 'Track and manage orders' },
    { name: 'Wishlist', href: '/wishlist', icon: Heart, description: 'Saved items' },
    { name: 'Profile', href: '/dashboard/profile', icon: User, description: 'Personal details & security' },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings, description: 'Preferences & notifications' },
];

export default function AccountHubPage() {
    return (
        <DashboardLayout>
            <DashboardContent>
                <DashboardPageHeader
                    title="Account"
                    subtitle="Quick access to your account areas"
                />
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
            </DashboardContent>
        </DashboardLayout>
    );
}
