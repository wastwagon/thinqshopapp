'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Link from 'next/link';
import {
    Settings,
    User,
    Shield,
    MessageCircle,
    Wallet,
    Truck,
    ShoppingBag,
    Trash2,
    ChevronRight,
} from 'lucide-react';

export default function SettingsPage() {
    return (
        <DashboardLayout>
            <div className="pb-6 md:pb-8">
                <div className="mb-6 flex items-center gap-3">
                    <Settings className="h-8 w-8 text-blue-600" />
                    <div>
                        <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 tracking-tight leading-tight">Settings</h1>
                        <p className="text-xs text-gray-500 mt-0.5">Manage your account and dashboard preferences in one place.</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-6 pt-6 pb-3">
                            <h2 className="text-base font-bold text-gray-900">Account settings</h2>
                            <p className="text-xs text-gray-500 mt-1">These links open live pages where your changes are applied.</p>
                        </div>

                        <div className="p-3">
                            <SettingsLink
                                href="/dashboard/profile"
                                icon={User}
                                title="Profile details"
                                description="Update your name, phone number, and profile information."
                            />
                            <SettingsLink
                                href="/dashboard/account"
                                icon={Shield}
                                title="Security and account"
                                description="Access account actions and personal account options."
                            />
                            <SettingsLink
                                href="/dashboard/support"
                                icon={MessageCircle}
                                title="Support preferences"
                                description="Submit support tickets and follow issue updates."
                            />
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-6 pt-6 pb-3">
                            <h2 className="text-base font-bold text-gray-900">Quick access</h2>
                            <p className="text-xs text-gray-500 mt-1">Common areas users usually manage from settings.</p>
                        </div>

                        <div className="p-3">
                            <SettingsLink
                                href="/dashboard/wallet"
                                icon={Wallet}
                                title="Wallet"
                                description="View balance and wallet transaction activity."
                            />
                            <SettingsLink
                                href="/dashboard/logistics"
                                icon={Truck}
                                title="Logistics"
                                description="Track shipments and delivery workflow details."
                            />
                            <SettingsLink
                                href="/dashboard/orders"
                                icon={ShoppingBag}
                                title="Orders"
                                description="Review order history and order status updates."
                            />
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 border border-red-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center border border-red-100">
                                <Trash2 className="h-5 w-5 text-red-600" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-gray-900">Danger zone</h3>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Permanent actions</p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">Deleting your account permanently removes your access and data.</p>
                        <Link href="/dashboard/settings/delete-account" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 transition-all">
                            <Trash2 className="h-4 w-4" />
                            Delete my account
                        </Link>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

type SettingsLinkProps = {
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
};

function SettingsLink({ href, icon: Icon, title, description }: SettingsLinkProps) {
    return (
        <Link href={href} className="flex items-center justify-between gap-3 rounded-xl border border-transparent px-3 py-3 hover:bg-gray-50 hover:border-gray-100 transition-colors">
            <div className="flex items-start gap-3 min-w-0">
                <div className="mt-0.5 w-8 h-8 rounded-lg bg-gray-100 text-gray-700 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{title}</p>
                    <p className="text-xs text-gray-500">{description}</p>
                </div>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
        </Link>
    );
}
