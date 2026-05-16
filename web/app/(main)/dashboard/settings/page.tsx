'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { GroupedListSection, GroupedListItem } from '@/components/ui/GroupedList';
import {
    User,
    Shield,
    MessageCircle,
    Wallet,
    Truck,
    ShoppingBag,
    Trash2,
} from 'lucide-react';

export default function SettingsPage() {
    return (
        <DashboardLayout>
            <div className="pb-6 md:pb-8 max-w-lg md:max-w-none">
                <header className="mb-5 px-1">
                    <h1 className="page-title">Settings</h1>
                    <p className="page-subtitle">Manage your account and dashboard preferences.</p>
                </header>

                <GroupedListSection title="Account">
                    <GroupedListItem href="/dashboard/profile" icon={User} title="Profile details" subtitle="Name, phone, and profile photo" />
                    <GroupedListItem href="/dashboard/account" icon={Shield} title="Account hub" subtitle="Wallet, orders, wishlist, and more" />
                    <GroupedListItem href="/dashboard/support" icon={MessageCircle} title="Support" subtitle="Tickets and contact options" />
                </GroupedListSection>

                <GroupedListSection title="Services">
                    <GroupedListItem href="/dashboard/wallet" icon={Wallet} title="Wallet" subtitle="Balance and transaction history" />
                    <GroupedListItem href="/dashboard/logistics" icon={Truck} title="Logistics" subtitle="Shipments and tracking" />
                    <GroupedListItem href="/dashboard/orders" icon={ShoppingBag} title="Orders" subtitle="Order history and status" />
                </GroupedListSection>

                <GroupedListSection title="Danger zone">
                    <GroupedListItem
                        href="/dashboard/settings/delete-account"
                        icon={Trash2}
                        title="Delete account"
                        subtitle="Permanently remove your account and data"
                        destructive
                    />
                </GroupedListSection>
            </div>
        </DashboardLayout>
    );
}
