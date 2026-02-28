'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
    Instagram,
    Twitter,
    Facebook,
    ShieldCheck,
} from 'lucide-react';
import api from '@/lib/axios';

const DEFAULT_SUPPORT_PHONE = '+86 183 2070 9024';
const DEFAULT_SUPPORT_EMAIL = 'info@thinqshopping.app';

export default function Footer() {
    const [settings, setSettings] = useState<Record<string, string>>({});

    useEffect(() => {
        api.get('/content/settings/public').then((res) => setSettings(res.data || {})).catch(() => {});
    }, []);

    const supportPhone = settings.support_phone?.trim() || DEFAULT_SUPPORT_PHONE;
    const supportEmail = settings.support_email?.trim() || DEFAULT_SUPPORT_EMAIL;
    const ordersDelivered = settings.site_orders_delivered_text?.trim();

    return (
        <footer className="py-16 sm:py-24 bg-gray-50 border-t border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 sm:gap-16 mb-12 sm:mb-20">
                    <div className="md:col-span-2">
                        <Link href="/" className="inline-flex items-center mb-6 sm:mb-8">
                            <div className="relative h-10 w-[120px] sm:h-11 sm:w-[140px] flex-shrink-0">
                                <Image src="/thinqshop-logo.webp" alt="ThinQShop" fill className="object-contain object-left" sizes="140px" />
                            </div>
                        </Link>
                        <p className="text-gray-500 max-w-sm mb-6 sm:mb-10 leading-relaxed font-medium text-sm sm:text-base">
                            High-end electronics and services for West Africa.
                            Sourced from global tech leaders, delivered with professional excellence.
                        </p>
                        {ordersDelivered && (
                            <p className="text-xs font-semibold text-gray-600 mb-4">{ordersDelivered}</p>
                        )}
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
                        <div className="mt-4 text-xs text-gray-600 space-y-1">
                            <p><a href={`tel:${supportPhone.replace(/\s/g, '')}`} className="hover:text-blue-600">{supportPhone}</a></p>
                            <p><a href={`mailto:${supportEmail}`} className="hover:text-blue-600">{supportEmail}</a></p>
                        </div>
                    </div>
                </div>

                <div className="pt-8 sm:pt-12 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-6 sm:gap-8">
                    <p className="text-xs font-medium text-gray-400 text-center md:text-left">© 2026 ThinQShop Global. All rights reserved.</p>
                    <div className="flex items-center gap-3 py-2 px-5 bg-white border border-gray-100 rounded-full">
                        <ShieldCheck className="h-4 w-4 text-green-500" />
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Secure Shop Environment</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
