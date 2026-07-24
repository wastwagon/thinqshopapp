'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DashboardContent from '@/components/dashboard/DashboardContent';
import api from '@/lib/axios';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowUpRight, Plus } from 'lucide-react';
import DashboardWalletBalancePanel from '@/components/dashboard/DashboardWalletBalancePanel';
import DashboardServiceCard from '@/components/dashboard/DashboardServiceCard';
import DashboardTrustHighlights from '@/components/dashboard/DashboardTrustHighlights';
import { DASHBOARD_SERVICES } from '@/components/dashboard/dashboard-services';
import { buttonVariants } from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

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

        const fetchHome = async () => {
            try {
                const { data } = await api.get('/finance/wallet');
                setWalletBalance(Number(data.balance_ghs).toFixed(2));
            } catch (error) {
                console.error('Failed to fetch wallet', error);
            } finally {
                setLoading(false);
            }
        };

        fetchHome();
    }, [isAuthenticated, authLoading, router]);

    if (authLoading || loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[50vh] py-8">
                    <LoadingSpinner label="Loading your dashboard…" />
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
                                Welcome back, {getDisplayName(user)}
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">
                                Manage your wallet and services
                            </p>
                        </div>
                        <div className="hidden sm:flex items-center gap-2 shrink-0">
                            <Link
                                href="/dashboard/wallet"
                                className={buttonVariants({ variant: 'secondary', size: 'sm' })}
                            >
                                <Plus className="h-3.5 w-3.5" aria-hidden />
                                Deposit
                            </Link>
                            <Link
                                href="/dashboard/transfers"
                                className={buttonVariants({ variant: 'primary', size: 'sm' })}
                            >
                                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                                Send
                            </Link>
                        </div>
                    </div>

                    <DashboardWalletBalancePanel
                        label="Available balance"
                        amount={walletBalance}
                        hidden={balanceHidden}
                        onToggleHidden={() => setBalanceHidden((v) => !v)}
                        actions={
                            <>
                                <Link
                                    href="/dashboard/wallet"
                                    className={buttonVariants({
                                        variant: 'secondary',
                                        size: 'sm',
                                        className:
                                            'bg-white/95 text-brand border-0 hover:bg-white shadow-sm',
                                    })}
                                >
                                    <Plus className="h-3.5 w-3.5" aria-hidden />
                                    Deposit
                                </Link>
                                <Link
                                    href="/dashboard/transfers"
                                    className={buttonVariants({
                                        variant: 'secondary',
                                        size: 'sm',
                                        className:
                                            'bg-white/15 text-white border border-white/25 hover:bg-white/25',
                                    })}
                                >
                                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                                    Send
                                </Link>
                            </>
                        }
                    />
                </motion.section>

                <section aria-label="Main services" className="mb-2">
                    <div className="mb-3">
                        <p className="text-xs font-semibold text-gray-500 mb-0.5">Services</p>
                        <h2 className="text-base font-bold text-gray-900">What do you need?</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {DASHBOARD_SERVICES.map((service, index) => (
                            <DashboardServiceCard key={service.title} {...service} index={index} />
                        ))}
                    </div>
                </section>

                <DashboardTrustHighlights />
            </DashboardContent>
        </DashboardLayout>
    );
}
