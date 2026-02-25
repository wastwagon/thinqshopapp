'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Wallet,
    Send,
    Package,
    ShoppingBag,
    Store,
    User,
    ChevronLeft,
    Menu,
    ShieldCheck,
    History,
    Heart,
    Settings,
    Search,
    Plus,
    Filter,
    Edit3,
    Trash2,
    ChevronRight,
    DollarSign,
    Eye,
    LifeBuoy,
    FolderTree,
    Image as ImageIcon,
    Layout,
    Type,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface SidebarProps {
    isAdmin?: boolean;
    isOpen: boolean;
    toggleSidebar: () => void;
}

export default function Sidebar({ isAdmin, isOpen, toggleSidebar }: SidebarProps) {
    const pathname = usePathname();

    const userLinks = [
        { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Shop', href: '/shop', icon: Store },
        { name: 'Wallet', href: '/dashboard/wallet', icon: Wallet },
        { name: 'Transfers', href: '/dashboard/transfers', icon: Send },
        { name: 'Logistics', href: '/dashboard/logistics', icon: Package },
        { name: 'Procurement', href: '/dashboard/procurement', icon: ShoppingBag },
        { name: 'Wishlist', href: '/wishlist', icon: Heart },
        { name: 'Order History', href: '/dashboard/orders', icon: History },
        { name: 'Support', href: '/dashboard/support', icon: LifeBuoy },
    ];

    const adminLinks = [
        { name: 'Overview', href: '/admin', icon: ShieldCheck },
        { name: 'Content', href: '/admin/content', icon: Layout },
        { name: 'Storefront', href: '/admin/storefront', icon: Type },
        { name: 'Reviews', href: '/admin/reviews', icon: Eye },
        { name: 'Products', href: '/admin/products', icon: Package },
        { name: 'Categories', href: '/admin/categories', icon: FolderTree },
        { name: 'Media', href: '/admin/media', icon: ImageIcon },
        { name: 'Orders', href: '/admin/orders', icon: History },
        { name: 'Shipments', href: '/admin/logistics', icon: Package },
        { name: 'Shipping Rates', href: '/admin/shipping-rates', icon: DollarSign },
        { name: 'Transfers', href: '/admin/transfers', icon: Send },
        { name: 'Procurement', href: '/admin/procurement', icon: ShoppingBag },
        { name: 'Users', href: '/admin/users', icon: User },
        { name: 'Wallet', href: '/admin/wallet', icon: Wallet },
        { name: 'Email templates', href: '/admin/email-templates', icon: Edit3 },
        { name: 'Settings', href: '/admin/settings', icon: Settings },
    ];

    const links = isAdmin ? adminLinks : userLinks;

    return (
        <>
            {/* Mobile: open menu button in safe area (not under notch); min 44px touch target */}
            {!isOpen && (
                <button
                    type="button"
                    onClick={toggleSidebar}
                    className="fixed menu-button-safe z-[60] md:hidden touch-target min-w-[44px] min-h-[44px] bg-white rounded-xl shadow-lg border border-gray-100 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    aria-label="Open navigation menu"
                >
                    <Menu className="h-6 w-6 text-gray-900" aria-hidden />
                </button>
            )}

            <aside
                className={`fixed inset-y-0 left-0 z-40 w-64 max-w-[85vw] bg-white border-r border-gray-100 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'
                    } md:translate-x-0 md:static md:inset-0 md:w-56 md:max-w-none`}
                aria-label="Dashboard navigation"
            >
                <div className="h-full flex flex-col min-h-0">
                    {/* Header: safe area top so close button isn't under notch */}
                    <div className="flex items-center justify-between min-h-16 h-16 px-4 border-b border-gray-50 safe-area-inset-top flex-shrink-0">
                        <Link href="/" className="flex items-center justify-center min-w-0 flex-1 md:flex-initial" aria-label="ThinQShop home">
                            <div className="relative h-10 w-[120px] sm:h-11 sm:w-[140px] md:h-12 md:w-[160px] rounded-lg overflow-hidden shrink-0 bg-white border border-gray-100 shadow-sm">
                                <Image src="/thinqshop-logo.webp" alt="ThinQShop" fill className="object-contain object-left" priority sizes="160px" />
                            </div>
                        </Link>
                        <button
                            type="button"
                            onClick={toggleSidebar}
                            className="md:hidden touch-target min-w-[44px] min-h-[44px] p-3 rounded-xl bg-gray-50 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition-colors"
                            aria-label="Close navigation menu"
                        >
                            <ChevronLeft className="h-5 w-5 text-gray-400" aria-hidden />
                        </button>
                    </div>

                    <nav className="flex-1 overflow-y-auto overflow-touch px-3 py-4 space-y-0.5 custom-scrollbar min-h-0">
                        <p className="px-3 text-[10px] font-semibold text-gray-400 mb-3">Navigation</p>
                        {links.map((link) => {
                            const Icon = link.icon;
                            const isActive = pathname === link.href;
                            return (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    onClick={() => toggleSidebar()}
                                    className={`flex items-center min-h-[44px] px-3 py-3 text-sm font-semibold rounded-xl transition-all group ${isActive
                                        ? 'bg-gray-900 text-white shadow-sm'
                                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                        }`}
                                >
                                    <Icon className={`mr-3 h-4 w-4 shrink-0 transition-transform group-hover:scale-105 ${isActive ? 'text-blue-400' : 'text-gray-400 group-hover:text-blue-600'}`} />
                                    {link.name}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="p-3 border-t border-gray-50 safe-area-inset-bottom flex-shrink-0">
                        <div className="bg-gray-50 px-3 py-2.5 rounded-xl border border-gray-100">
                            <p className="text-[9px] font-semibold text-gray-400 mb-1">Status</p>
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                <span className="text-[10px] font-medium text-gray-700">Connected</span>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}

