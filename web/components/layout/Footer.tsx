'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
    Instagram,
    Twitter,
    Facebook,
    ShieldCheck,
    Phone,
    Mail,
    ArrowRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/axios';

const DEFAULT_SUPPORT_PHONE = '+86 183 2070 9024';
const DEFAULT_SUPPORT_EMAIL = 'info@thinqshopping.app';
const SOCIAL_LINKS = [
    { label: 'Instagram', href: process.env.NEXT_PUBLIC_INSTAGRAM_URL, Icon: Instagram },
    { label: 'Twitter', href: process.env.NEXT_PUBLIC_TWITTER_URL, Icon: Twitter },
    { label: 'Facebook', href: process.env.NEXT_PUBLIC_FACEBOOK_URL, Icon: Facebook },
].filter((item) => !!item.href);

export default function Footer() {
    const [settings, setSettings] = useState<Record<string, string>>({});
    const [email, setEmail] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const ac = new AbortController();
        api
            .get('/content/settings/public', { signal: ac.signal })
            .then((res) => setSettings(res.data || {}))
            .catch(() => {});
        return () => ac.abort();
    }, []);

    const supportPhone = settings.support_phone?.trim() || DEFAULT_SUPPORT_PHONE;
    const supportEmail = settings.support_email?.trim() || DEFAULT_SUPPORT_EMAIL;
    const ordersDelivered = settings.site_orders_delivered_text?.trim();

    const handleSubscribe = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = email.trim();
        if (!trimmed) {
            toast.error('Please enter your email address');
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
            toast.error('Please enter a valid email');
            return;
        }
        setSubmitting(true);
        try {
            await api.post('/content/newsletter/signup', { email: trimmed });
            toast.success('Thanks — you’re on the list.');
            setEmail('');
        } catch (err: unknown) {
            const ax = err as { response?: { data?: { message?: string | string[] } } };
            const msg = ax.response?.data?.message;
            if (Array.isArray(msg)) {
                toast.error(String(msg[0] || 'Invalid email'));
            } else if (typeof msg === 'string') {
                toast.error(msg);
            } else {
                toast.error('Could not subscribe. Try again later.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <footer className="relative overflow-hidden border-t border-gray-200/80 bg-gradient-to-b from-slate-50 via-white to-slate-100/90">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(249,115,22,0.06),transparent)]" aria-hidden />
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-10 xl:gap-14 mb-14 sm:mb-16">
                    {/* Column 1 — Brand */}
                    <div className="sm:col-span-2 lg:col-span-1">
                        <Link href="/" className="inline-flex items-center mb-6">
                            <div className="relative h-10 w-[120px] sm:h-11 sm:w-[140px] flex-shrink-0">
                                <Image src="/thinqshop-logo.webp" alt="ThinQShop" fill className="object-contain object-left" sizes="140px" />
                            </div>
                        </Link>
                        <p className="text-gray-600 max-w-xs mb-6 leading-relaxed text-sm font-medium">
                            High-end electronics and services for West Africa.
                            Sourced from global tech leaders, delivered with professional excellence.
                        </p>
                        {ordersDelivered && (
                            <p className="text-xs font-semibold tracking-wide text-gray-500 mb-6">{ordersDelivered}</p>
                        )}
                        {SOCIAL_LINKS.length > 0 && (
                            <div className="flex gap-3">
                                {SOCIAL_LINKS.map(({ label, href, Icon }) => (
                                    <a
                                        key={label}
                                        href={href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="min-h-[44px] min-w-[44px] h-11 w-11 rounded-full border border-gray-200/90 bg-white/90 shadow-sm flex items-center justify-center text-gray-500 hover:text-brand hover:border-brand/40 hover:shadow-md transition-all"
                                        aria-label={`Follow us on ${label}`}
                                    >
                                        <Icon className="h-4 w-4" />
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Column 2 — Services */}
                    <div>
                        <h4 className="font-semibold mb-5 text-[11px] uppercase tracking-[0.2em] text-gray-400">Services</h4>
                        <ul className="space-y-3.5 text-sm font-medium text-gray-700">
                            <li><Link href="/shop" className="hover:text-brand transition-colors inline-block">Shop</Link></li>
                            <li><Link href="/dashboard/logistics" className="hover:text-brand transition-colors inline-block">Digital Logistics</Link></li>
                            <li><Link href="/track" className="hover:text-brand transition-colors inline-block">Order Tracking</Link></li>
                            <li><Link href="/dashboard/procurement" className="hover:text-brand transition-colors inline-block">Tech Sourcing</Link></li>
                        </ul>
                    </div>

                    {/* Column 3 — Company */}
                    <div>
                        <h4 className="font-semibold mb-5 text-[11px] uppercase tracking-[0.2em] text-gray-400">Company</h4>
                        <ul className="space-y-3.5 text-sm font-medium text-gray-700">
                            <li><Link href="/about" className="hover:text-brand transition-colors inline-block">About Us</Link></li>
                            <li><Link href="/terms" className="hover:text-brand transition-colors inline-block">Terms & Conditions</Link></li>
                            <li><Link href="/privacy" className="hover:text-brand transition-colors inline-block">Privacy Policy</Link></li>
                            <li><Link href="/contact" className="hover:text-brand transition-colors inline-block">Contact Support</Link></li>
                        </ul>
                    </div>

                    {/* Column 4 — Contact + newsletter */}
                    <div className="sm:col-span-2 lg:col-span-1">
                        <div className="rounded-2xl border border-gray-200/90 bg-white/80 p-6 sm:p-7 shadow-[0_1px_0_0_rgba(255,255,255,0.8)_inset,0_8px_32px_-8px_rgba(15,23,42,0.08)] backdrop-blur-sm">
                            <h4 className="font-semibold mb-5 text-[11px] uppercase tracking-[0.2em] text-gray-400">Contact</h4>
                            <ul className="space-y-4 mb-8">
                                <li>
                                    <a
                                        href={`tel:${supportPhone.replace(/\s/g, '')}`}
                                        className="group flex items-start gap-3 text-sm font-medium text-gray-800 hover:text-brand transition-colors"
                                    >
                                        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 text-gray-600 ring-1 ring-gray-200/80 group-hover:ring-brand/25 group-hover:text-brand">
                                            <Phone className="h-4 w-4" aria-hidden />
                                        </span>
                                        <span className="leading-snug pt-1">{supportPhone}</span>
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href={`mailto:${supportEmail}`}
                                        className="group flex items-start gap-3 text-sm font-medium text-gray-800 hover:text-brand transition-colors break-all"
                                    >
                                        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 text-gray-600 ring-1 ring-gray-200/80 group-hover:ring-brand/25 group-hover:text-brand">
                                            <Mail className="h-4 w-4" aria-hidden />
                                        </span>
                                        <span className="leading-snug pt-1">{supportEmail}</span>
                                    </a>
                                </li>
                            </ul>

                            <div className="border-t border-gray-100 pt-6" role="region" aria-labelledby="footer-newsletter-heading">
                                <p id="footer-newsletter-heading" className="text-sm font-semibold text-gray-900 mb-1">
                                    Stay in the loop
                                </p>
                                <p id="footer-newsletter-hint" className="text-xs text-gray-500 mb-4 leading-relaxed">
                                    Product drops and offers — no spam.
                                </p>
                                <form onSubmit={handleSubscribe} className="flex flex-col gap-3" noValidate>
                                    <label htmlFor="footer-subscribe-email" className="sr-only">
                                        Email for newsletter
                                    </label>
                                    <input
                                        id="footer-subscribe-email"
                                        type="email"
                                        autoComplete="email"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        aria-describedby="footer-newsletter-hint"
                                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 shadow-inner focus:border-brand/50 focus:outline-none focus:ring-2 focus:ring-brand/20"
                                    />
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        aria-busy={submitting}
                                        aria-label={submitting ? 'Subscribing, please wait' : 'Subscribe to product updates'}
                                        className="inline-flex min-h-[44px] w-auto shrink-0 items-center justify-center gap-1.5 self-start rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 px-3 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/15 transition-all hover:from-brand hover:to-brand/95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:opacity-60 sm:w-full sm:gap-2 sm:self-stretch sm:px-4"
                                    >
                                        {submitting ? '…' : 'Subscribe'}
                                        <ArrowRight className="h-4 w-4" aria-hidden />
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 pt-10 border-t border-gray-200/90">
                    <p className="text-xs font-medium text-gray-400 text-center md:text-left order-2 md:order-1">© 2026 ThinQShop Global. All rights reserved.</p>
                    <div className="flex justify-center md:justify-end order-1 md:order-2">
                        <div className="inline-flex items-center gap-2.5 rounded-full border border-gray-200/90 bg-white/90 px-5 py-2.5 shadow-sm">
                            <ShieldCheck className="h-4 w-4 text-brand shrink-0" aria-hidden />
                            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-600">Secure shop environment</span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
