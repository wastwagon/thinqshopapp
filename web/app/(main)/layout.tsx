'use client';

import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import { CurrencyProvider } from '@/context/CurrencyContext';
import { Toaster } from 'react-hot-toast';
import CartDrawer from '@/components/ui/CartDrawer';
import AnalyticsProvider from '@/components/analytics/AnalyticsProvider';
import OfflineBanner from '@/components/ui/OfflineBanner';
import CookieConsent from '@/components/ui/CookieConsent';
import WebViewGoldBridge from '@/components/WebViewGoldBridge';

export default function MainLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <AuthProvider>
                <CurrencyProvider>
                <WishlistProvider>
                <CartProvider>
                    <WebViewGoldBridge />
                    <OfflineBanner />
                    <AnalyticsProvider />
                    <Toaster
                        position="top-center"
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
        </>
    );
}
