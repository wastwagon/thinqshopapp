'use client';

import Link from 'next/link';
import { Target, Globe, Truck, Zap, Tag } from 'lucide-react';
import ShopLayout from '@/components/layout/ShopLayout';
import PageHeader from '@/components/ui/PageHeader';
import ShopPageShell from '@/components/shop/ShopContent';
import ShopTrustRow from '@/components/shop/ShopTrustRow';

const OFFERINGS = [
    { icon: Zap, accent: 'bg-amber-50 text-amber-600', title: 'Shop', text: 'Electronics and tech, vetted and delivered. Items ship internationally with 7–14 day estimated delivery.' },
    { icon: Truck, accent: 'bg-blue-50 text-blue-600', title: 'Digital Logistics', text: 'Ship and track packages and freight with transparency and reliability.' },
    { icon: Globe, accent: 'bg-violet-50 text-violet-600', title: 'Money Transfer', text: 'Send to and receive from China and other corridors with secure, traceable transfers.' },
    { icon: Target, accent: 'bg-emerald-50 text-emerald-600', title: 'Tech Sourcing', text: 'Custom procurement and sourcing for businesses and professionals.' },
    { icon: Tag, accent: 'bg-orange-50 text-orange-600', title: 'Sell for Me', text: "List items you can't sell yourself; we list, sell, and pay you via your wallet." },
] as const;

export default function AboutPage() {
    return (
        <ShopLayout>
            <div className="bg-white min-h-full pb-8">
                <ShopPageShell wide className="py-8 sm:py-12">
                    <PageHeader
                        title="About us"
                        subtitle="Who we are and what we stand for"
                        accent="blue"
                        breadcrumbs={[{ label: 'About' }]}
                    />
                    <ShopTrustRow compact />

                    <div className="flat-card border-l-4 border-l-blue-600 p-6 sm:p-8 max-w-none text-gray-600 mt-6">
                        <p className="text-gray-600 leading-relaxed mb-8">
                            ThinQShop serves the high-end electronics market in West Africa. We source from global tech leaders and deliver with professional service—so you get the devices you need, when and where you need them.
                        </p>

                        <h2 className="text-base font-semibold text-gray-900 mt-10 mb-4">Our Mission</h2>
                        <p className="text-gray-600 leading-relaxed mb-6">
                            We bridge the gap between global technology and West African businesses and consumers. By combining e-commerce, digital logistics, money transfer, and tech sourcing in one platform, we make it simple to shop, ship, and source.
                        </p>

                        <h2 className="text-base font-semibold text-gray-900 mt-10 mb-4">What We Offer</h2>
                        <ul className="space-y-4 text-gray-600 mb-10">
                            {OFFERINGS.map(({ icon: Icon, accent, title, text }) => (
                                <li key={title} className="flex items-start gap-3">
                                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${accent}`}>
                                        <Icon className="h-4 w-4" />
                                    </span>
                                    <span><strong className="text-gray-900">{title}</strong> — {text}</span>
                                </li>
                            ))}
                        </ul>

                        <h2 className="text-base font-semibold text-gray-900 mt-10 mb-4">Why ThinQShop</h2>
                        <p className="text-gray-600 leading-relaxed mb-6">
                            We focus on quality, transparency, and service. From order placement to delivery and support, we aim to meet the standards that serious buyers and businesses expect. Our platform is built to scale with you as you grow.
                        </p>

                        <div className="flex flex-wrap gap-4 mt-12">
                            <Link href="/shop" className="inline-flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">
                                Shop now
                            </Link>
                            <Link href="/contact" className="inline-flex items-center gap-2 px-5 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">
                                Contact us
                            </Link>
                        </div>
                    </div>
                </ShopPageShell>
            </div>
        </ShopLayout>
    );
}
