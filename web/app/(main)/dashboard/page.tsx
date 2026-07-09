'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DashboardContent from '@/components/dashboard/DashboardContent';
import api from '@/lib/axios';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import DashboardWalletCard from '@/components/dashboard/DashboardWalletCard';
import DashboardServiceCard from '@/components/dashboard/DashboardServiceCard';
import DashboardTrustHighlights from '@/components/dashboard/DashboardTrustHighlights';
import { DASHBOARD_SERVICES } from '@/components/dashboard/dashboard-services';

function getDisplayName(user: { first_name?: string; last_name?: string; email?: string } | null) {
    if (!user) return 'there';
    if (user.first_name) return user.first_name;
    if (user.last_name) return user.last_name;
    return user.email?.split('@')[0] || 'there';
}

export default function DashboardPage() {
    const { isAuthenticated, user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [walletBalance, setWalletBalance] = useState('0.00');
    const [balanceHidden, setBalanceHidden] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams(window.location.search);
        if (params.get('error') !== 'admin_required') return;
        toast.error('You need an admin account to access that area.');
        router.replace('/dashboard');
    }, [router]);

    useEffect(() => {
        if (authLoading) return;
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }

        const fetchWallet = async () => {
            try {
                const { data } = await api.get('/finance/wallet');
                setWalletBalance(Number(data.balance_ghs).toFixed(2));
            } catch (error) {
                console.error('Failed to fetch wallet', error);
            } finally {
                setLoading(false);
            }
        };
        fetchWallet();
    }, [isAuthenticated, authLoading, router]);

    if (authLoading || loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[50vh] py-8">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 animate-pulse" />
                        <p className="text-gray-400 text-sm animate-pulse">Loading your dashboard...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <DashboardContent>
                <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                    className="mb-4"
                >
                    <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="min-w-0 flex-1">
                            <h1 className="text-xl font-bold text-gray-900 tracking-tight leading-tight">
                                Hello, {getDisplayName(user)} 👋
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">What would you like to do today?</p>
                        </div>
                        <div className="w-[52%] min-w-[148px] max-w-[220px] shrink-0">
                            <DashboardWalletCard
                                balance={walletBalance}
                                hidden={balanceHidden}
                                onToggleHidden={() => setBalanceHidden((v) => !v)}
                            />
                        </div>
                    </div>
                </motion.section>

                <section aria-label="Main services" className="grid grid-cols-2 gap-3">
                    {DASHBOARD_SERVICES.map((service, index) => (
                        <DashboardServiceCard key={service.title} {...service} index={index} />
                    ))}
                </section>

                <DashboardTrustHighlights />
            </DashboardContent>
        </DashboardLayout>
    );
}
