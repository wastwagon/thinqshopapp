'use client';

import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import { CurrencyProvider } from '@/context/CurrencyContext';
import { Toaster } from 'react-hot-toast';
import CartDrawer from '@/components/ui/CartDrawer';
import AnalyticsProvider from '@/components/analytics/AnalyticsProvider';
import OfflineBanner from '@/components/ui/OfflineBanner';

export default function MainLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <AuthProvider>
                <CurrencyProvider>
                <WishlistProvider>
                <CartProvider>
                    <OfflineBanner />
                    <AnalyticsProvider />
                    <Toaster position="top-right" />
                    <CartDrawer />
                    {children}
                </CartProvider>
                </WishlistProvider>
                </CurrencyProvider>
            </AuthProvider>
        </>
    );
}
