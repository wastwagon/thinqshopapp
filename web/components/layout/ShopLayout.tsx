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
        <div className="flex flex-col min-h-screen bg-white relative pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))] md:pb-0 overflow-x-hidden min-w-0">
            <Navbar />

            <main id="main-content" className="flex-1 w-full relative" tabIndex={-1}>
                <div className="relative z-10 pt-14 sm:pt-16">
                    {children}
                </div>
            </main>

            <Footer />
            <MobileBottomNav />
        </div>
    );
}
