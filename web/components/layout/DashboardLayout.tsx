'use client';

import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import MobileBottomNav from './MobileBottomNav';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

interface DashboardLayoutProps {
    children: React.ReactNode;
    isAdmin?: boolean;
}

export default function DashboardLayout({ children, isAdmin }: DashboardLayoutProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { user, loading } = useAuth();
    const router = useRouter();

    // Protection logic
    React.useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        } else if (!loading && isAdmin && user?.role !== 'admin' && user?.role !== 'superadmin') {
            router.push('/dashboard');
        }
    }, [user, loading, isAdmin, router]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-app text-gray-500">
                <div className="flex flex-col items-center gap-6">
                    <div className="w-16 h-16 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-center animate-pulse">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center animate-spin">
                            <div className="w-2 h-2 bg-white rounded-full" />
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 animate-pulse">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return null; // Let the useEffect handle redirection
    }

    const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
    const premiumShell = !isAdmin;

    return (
        <div className={`app-shell flex h-screen overflow-hidden font-sans text-gray-900 relative ${premiumShell ? 'bg-white' : 'bg-app'}`}>
            <Sidebar
                isAdmin={isAdmin}
                isOpen={isSidebarOpen}
                toggleSidebar={toggleSidebar}
            />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative safe-area-inset-top">
                <Topbar onMenuPress={toggleSidebar} variant={premiumShell ? 'dashboard-home' : 'default'} />

                <main id="main-content" className={`flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin p-3 md:p-6 relative z-10 safe-area-inset-bottom min-w-0 md:pb-6 ${isAdmin ? 'pb-[calc(10rem+env(safe-area-inset-bottom,0px))]' : 'pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))]'} ${premiumShell ? 'bg-white' : ''}`} tabIndex={-1} role="main">
                    <div className={`max-w-7xl mx-auto min-w-0 w-full ${premiumShell ? '' : 'space-y-4 md:space-y-6'}`}>
                        {children}
                    </div>
                </main>
            </div>

            {/* Mobile overlay: tap outside to close sidebar; stays behind sidebar (z-40) */}
            {isSidebarOpen && (
                <button
                    type="button"
                    className="fixed inset-0 z-[35] bg-black/20 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                    aria-label="Close menu"
                />
            )}

            <MobileBottomNav variant={isAdmin ? 'dashboard' : 'home'} />
        </div>
    );
}

