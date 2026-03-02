'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import {
    Search,
    User,
    Heart,
    ShoppingCart,
    Instagram,
    Twitter,
    Facebook,
    ChevronDown,
    Camera,
    Monitor,
    Video,
    Mic2,
    Gamepad2,
    Cpu,
    Package,
    Lightbulb,
    Plane,
    Home,
    ArrowRight,
} from 'lucide-react';
import SearchModal from '@/components/ui/SearchModal';
import CurrencySwitcher from '@/components/ui/CurrencySwitcher';
import { useCart } from '@/context/CartContext';
import { STATIC_CATEGORIES } from '@/lib/product-utils';

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
    Camera,
    Monitor,
    Video,
    Mic2,
    Gamepad2,
    Cpu,
    Package,
    Lightbulb,
    Plane,
    Home,
};

const mainNavItems = [
    { href: '/shop', label: 'Shop', mega: true },
    { href: '/track', label: 'Track' },
    { href: '/dashboard/logistics', label: 'Logistics' },
    { href: '/dashboard/transfers', label: 'Transfer' },
    { href: '/dashboard/procurement', label: 'Procurement' },
    { href: '/shop?search=deal', label: 'Offers', highlight: true },
];

export default function Navbar() {
    const pathname = usePathname();
    const { cart, toggleCart } = useCart();
    const [searchOpen, setSearchOpen] = useState(false);
    const [shopMegaOpen, setShopMegaOpen] = useState(false);
    const megaRef = useRef<HTMLDivElement>(null);
    const megaTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const openMega = useCallback(() => {
        if (megaTimeoutRef.current) clearTimeout(megaTimeoutRef.current);
        setShopMegaOpen(true);
    }, []);

    const closeMega = useCallback(() => {
        megaTimeoutRef.current = setTimeout(() => setShopMegaOpen(false), 100);
    }, []);

    const cancelCloseMega = useCallback(() => {
        if (megaTimeoutRef.current) {
            clearTimeout(megaTimeoutRef.current);
            megaTimeoutRef.current = null;
        }
    }, []);

    useEffect(() => () => { if (megaTimeoutRef.current) clearTimeout(megaTimeoutRef.current); }, []);

    const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

    return (
        <nav
            className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100 flex flex-col"
            aria-label="Main navigation"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 w-full flex items-center gap-4 sm:gap-8 lg:gap-4">
                {/* Logo - left, sized to bar height */}
                <Link
                    href="/"
                    className="flex items-center h-full flex-shrink-0 touch-target rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    aria-label="ThinQShop home"
                >
                    <div className="relative h-10 w-[120px] sm:h-11 sm:w-[140px] md:h-12 md:w-[160px] flex items-center justify-center">
                        <Image src="/thinqshop-logo.webp" alt="ThinQShop" fill className="object-contain object-left" priority sizes="160px" />
                    </div>
                </Link>

                {/* Right-aligned: nav, currency, actions */}
                <div className="ml-auto flex items-center gap-2 sm:gap-6 lg:gap-4 min-w-0 flex-shrink">
                {/* Main nav links - desktop only */}
                <div className="hidden lg:flex items-center gap-4 text-xs font-bold text-gray-500 uppercase tracking-wider" role="menubar">
                    {mainNavItems.map((item) =>
                        item.mega ? (
                            <div
                                key={item.href}
                                className="relative"
                                onMouseEnter={openMega}
                                onMouseLeave={closeMega}
                            >
                                <Link
                                    href={item.href}
                                    role="menuitem"
                                    className="py-2 px-1 -mx-1 rounded-lg hover:text-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition-colors inline-flex items-center gap-1"
                                >
                                    {item.label}
                                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${shopMegaOpen ? 'rotate-180' : ''}`} />
                                </Link>
                                {/* Mega menu dropdown */}
                                <div
                                    ref={megaRef}
                                    onMouseEnter={cancelCloseMega}
                                    onMouseLeave={closeMega}
                                    className={`absolute left-0 top-full pt-2 -ml-4 z-50 transition-all duration-200 ease-out ${shopMegaOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}
                                    aria-hidden={!shopMegaOpen}
                                >
                                    <div className="w-[min(90vw,680px)] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                                        <div className="p-6">
                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                                                {STATIC_CATEGORIES.map((cat) => {
                                                    const Icon = CATEGORY_ICONS[cat.icon] ?? Package;
                                                    const slug = cat.slug ?? cat.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
                                                    const isActive = pathname === `/shop/${slug}`;
                                                    return (
                                                        <Link
                                                            key={cat.slug}
                                                            href={`/shop/${slug}`}
                                                            onClick={() => setShopMegaOpen(false)}
                                                            className={`group flex flex-col gap-1.5 p-4 rounded-xl transition-all ${
                                                                isActive
                                                                    ? 'bg-slate-900 text-white'
                                                                    : 'hover:bg-gray-50 text-gray-700 hover:text-gray-900'
                                                            }`}
                                                        >
                                                            <span className={`flex items-center justify-center w-10 h-10 rounded-xl ${
                                                                isActive ? 'bg-white/20' : 'bg-gray-100 group-hover:bg-blue-50'
                                                            }`}>
                                                                <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-gray-600 group-hover:text-blue-600'}`} />
                                                            </span>
                                                            <span className="text-xs font-semibold leading-tight">{cat.name}</span>
                                                            {cat.tagline && (
                                                                <span className={`text-xs ${isActive ? 'text-slate-300' : 'text-gray-400'}`}>{cat.tagline}</span>
                                                            )}
                                                        </Link>
                                                    );
                                                })}
                                            </div>
                                            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                                                <Link
                                                    href="/shop"
                                                    onClick={() => setShopMegaOpen(false)}
                                                    className="text-xs font-semibold text-gray-500 hover:text-blue-600 transition-colors flex items-center gap-1.5"
                                                >
                                                    View all products
                                                    <ArrowRight className="h-3.5 w-3.5" />
                                                </Link>
                                                <Link
                                                    href="/shop?search=deal"
                                                    onClick={() => setShopMegaOpen(false)}
                                                    className="text-xs font-bold text-blue-600 hover:text-blue-700"
                                                >
                                                    Special offers
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <Link
                                key={item.href}
                                href={item.href}
                                role="menuitem"
                                className={`py-2 px-1 -mx-1 rounded-lg hover:text-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition-colors ${item.highlight ? 'text-blue-600 font-extrabold' : ''}`}
                            >
                                {item.label}
                            </Link>
                        )
                    )}
                </div>

                <div className="h-5 w-px bg-gray-200 hidden xl:block flex-shrink-0" aria-hidden />

                {/* Currency switcher - visible on all breakpoints */}
                <CurrencySwitcher />

                <div className="h-5 w-px bg-gray-200 hidden xl:block flex-shrink-0" aria-hidden />

                {/* Social links - desktop */}
                <div className="hidden xl:flex items-center gap-1" role="group" aria-label="Social media">
                    <a href="#" className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" aria-label="Instagram"><Instagram className="h-3.5 w-3.5" /></a>
                    <a href="#" className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" aria-label="Twitter"><Twitter className="h-3.5 w-3.5" /></a>
                    <a href="#" className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" aria-label="Facebook"><Facebook className="h-3.5 w-3.5" /></a>
                </div>

                <div className="h-5 w-px bg-gray-200 hidden xl:block flex-shrink-0" aria-hidden />

                {/* Action icons */}
                <div className="flex items-center gap-1 sm:gap-2 lg:gap-1 shrink-0" role="group" aria-label="Account and cart actions">
                    <Link
                        href="/dashboard"
                        className="touch-target min-w-[44px] min-h-[44px] w-10 h-10 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-100 hover:text-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition-colors"
                        aria-label="Account"
                    >
                        <User className="h-4 w-4 sm:h-4 sm:w-4" aria-hidden />
                    </Link>
                    <Link
                        href="/wishlist"
                        className="touch-target min-w-[44px] min-h-[44px] w-10 h-10 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-100 hover:text-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition-colors"
                        aria-label="Wishlist"
                    >
                        <Heart className="h-4 w-4 sm:h-4 sm:w-4" aria-hidden />
                    </Link>
                    <button
                        type="button"
                        onClick={toggleCart}
                        className="touch-target min-w-[44px] min-h-[44px] w-10 h-10 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-100 hover:text-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition-colors relative"
                        aria-label={`Shopping cart${cartCount > 0 ? `, ${cartCount} items` : ''}`}
                    >
                        <ShoppingCart className="h-4 w-4 sm:h-4 sm:w-4" aria-hidden />
                        {cartCount > 0 && (
                            <span
                                className="absolute top-1 right-1 min-w-[1.25rem] h-5 px-1 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg"
                                aria-hidden
                            >
                                {cartCount > 99 ? '99+' : cartCount}
                            </span>
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={() => setSearchOpen(true)}
                        className="touch-target min-w-[44px] min-h-[44px] w-10 h-10 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-100 hover:text-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition-colors"
                        aria-label="Search products"
                    >
                        <Search className="h-4 w-4 sm:h-4 sm:w-4" aria-hidden />
                    </button>
                </div>
                </div>
            </div>

            <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
        </nav>
    );
}
