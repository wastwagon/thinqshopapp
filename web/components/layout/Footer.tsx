'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
    Instagram,
    Twitter,
    Facebook,
    ShieldCheck
} from 'lucide-react';

export default function Footer() {
    return (
        <footer className="py-24 bg-gray-50 border-t border-gray-200">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-20">
                    <div className="md:col-span-2">
                        <Link href="/" className="inline-flex items-center mb-8">
                            <div className="relative h-10 w-[120px] sm:h-11 sm:w-[140px] flex-shrink-0">
                                <Image src="/thinqshop-logo.webp" alt="ThinQShop" fill className="object-contain object-left" sizes="140px" />
                            </div>
                        </Link>
                        <p className="text-gray-500 max-w-sm mb-10 leading-relaxed font-medium">
                            Redefining the high-end electronics market in West Africa.
                            Sourced from global tech leaders, delivered with professional excellence.
                        </p>
                        <div className="flex gap-4">
                            {[Instagram, Twitter, Facebook].map((Icon, idx) => (
                                <Link key={idx} href="#" className="h-10 w-10 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-blue-600 hover:border-blue-600 transition-all group">
                                    <Icon className="h-4 w-4 group-hover:scale-110 transition-transform" />
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h4 className="font-bold mb-8 text-xs uppercase tracking-widest text-gray-400">Services</h4>
                        <ul className="space-y-4 text-sm font-semibold text-gray-600">
                            <li><Link href="/shop" className="hover:text-blue-600 transition-colors">Shop</Link></li>
                            <li><Link href="/dashboard/logistics" className="hover:text-blue-600 transition-colors">Digital Logistics</Link></li>
                            <li><Link href="/track" className="hover:text-blue-600 transition-colors">Order Tracking</Link></li>
                            <li><Link href="/dashboard/procurement" className="hover:text-blue-600 transition-colors">Tech Sourcing</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold mb-8 text-xs uppercase tracking-widest text-gray-400">Company</h4>
                        <ul className="space-y-4 text-sm font-semibold text-gray-600">
                            <li><Link href="/about" className="hover:text-blue-600 transition-colors">About Us</Link></li>
                            <li><Link href="/terms" className="hover:text-blue-600 transition-colors">Terms & Conditions</Link></li>
                            <li><Link href="/privacy" className="hover:text-blue-600 transition-colors">Privacy Policy</Link></li>
                            <li><Link href="/contact" className="hover:text-blue-600 transition-colors">Contact Support</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="pt-12 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-8">
                    <p className="text-xs font-medium text-gray-400">© 2026 ThinQShop Global. All rights reserved.</p>
                    <div className="flex items-center gap-3 py-2 px-5 bg-white border border-gray-100 rounded-full">
                        <ShieldCheck className="h-4 w-4 text-green-500" />
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Secure Shop Environment</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
