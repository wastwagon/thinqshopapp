'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import {
    Bell,
    Search,
    User as UserIcon,
    LogOut,
    Settings,
    CheckCircle,
    Menu
} from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';

function getDisplayName(user: { first_name?: string; last_name?: string; email?: string } | null) {
    if (!user) return 'User';
    if (user.first_name || user.last_name) return [user.first_name, user.last_name].filter(Boolean).join(' ').trim();
    return user.email?.split('@')[0] || 'User';
}

interface TopbarProps {
    onMenuPress?: () => void;
}

interface Notification {
    id: number;
    type: string;
    title: string;
    message: string;
    link?: string;
    is_read: boolean;
    created_at: string;
}

export default function Topbar({ onMenuPress }: TopbarProps) {
    const { user, logout } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [showNotifications, setShowNotifications] = useState(false);

    const fetchNotifications = async () => {
        try {
            if (user) {
                const { data } = await api.get('/notifications');
                setNotifications(data);
            }
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Poll every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [user]);

    const handleMarkAsRead = async (id: number) => {
        try {
            await api.patch(`/notifications/${id}/read`);
            setNotifications(ns => ns.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch (error) {
            console.error(error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await api.post('/notifications/read-all');
            setNotifications(ns => ns.map(n => ({ ...n, is_read: true })));
            setShowNotifications(false);
        } catch (error) {
            console.error(error);
        }
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <header className="min-h-14 h-14 bg-white/80 border-b border-gray-100 flex items-center justify-between gap-3 px-3 md:px-6 sticky top-0 z-30 backdrop-blur-xl">
            {/* Mobile: menu button (opens side nav) - 44px touch target for accessibility */}
            {onMenuPress && (
                <button
                    type="button"
                    onClick={onMenuPress}
                    className="md:hidden touch-target min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-gray-700 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    aria-label="Open menu"
                >
                    <Menu className="h-6 w-6" aria-hidden />
                </button>
            )}
            <div className="flex-1 max-w-xs hidden md:block">
                <div className="relative group">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-3.5 w-3.5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                    </span>
                    <input
                        type="text"
                        placeholder="Search..."
                        className="block w-full pl-9 pr-3 py-2 bg-gray-50/80 border border-gray-100 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                    />
                </div>
            </div>

            <div className="flex items-center gap-3 ml-auto">
                <div className="relative">
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="h-10 w-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center text-gray-400 hover:text-blue-600 hover:border-blue-200 transition-all relative shadow-sm"
                        aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
                    >
                        <Bell className="h-4 w-4" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-blue-600 text-white text-[10px] font-bold rounded-full border-2 border-white">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>

                    {showNotifications && (
                        <div className="absolute right-0 mt-4 w-80 lg:w-96 bg-white border border-gray-100 rounded-3xl shadow-2xl overflow-hidden z-50 flex flex-col max-h-[500px] animate-in slide-in-from-top-4 fade-in duration-200">
                            <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                                <h3 className="text-xs font-semibold text-gray-900">Notifications</h3>
                                {unreadCount > 0 && (
                                    <button onClick={handleMarkAllAsRead} className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors">
                                        Mark all read
                                    </button>
                                )}
                            </div>
                            <div className="overflow-y-auto flex-1 p-2 space-y-2">
                                {notifications.length > 0 ? (
                                    notifications.map(notification => (
                                        <div
                                            key={notification.id}
                                            className={`p-4 rounded-2xl transition-all border ${notification.is_read ? 'bg-white border-transparent' : 'bg-blue-50/50 border-blue-100'}`}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-900">{notification.title}</h4>
                                                {!notification.is_read && (
                                                    <button onClick={() => handleMarkAsRead(notification.id)}>
                                                        <CheckCircle className="h-4 w-4 text-blue-600 hover:text-blue-800 transition-colors" />
                                                    </button>
                                                )}
                                            </div>
                                            <p className="text-xs font-bold text-gray-500 leading-relaxed">{notification.message}</p>
                                            <p className="mt-4 text-[9px] font-black uppercase tracking-widest text-gray-400 pt-3 border-t border-gray-100/50">
                                                {new Date(notification.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-8 text-center flex flex-col items-center">
                                        <Bell className="h-6 w-6 text-gray-200 mb-3" />
                                        <p className="text-xs text-gray-400">No notifications</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="h-8 w-px bg-gray-100 hidden sm:block" aria-hidden />

                <div className="flex items-center group relative">
                    <button
                        type="button"
                        className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                        aria-label="Account menu"
                    >
                        <div className="relative h-10 w-10 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden shrink-0 ring-2 ring-white shadow-sm">
                            {user?.profile_image ? (
                                <Image
                                    src={user.profile_image}
                                    alt=""
                                    fill
                                    className="object-cover"
                                    sizes="40px"
                                    unoptimized={user.profile_image.startsWith('http')}
                                />
                            ) : (
                                <span className="text-sm font-bold text-gray-600">
                                    {(user?.first_name?.[0] || user?.email?.[0] || 'U').toUpperCase()}
                                </span>
                            )}
                        </div>
                    </button>

                    {/* Dropdown Menu */}
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all translate-y-2 group-hover:translate-y-0 z-40 overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-50">
                            <p className="text-sm font-semibold text-gray-900 truncate">{getDisplayName(user)}</p>
                            <p className="text-[10px] text-gray-500 mt-0.5 capitalize">{user?.role || 'user'}</p>
                        </div>
                        <div className="p-2 space-y-0.5">
                            <Link href="/dashboard/profile" className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50/50 rounded-xl transition-colors">
                                <UserIcon className="mr-3 h-4 w-4 text-gray-400" /> Profile
                            </Link>
                            <Link href="/dashboard/settings" className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50/50 rounded-xl transition-colors">
                                <Settings className="mr-3 h-4 w-4 text-gray-400" /> Settings
                            </Link>
                            <div className="h-px bg-gray-100 my-1 mx-2" />
                            <button
                                onClick={logout}
                                className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                            >
                                <LogOut className="mr-3 h-4 w-4" /> Sign out
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </header>

    );
}

