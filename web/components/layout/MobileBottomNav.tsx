'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import {
    Home,
    Truck,
    User,
    Store,
    Heart,
    ShoppingCart,
    Tag,
    Send,
    ShoppingBag,
    Package,
    ScanLine,
    Wallet,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import BarcodeScanner from '@/components/ui/BarcodeScanner';

const dashboardNavItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Logistics', href: '/dashboard/logistics', icon: Truck },
    { name: 'Transfer', href: '/dashboard/transfers', icon: Send },
    { name: 'Sell', href: '/dashboard/sell-for-me', icon: Tag },
    { name: 'Procure', href: '/dashboard/procurement', icon: ShoppingBag },
];

const homeNavItems = [
    { name: 'Home', href: '/dashboard', icon: Home },
    { name: 'Orders', href: '/dashboard/orders', icon: Package },
    { name: 'Wallet', href: '/dashboard/wallet', icon: Wallet },
    { name: 'Profile', href: '/dashboard/profile', icon: User },
];

type MobileBottomNavProps = {
    variant?: 'shop' | 'dashboard' | 'home';
};

function NavShell({ children, elevated }: { children: React.ReactNode; elevated?: boolean }) {
    return (
        <nav
            aria-label="Mobile navigation"
            className={`fixed bottom-0 left-0 right-0 z-[100] md:hidden bg-white/95 backdrop-blur-xl border-t border-gray-200/90 ${elevated ? 'shadow-[0_-4px_24px_-8px_rgba(0,0,0,0.12)]' : ''}`}
        >
            <div className="flex items-end justify-between px-1 sm:px-2 pt-1 pb-[calc(0.35rem+env(safe-area-inset-bottom,0px))]">
                {children}
            </div>
        </nav>
    );
}

function NavLink({
    name,
    href,
    icon: Icon,
    isActive,
}: {
    name: string;
    href: string;
    icon: LucideIcon;
    isActive: boolean;
}) {
    return (
        <Link
            href={href}
            className="relative flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 py-1 px-0.5 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 min-h-[44px]"
            aria-label={name}
            aria-current={isActive ? 'page' : undefined}
        >
            <Icon
                className={`h-[22px] w-[22px] shrink-0 transition-colors ${isActive ? 'text-blue-600' : 'text-gray-400'}`}
                strokeWidth={isActive ? 2.25 : 1.75}
                aria-hidden
            />
            <span
                className={`text-[10px] font-medium leading-tight text-center w-full truncate ${
                    isActive ? 'text-blue-600' : 'text-gray-500'
                }`}
            >
                {name}
            </span>
        </Link>
    );
}

function ShopBottomNav() {
    const pathname = usePathname();
    const { itemCount, toggleCart, isCartOpen } = useCart();
    const { user } = useAuth();

    const accountHref = user ? '/dashboard' : '/login?from=/dashboard';
    const isShopActive =
        pathname === '/shop' ||
        pathname?.startsWith('/shop/') ||
        pathname?.startsWith('/products/');
    const isCartActive = isCartOpen;
    const isWishlistActive = pathname === '/wishlist';
    const isAccountActive =
        pathname === '/dashboard' ||
        pathname === '/dashboard/account' ||
        pathname?.startsWith('/dashboard/profile');

    return (
        <NavShell>
            <NavLink name="Home" href="/" icon={Home} isActive={pathname === '/'} />
            <NavLink name="Shop" href="/shop" icon={Store} isActive={isShopActive} />
            <button
                type="button"
                onClick={toggleCart}
                className="relative flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 py-1 px-0.5 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 min-h-[44px]"
                aria-label={itemCount > 0 ? `Cart, ${itemCount} items` : 'Cart'}
                aria-expanded={isCartOpen}
            >
                <ShoppingCart
                    className={`h-[22px] w-[22px] shrink-0 transition-colors ${isCartActive ? 'text-blue-600' : 'text-gray-400'}`}
                    strokeWidth={isCartActive ? 2.25 : 1.75}
                    aria-hidden
                />
                {itemCount > 0 && (
                    <span className="absolute top-0.5 right-1/2 translate-x-3 min-w-[16px] h-4 px-1 flex items-center justify-center bg-blue-600 text-white text-[10px] font-bold rounded-full">
                        {itemCount > 9 ? '9+' : itemCount}
                    </span>
                )}
                <span
                    className={`text-xs font-medium leading-tight text-center w-full truncate ${
                        isCartActive ? 'text-blue-600' : 'text-gray-500'
                    }`}
                >
                    Cart
                </span>
            </button>
            <NavLink name="Wishlist" href="/wishlist" icon={Heart} isActive={isWishlistActive} />
            <NavLink name="Account" href={accountHref} icon={User} isActive={isAccountActive} />
        </NavShell>
    );
}

function HomeBottomNav() {
    const pathname = usePathname();
    const router = useRouter();
    const [scannerOpen, setScannerOpen] = useState(false);

    const leftItems = homeNavItems.slice(0, 2);
    const rightItems = homeNavItems.slice(2);

    return (
        <>
            <NavShell elevated>
                {leftItems.map((item) => {
                    const isActive =
                        pathname === item.href ||
                        (item.href !== '/dashboard' && pathname?.startsWith(item.href));
                    return (
                        <NavLink
                            key={item.name}
                            name={item.name}
                            href={item.href}
                            icon={item.icon}
                            isActive={!!isActive}
                        />
                    );
                })}
                <div className="flex flex-col items-center justify-end flex-1 -mt-5 px-0.5">
                    <button
                        type="button"
                        onClick={() => setScannerOpen(true)}
                        className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center shadow-[0_8px_24px_-4px_rgba(37,99,235,0.55)] hover:scale-105 active:scale-95 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                        aria-label="Scan barcode"
                    >
                        <ScanLine className="h-6 w-6" strokeWidth={2.25} />
                    </button>
                    <span className="text-[10px] font-medium text-gray-500 mt-1">Scan</span>
                </div>
                {rightItems.map((item) => {
                    const isActive =
                        pathname === item.href || pathname?.startsWith(item.href);
                    return (
                        <NavLink
                            key={item.name}
                            name={item.name}
                            href={item.href}
                            icon={item.icon}
                            isActive={!!isActive}
                        />
                    );
                })}
            </NavShell>
            <BarcodeScanner
                open={scannerOpen}
                onClose={() => setScannerOpen(false)}
                onScan={(value) => {
                    setScannerOpen(false);
                    router.push(`/track?n=${encodeURIComponent(value.trim())}`);
                }}
            />
        </>
    );
}

function DashboardBottomNav() {
    const pathname = usePathname();

    return (
        <NavShell>
            {dashboardNavItems.map((item) => {
                const isActive =
                    pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
                return (
                    <NavLink
                        key={item.name}
                        name={item.name}
                        href={item.href}
                        icon={item.icon}
                        isActive={!!isActive}
                    />
                );
            })}
        </NavShell>
    );
}

export default function MobileBottomNav({ variant = 'dashboard' }: MobileBottomNavProps) {
    if (variant === 'shop') {
        return <ShopBottomNav />;
    }
    if (variant === 'home') {
        return <HomeBottomNav />;
    }
    return <DashboardBottomNav />;
}
