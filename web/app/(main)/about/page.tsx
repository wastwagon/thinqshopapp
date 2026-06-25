'use client';

import Link from 'next/link';
import { Target, Globe, Truck, Zap, Tag } from 'lucide-react';
import ShopLayout from '@/components/layout/ShopLayout';
import PageHeader from '@/components/ui/PageHeader';

export default function AboutPage() {
    return (
        <ShopLayout>
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
                <PageHeader
                    title="About us"
                    subtitle="Who we are and what we stand for"
                    breadcrumbs={[{ label: 'About' }]}
                />

                <div className="flat-card p-6 sm:p-8 max-w-none text-gray-600">
                    <p className="text-gray-600 leading-relaxed mb-8">
                        ThinQShop serves the high-end electronics market in West Africa. We source from global tech leaders and deliver with professional service—so you get the devices you need, when and where you need them.
                    </p>

                    <h2 className="text-base font-semibold text-gray-900 mt-10 mb-4">Our Mission</h2>
                    <p className="text-gray-600 leading-relaxed mb-6">
                        We bridge the gap between global technology and West African businesses and consumers. By combining e-commerce, digital logistics, money transfer, and tech sourcing in one platform, we make it simple to shop, ship, and source.
                    </p>

                    <h2 className="text-base font-semibold text-gray-900 mt-10 mb-4">What We Offer</h2>
                    <ul className="space-y-4 text-gray-600 mb-10">
                        <li className="flex items-start gap-3">
                            <Zap className="h-5 w-5 text-brand shrink-0 mt-0.5" />
                            <span><strong className="text-gray-900">Shop</strong> — Electronics and tech, vetted and delivered. Items ship internationally with 7–14 day estimated delivery.</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <Truck className="h-5 w-5 text-brand shrink-0 mt-0.5" />
                            <span><strong className="text-gray-900">Digital Logistics</strong> — Ship and track packages and freight with transparency and reliability.</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <Globe className="h-5 w-5 text-brand shrink-0 mt-0.5" />
                            <span><strong className="text-gray-900">Money Transfer</strong> — Send to and receive from China and other corridors with secure, traceable transfers.</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <Target className="h-5 w-5 text-brand shrink-0 mt-0.5" />
                            <span><strong className="text-gray-900">Tech Sourcing</strong> — Custom procurement and sourcing for businesses and professionals.</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <Tag className="h-5 w-5 text-brand shrink-0 mt-0.5" />
                            <span><strong className="text-gray-900">Sell for Me</strong> — List items you can&apos;t sell yourself; we list, sell, and pay you via your wallet.</span>
                        </li>
                    </ul>

                    <h2 className="text-base font-semibold text-gray-900 mt-10 mb-4">Why ThinQShop</h2>
                    <p className="text-gray-600 leading-relaxed mb-6">
                        We focus on quality, transparency, and service. From order placement to delivery and support, we aim to meet the standards that serious buyers and businesses expect. Our platform is built to scale with you as you grow.
                    </p>

                    <div className="flex flex-wrap gap-4 mt-12">
                        <Link href="/shop" className="inline-flex items-center gap-2 px-5 py-3 bg-brand text-white rounded-xl text-sm font-semibold hover:bg-brand/90 transition-colors">
                            Shop now
                        </Link>
                        <Link href="/contact" className="inline-flex items-center gap-2 px-5 py-3 border border-gray-200/90 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">
                            Contact us
                        </Link>
                    </div>
                </div>
            </div>
        </ShopLayout>
    );
}
