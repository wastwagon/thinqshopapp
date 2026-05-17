'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import {
    Home,
    Truck,
    ShoppingBag,
    User,
    Send,
    Store,
    Heart,
    ShoppingCart,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';

const dashboardNavItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Logistics', href: '/dashboard/logistics', icon: Truck },
    { name: 'Procure', href: '/dashboard/procurement', icon: ShoppingBag },
    { name: 'Transfers', href: '/dashboard/transfers', icon: Send },
    { name: 'Account', href: '/dashboard/account', icon: User },
];

type MobileBottomNavProps = {
    variant?: 'shop' | 'dashboard';
};

function NavShell({ children }: { children: React.ReactNode }) {
    return (
        <nav
            aria-label="Mobile navigation"
            className="fixed bottom-0 left-0 right-0 z-[100] md:hidden bg-white/92 backdrop-blur-xl border-t border-gray-200/90"
        >
            <div className="flex items-center justify-between px-0.5 sm:px-2 pt-1 pb-[calc(0.35rem+env(safe-area-inset-bottom,0px))]">
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
            className="relative flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 py-1 px-0.5 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 min-h-[44px]"
            aria-label={name}
            aria-current={isActive ? 'page' : undefined}
        >
            <Icon
                className={`h-[22px] w-[22px] shrink-0 transition-colors ${isActive ? 'text-brand' : 'text-gray-400'}`}
                strokeWidth={isActive ? 2.25 : 1.75}
                aria-hidden
            />
            <span
                className={`text-xs font-medium leading-tight text-center w-full truncate ${
                    isActive ? 'text-brand' : 'text-gray-500'
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

    const accountHref = user ? '/dashboard/account' : '/login?from=/dashboard/account';

    const isShopActive =
        pathname === '/shop' ||
        pathname?.startsWith('/shop/') ||
        pathname?.startsWith('/products/');
    const isCartActive = isCartOpen;
    const isWishlistActive = pathname === '/wishlist';
    const isAccountActive =
        pathname === '/dashboard/account' || pathname?.startsWith('/dashboard/profile');

    return (
        <NavShell>
            <NavLink name="Home" href="/" icon={Home} isActive={pathname === '/'} />
            <NavLink name="Shop" href="/shop" icon={Store} isActive={isShopActive} />
            <button
                type="button"
                onClick={toggleCart}
                className="relative flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 py-1 px-0.5 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 min-h-[44px]"
                aria-label={itemCount > 0 ? `Cart, ${itemCount} items` : 'Cart'}
                aria-expanded={isCartOpen}
            >
                <ShoppingCart
                    className={`h-[22px] w-[22px] shrink-0 transition-colors ${isCartActive ? 'text-brand' : 'text-gray-400'}`}
                    strokeWidth={isCartActive ? 2.25 : 1.75}
                    aria-hidden
                />
                {itemCount > 0 && (
                    <span className="absolute top-0.5 right-1/2 translate-x-3 min-w-[16px] h-4 px-1 flex items-center justify-center bg-brand text-white text-[10px] font-bold rounded-full">
                        {itemCount > 9 ? '9+' : itemCount}
                    </span>
                )}
                <span
                    className={`text-xs font-medium leading-tight text-center w-full truncate ${
                        isCartActive ? 'text-brand' : 'text-gray-500'
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
    return <DashboardBottomNav />;
}
