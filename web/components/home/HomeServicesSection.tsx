'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import DashboardServiceCard from '@/components/dashboard/DashboardServiceCard';
import { DASHBOARD_SERVICES } from '@/components/dashboard/dashboard-services';
import DashboardTrustHighlights from '@/components/dashboard/DashboardTrustHighlights';

function serviceHref(href: string, isAuthenticated: boolean) {
    if (href === '/shop') return '/shop';
    return isAuthenticated ? href : `/login?from=${encodeURIComponent(href)}`;
}

export default function HomeServicesSection() {
    const { user } = useAuth();
    const isAuthenticated = Boolean(user);

    return (
        <section className="py-8 sm:py-10 bg-white border-y border-gray-100/80" aria-labelledby="home-services-heading">
            <div className="max-w-lg mx-auto md:max-w-3xl px-4 sm:px-6">
                <div className="mb-5">
                    <div className="w-10 h-1 rounded-full bg-gradient-to-r from-blue-500 to-blue-700 mb-3" aria-hidden />
                    <h2 id="home-services-heading" className="text-xl font-bold text-gray-900 tracking-tight">
                        All your services in one place
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Ship, source, transfer, and shop — from a single platform
                    </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    {DASHBOARD_SERVICES.map((service, index) => (
                        <DashboardServiceCard
                            key={service.title}
                            {...service}
                            href={serviceHref(service.href, isAuthenticated)}
                            index={index}
                        />
                    ))}
                </div>
                <DashboardTrustHighlights />
                {!isAuthenticated && (
                    <p className="mt-6 text-center text-sm text-gray-500">
                        New here?{' '}
                        <Link href="/register" className="font-semibold text-blue-600 hover:underline">
                            Create an account
                        </Link>
                        {' '}to access logistics, procurement, and transfers.
                    </p>
                )}
            </div>
        </section>
    );
}
