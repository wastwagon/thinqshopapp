'use client';

import dynamic from 'next/dynamic';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import { CurrencyProvider } from '@/context/CurrencyContext';
import { Toaster } from 'react-hot-toast';
import AnalyticsProvider from '@/components/analytics/AnalyticsProvider';
import OfflineBanner from '@/components/ui/OfflineBanner';

const CartDrawer = dynamic(() => import('@/components/ui/CartDrawer'), { ssr: false });
const CookieConsent = dynamic(() => import('@/components/ui/CookieConsent'), { ssr: false });

export default function AppProviders({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <CurrencyProvider>
                <WishlistProvider>
                    <CartProvider>
                        <OfflineBanner />
                        <AnalyticsProvider />
                        <Toaster
                            position="top-center"
                            containerStyle={{
                                top: 'calc(12px + var(--app-sat, env(safe-area-inset-top, 0px)))',
                            }}
                            toastOptions={{
                                className: '!bg-white !text-gray-900 !text-sm !font-medium !rounded-xl !border !border-gray-200/90 !shadow-none',
                                duration: 3500,
                            }}
                        />
                        <CartDrawer />
                        <CookieConsent />
                        {children}
                    </CartProvider>
                </WishlistProvider>
            </CurrencyProvider>
        </AuthProvider>
    );
}
