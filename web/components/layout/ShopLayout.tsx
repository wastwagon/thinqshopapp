'use client';

import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import MobileBottomNav from './MobileBottomNav';

interface ShopLayoutProps {
    children: React.ReactNode;
}

export default function ShopLayout({ children }: ShopLayoutProps) {
    return (
        <div className="flex flex-col h-screen bg-white relative overflow-hidden min-w-0">
            <Navbar />

            <main id="main-content" className="flex-1 min-h-0 w-full overflow-y-auto overflow-x-hidden overscroll-y-contain relative pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))] md:pb-0" tabIndex={-1} role="main">
                <div className="relative z-10 pt-14 sm:pt-16">
                    {children}
                </div>
                <Footer />
            </main>

            <MobileBottomNav />
        </div>
    );
}
