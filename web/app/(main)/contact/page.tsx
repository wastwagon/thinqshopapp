'use client';

import Link from 'next/link';
import { Mail, MessageSquare, Headphones, Phone } from 'lucide-react';
import ShopLayout from '@/components/layout/ShopLayout';
import PageHeader from '@/components/ui/PageHeader';
import ShopPageShell from '@/components/shop/ShopContent';
import ShopTrustRow from '@/components/shop/ShopTrustRow';

const SUPPORT_PHONE = '+86 183 2070 9024';
const SUPPORT_PHONE_RAW = '+8618320709024';

const CONTACT_CARDS = [
    {
        icon: Phone,
        accent: 'border-l-blue-600',
        iconBg: 'bg-blue-50 text-blue-600',
        title: 'Phone & WhatsApp',
        description: 'Call or message us for quick support.',
        links: [
            { href: `tel:${SUPPORT_PHONE_RAW}`, label: SUPPORT_PHONE },
            { href: `https://wa.me/${SUPPORT_PHONE_RAW.replace(/\+/g, '')}`, label: 'Chat on WhatsApp →', external: true },
        ],
    },
    {
        icon: Mail,
        accent: 'border-l-amber-500',
        iconBg: 'bg-amber-50 text-amber-600',
        title: 'Email',
        description: 'For orders, logistics, and general support.',
        links: [{ href: 'mailto:info@thinqshopping.app', label: 'info@thinqshopping.app' }],
    },
    {
        icon: MessageSquare,
        accent: 'border-l-violet-600',
        iconBg: 'bg-violet-50 text-violet-600',
        title: 'Live chat',
        description: 'Available in your dashboard when logged in.',
        links: [{ href: '/dashboard', label: 'Open Dashboard →' }],
    },
    {
        icon: Headphones,
        accent: 'border-l-emerald-600',
        iconBg: 'bg-emerald-50 text-emerald-600',
        title: 'Help centre',
        description: 'FAQs and guides for shop, track, and logistics.',
        links: [{ href: '/track', label: 'Track & support →' }],
    },
] as const;

export default function ContactPage() {
    return (
        <ShopLayout>
            <div className="bg-white min-h-full pb-8">
                <ShopPageShell wide className="py-8 sm:py-12">
                    <PageHeader
                        title="Contact"
                        subtitle="Get in touch with our team"
                        accent="blue"
                        breadcrumbs={[{ label: 'Contact' }]}
                    />
                    <ShopTrustRow compact />

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-10 mt-6">
                        {CONTACT_CARDS.map(({ icon: Icon, accent, iconBg, title, description, links }) => (
                            <div key={title} className={`flat-card border-l-4 ${accent} p-5`}>
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${iconBg}`}>
                                    <Icon className="h-6 w-6" />
                                </div>
                                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                                <p className="text-sm text-gray-600">{description}</p>
                                {links.map((link) =>
                                    'external' in link && link.external ? (
                                        <a
                                            key={link.label}
                                            href={link.href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 font-medium text-sm hover:text-blue-700 mt-2 block"
                                        >
                                            {link.label}
                                        </a>
                                    ) : link.href.startsWith('mailto:') || link.href.startsWith('tel:') ? (
                                        <a key={link.label} href={link.href} className="text-blue-600 font-medium text-sm hover:text-blue-700 mt-2 block">
                                            {link.label}
                                        </a>
                                    ) : (
                                        <Link key={link.label} href={link.href} className="text-blue-600 font-medium text-sm hover:text-blue-700 mt-2 block">
                                            {link.label}
                                        </Link>
                                    ),
                                )}
                            </div>
                        ))}
                    </div>

                    <p className="text-gray-500 text-sm">
                        We aim to respond to support requests as quickly as possible. For order-specific questions, please include your order number.
                    </p>

                    <div className="mt-8">
                        <Link href="/" className="text-sm font-semibold text-blue-600 hover:text-blue-700">← Back to Home</Link>
                    </div>
                </ShopPageShell>
            </div>
        </ShopLayout>
    );
}
