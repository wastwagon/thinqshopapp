'use client';

import React from 'react';
import Image from 'next/image';
import {
    Bell,
    Search,
    User as UserIcon,
    LogOut,
    Settings,
    CheckCircle,
    Menu,
    X
} from 'lucide-react';
import Link from 'next/link';
import SearchWithSuggestions from '@/components/ui/SearchWithSuggestions';

function getDisplayName(user: { first_name?: string; last_name?: string; email?: string } | null) {
    if (!user) return 'User';
    if (user.first_name || user.last_name) return [user.first_name, user.last_name].filter(Boolean).join(' ').trim();
    return user.email?.split('@')[0] || 'User';
}

export interface Notification {
    id: number;
    type: string;
    title: string;
    message: string;
    link?: string;
    is_read: boolean;
    created_at: string;
}

export interface TopbarViewProps {
    onMenuPress?: () => void;
    user: { first_name?: string; last_name?: string; email?: string; role?: string; profile_image?: string | null } | null;
    logout: () => void;
    notifications: Notification[];
    showNotifications: boolean;
    setShowNotifications: React.Dispatch<React.SetStateAction<boolean>>;
    accountMenuOpen: boolean;
    setAccountMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
    mobileSearchOpen: boolean;
    setMobileSearchOpen: React.Dispatch<React.SetStateAction<boolean>>;
    accountMenuRef: React.Ref<HTMLDivElement>;
    handleMarkAsRead: (id: number) => void;
    handleMarkAllAsRead: () => void;
}

export default function TopbarView(props: TopbarViewProps) {
    const {
        onMenuPress,
        user,
        logout,
    notifications,
    showNotifications,
        setShowNotifications,
        accountMenuOpen,
        setAccountMenuOpen,
        mobileSearchOpen,
        setMobileSearchOpen,
        accountMenuRef,
        handleMarkAsRead,
        handleMarkAllAsRead,
    } = props;
    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <div role="banner" className="min-h-14 bg-white/80 border-b border-gray-100 flex flex-col sticky top-0 z-30 backdrop-blur-xl">
            <div className="h-14 flex items-center justify-between gap-3 px-3 md:px-6">
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
                    <SearchWithSuggestions
                        id="topbar-search-desktop"
                        listboxId="topbar-search-desktop-suggestions"
                        className="w-full"
                        inputClassName="h-10 pl-9 pr-3 rounded-xl text-sm border-gray-100 bg-gray-50/80 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        placeholder="Search products..."
                    />
                </div>

                <div className="flex items-center gap-2 md:gap-3 ml-auto">
                    <button
                        type="button"
                        onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
                        className="md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-gray-600 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                        aria-label={mobileSearchOpen ? 'Close search' : 'Open search'}
                    >
                        {mobileSearchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
                    </button>
                    <div className="relative">
                        <button
                            onClick={() => { setShowNotifications(!showNotifications); setAccountMenuOpen(false); }}
                            className="min-w-[44px] min-h-[44px] w-10 h-10 md:w-10 md:h-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center text-gray-400 hover:text-blue-600 hover:border-blue-200 transition-all relative shadow-sm"
                            aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
                            aria-expanded={showNotifications}
                        >
                            <Bell className="h-4 w-4" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-blue-600 text-white text-xs font-bold rounded-full border-2 border-white">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </button>

                        {showNotifications && (
                            <div className="absolute right-0 mt-4 w-80 lg:w-96 bg-white border border-gray-100 rounded-3xl shadow-2xl overflow-hidden z-50 flex flex-col max-h-[500px] animate-in slide-in-from-top-4 fade-in duration-200">
                                <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                                    <h3 className="text-xs font-semibold text-gray-900">Notifications</h3>
                                    {unreadCount > 0 && (
                                        <button onClick={handleMarkAllAsRead} className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center -m-2">
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
                                                    <h4 className="text-xs font-black uppercase tracking-widest text-gray-900">{notification.title}</h4>
                                                    {!notification.is_read && (
                                                        <button type="button" onClick={() => handleMarkAsRead(notification.id)} className="min-w-[44px] min-h-[44px] flex items-center justify-center -m-2">
                                                            <CheckCircle className="h-4 w-4 text-blue-600 hover:text-blue-800 transition-colors" aria-hidden />
                                                        </button>
                                                    )}
                                                </div>
                                                <p className="text-xs font-bold text-gray-500 leading-relaxed">{notification.message}</p>
                                                <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-gray-400 pt-3 border-t border-gray-100/50">
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

                    <div className="flex items-center group relative" ref={accountMenuRef}>
                        <button
                            type="button"
                            onClick={() => { setAccountMenuOpen((v) => !v); setShowNotifications(false); }}
                            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 md:p-1.5"
                            aria-label="Account menu"
                            aria-expanded={accountMenuOpen}
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

                        <div
                            className={`absolute right-0 top-full mt-2 w-56 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 z-40 overflow-hidden transition-all translate-y-2
                                md:opacity-0 md:invisible md:group-hover:opacity-100 md:group-hover:visible md:group-hover:translate-y-0
                                ${accountMenuOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible max-md:translate-y-2'}`}
                        >
                            <div className="px-4 py-3 border-b border-gray-50">
                                <p className="text-sm font-semibold text-gray-900 truncate">{getDisplayName(user)}</p>
                                <p className="text-xs text-gray-500 mt-0.5 capitalize">{user?.role || 'user'}</p>
                            </div>
                            <div className="p-2 space-y-0.5">
                                <Link href="/dashboard/profile" onClick={() => setAccountMenuOpen(false)} className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50/50 rounded-xl transition-colors min-h-[44px]">
                                    <UserIcon className="mr-3 h-4 w-4 text-gray-400" /> Profile
                                </Link>
                                <Link href="/dashboard/settings" onClick={() => setAccountMenuOpen(false)} className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50/50 rounded-xl transition-colors min-h-[44px]">
                                    <Settings className="mr-3 h-4 w-4 text-gray-400" /> Settings
                                </Link>
                                <div className="h-px bg-gray-100 my-1 mx-2" />
                                <button
                                    type="button"
                                    onClick={() => { setAccountMenuOpen(false); logout(); }}
                                    className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors min-h-[44px] text-left"
                                >
                                    <LogOut className="mr-3 h-4 w-4" /> Sign out
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {mobileSearchOpen && (
                <div className="md:hidden px-3 pb-3 pt-0 border-t border-gray-100 bg-white/95">
                    <SearchWithSuggestions
                        id="topbar-search-mobile"
                        listboxId="topbar-search-mobile-suggestions"
                        mobile
                        placeholder="Search products..."
                        onNavigate={() => setMobileSearchOpen(false)}
                        className="w-full"
                    />
                </div>
            )}
        </div>
    );
}
