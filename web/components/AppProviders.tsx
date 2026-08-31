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
