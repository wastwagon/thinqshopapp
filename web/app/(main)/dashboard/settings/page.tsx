'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Link from 'next/link';
import {
    Settings,
    Bell,
    Smartphone,
    Globe,
    Eye,
    Palette,
    Zap,
    Shield,
    Database,
    Trash2
} from 'lucide-react';

export default function SettingsPage() {
    const [notifications, setNotifications] = useState(true);
    const [marketing, setMarketing] = useState(false);
    const [twoFactor, setTwoFactor] = useState(true);

    return (
        <DashboardLayout>
            <div className="pb-6 md:pb-8">
            <div className="mb-6 flex items-center gap-3">
                <Settings className="h-8 w-8 text-blue-600" />
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight leading-tight">Settings</h1>
                    <p className="text-xs text-blue-600 flex items-center gap-1.5 mt-0.5">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                        Preferences saved
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-4 space-y-2">
                    {[
                        { label: 'General', icon: Settings, active: true },
                        { label: 'Appearance', icon: Palette, active: false },
                        { label: 'Security', icon: Shield, active: false },
                        { label: 'Data', icon: Database, active: false }
                    ].map((item, i) => (
                        <button
                            key={i}
                            className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${item.active ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'}`}
                        >
                            <div className="flex items-center gap-3">
                                <item.icon className="h-4 w-4" />
                                <span className="text-xs font-semibold">{item.label}</span>
                            </div>
                            {item.active && <Zap className="h-3 w-3 text-blue-400 fill-blue-400" />}
                        </button>
                    ))}
                </div>

                <div className="lg:col-span-8 space-y-6">
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100">
                                <Bell className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-gray-900">Notifications</h3>
                                <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Alerts & updates</p>
                            </div>
                        </div>

                        <div className="space-y-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-gray-900 mb-0.5">Order & procurement updates</p>
                                    <p className="text-xs text-gray-500">Get notified about order and request status.</p>
                                </div>
                                <button
                                    onClick={() => setNotifications(!notifications)}
                                    className={`w-11 h-6 rounded-full relative transition-all ${notifications ? 'bg-blue-600' : 'bg-gray-200'}`}
                                    aria-label={notifications ? 'Turn off notifications' : 'Turn on notifications'}
                                >
                                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${notifications ? 'left-6' : 'left-0.5'}`} />
                                </button>
                            </div>
                            <div className="h-px bg-gray-50" />
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-gray-900 mb-0.5">Mobile alerts</p>
                                    <p className="text-xs text-gray-500">Send notifications to your phone.</p>
                                </div>
                                <button
                                    onClick={() => setMarketing(!marketing)}
                                    className={`w-11 h-6 rounded-full relative transition-all ${marketing ? 'bg-indigo-600' : 'bg-gray-200'}`}
                                    aria-label={marketing ? 'Turn off mobile alerts' : 'Turn on mobile alerts'}
                                >
                                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${marketing ? 'left-6' : 'left-0.5'}`} />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100">
                                <Eye className="h-5 w-5 text-indigo-600" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-gray-900">Appearance</h3>
                                <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Display options</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-all cursor-pointer">
                                <div className="flex justify-between items-start mb-3">
                                    <Globe className="h-4 w-4 text-gray-400" />
                                    <span className="px-2 py-0.5 bg-white rounded border border-gray-100 text-[10px] font-semibold text-blue-600">Active</span>
                                </div>
                                <p className="text-xs font-semibold text-gray-900 mb-0.5">Language & region</p>
                                <p className="text-[10px] text-gray-500">English, GMT</p>
                            </div>
                            <div className="p-4 bg-white rounded-xl border border-gray-100 hover:border-blue-200 transition-all cursor-pointer">
                                <div className="flex justify-between items-start mb-3">
                                    <Smartphone className="h-4 w-4 text-gray-400" />
                                </div>
                                <p className="text-xs font-semibold text-gray-900 mb-0.5">Compact layout</p>
                                <p className="text-[10px] text-gray-500">Better on small screens</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm border-red-100">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center border border-red-100">
                                <Trash2 className="h-5 w-5 text-red-600" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-gray-900">Delete account</h3>
                                <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Permanently remove your account</p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">Once you delete your account, all your data will be permanently removed. This cannot be undone.</p>
                        <Link
                            href="/dashboard/settings/delete-account"
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 transition-all"
                        >
                            <Trash2 className="h-4 w-4" />
                            Delete my account
                        </Link>
                    </div>
                </div>
            </div>
            </div>
        </DashboardLayout>
    );
}
