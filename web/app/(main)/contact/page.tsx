'use client';

import Link from 'next/link';
import { Mail, MessageSquare, Headphones, Phone } from 'lucide-react';
import ShopLayout from '@/components/layout/ShopLayout';
import PageHeader from '@/components/ui/PageHeader';

const SUPPORT_PHONE = '+86 183 2070 9024';
const SUPPORT_PHONE_RAW = '+8618320709024';

export default function ContactPage() {
    return (
        <ShopLayout>
            <div className="max-w-4xl mx-auto px-6 py-12">
                <PageHeader
                    title="Contact Support"
                    subtitle="Get in touch with our team"
                    breadcrumbs={[{ label: 'Contact' }]}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                    <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-brand/20 transition-shadow">
                        <div className="w-12 h-12 rounded-xl bg-brand/10 ring-1 ring-brand/15 flex items-center justify-center mb-4">
                            <Phone className="h-6 w-6 text-brand" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">Phone & WhatsApp</h3>
                        <p className="text-sm text-gray-600">Call or message us for quick support.</p>
                        <a href={`tel:${SUPPORT_PHONE_RAW}`} className="text-brand font-medium text-sm hover:text-brand/90 mt-2 inline-block">+86 183 2070 9024</a>
                        <span className="block mt-1">
                            <a href={`https://wa.me/${SUPPORT_PHONE_RAW.replace(/\+/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-brand font-medium text-sm hover:text-brand/90">Chat on WhatsApp →</a>
                        </span>
                    </div>
                    <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-brand/20 transition-shadow">
                        <div className="w-12 h-12 rounded-xl bg-brand/10 ring-1 ring-brand/15 flex items-center justify-center mb-4">
                            <Mail className="h-6 w-6 text-brand" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">Email</h3>
                        <p className="text-sm text-gray-600">For orders, logistics, and general support.</p>
                        <a href="mailto:info@thinqshopping.app" className="text-brand font-medium text-sm hover:text-brand/90 mt-2 inline-block">info@thinqshopping.app</a>
                    </div>
                    <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-brand/20 transition-shadow">
                        <div className="w-12 h-12 rounded-xl bg-brand/10 ring-1 ring-brand/15 flex items-center justify-center mb-4">
                            <MessageSquare className="h-6 w-6 text-brand" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">Live chat</h3>
                        <p className="text-sm text-gray-600">Available in your dashboard when logged in.</p>
                        <Link href="/dashboard" className="text-brand font-medium text-sm hover:text-brand/90 mt-2 inline-block">Open Dashboard →</Link>
                    </div>
                    <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-brand/20 transition-shadow">
                        <div className="w-12 h-12 rounded-xl bg-brand/10 ring-1 ring-brand/15 flex items-center justify-center mb-4">
                            <Headphones className="h-6 w-6 text-brand" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">Help centre</h3>
                        <p className="text-sm text-gray-600">FAQs and guides for shop, track, and logistics.</p>
                        <Link href="/track" className="text-brand font-medium text-sm hover:text-brand/90 mt-2 inline-block">Track & support →</Link>
                    </div>
                </div>

                <p className="text-gray-500 text-sm">
                    We aim to respond to support requests as quickly as possible. For order-specific questions, please include your order number.
                </p>

                <div className="mt-8">
                    <Link href="/" className="text-sm font-medium text-brand hover:text-brand/90">← Back to Home</Link>
                </div>
            </div>
        </ShopLayout>
    );
}
