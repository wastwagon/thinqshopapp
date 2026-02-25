'use client';

import Link from 'next/link';
import ShopLayout from '@/components/layout/ShopLayout';
import PageHeader from '@/components/ui/PageHeader';

export default function TermsPage() {
    return (
        <ShopLayout>
            <div className="max-w-4xl mx-auto px-6 py-12">
                <PageHeader
                    title="Terms & Conditions"
                    subtitle="Terms of use and warranty information"
                    breadcrumbs={[{ label: 'Terms & Conditions' }]}
                />

                <div className="prose prose-gray max-w-none text-gray-600 space-y-8">
                    <p className="text-sm text-gray-500">
                        Last updated: February 2026. Please read these terms carefully before using ThinQShop services.
                    </p>

                    <section>
                        <h2 className="text-lg font-bold text-gray-900 mb-3">1. Acceptance of Terms</h2>
                        <p className="leading-relaxed">
                            By accessing or using ThinQShop (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;)—including our website, shop, logistics, money transfer, and procurement services—you agree to be bound by these Terms &amp; Conditions. If you do not agree, do not use our services.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-gray-900 mb-3">2. Use of Services</h2>
                        <p className="leading-relaxed mb-3">
                            You must use our platform lawfully and only for intended purposes. You agree to provide accurate information, keep your account secure, and not misuse our systems (e.g. fraud, abuse, or circumventing security). We may suspend or terminate access for breach of these terms.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-gray-900 mb-3">3. Shopping &amp; Orders</h2>
                        <p className="leading-relaxed mb-3">
                            Product listings, prices, and availability are subject to change. Orders are subject to acceptance and availability. Delivery times (including 7–14 day international shipping) are estimates, not guarantees. We are not liable for delays caused by carriers, customs, or events outside our control.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-gray-900 mb-3">4. Warranty &amp; Returns</h2>
                        <p className="leading-relaxed mb-3">
                            Products may come with manufacturer warranties as stated on the product page. Our return and refund policy is as described at checkout and in order confirmations. Defective or misdescribed items should be reported within the period stated in our policy. Warranty T&amp;C for specific products may be provided separately or by the manufacturer.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-gray-900 mb-3">5. Logistics, Transfers &amp; Procurement</h2>
                        <p className="leading-relaxed mb-3">
                            Logistics tracking, money transfer, and procurement services are subject to their own service terms and any limits or fees disclosed at the time of use. You are responsible for complying with applicable laws (e.g. customs, foreign exchange) when using these services.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-gray-900 mb-3">6. Limitation of Liability</h2>
                        <p className="leading-relaxed mb-3">
                            To the fullest extent permitted by law, ThinQShop and its affiliates are not liable for indirect, incidental, or consequential damages (including loss of profit or data) arising from your use of our services. Our total liability for any claim related to these terms or the services shall not exceed the amount you paid to us for the relevant transaction in the twelve months before the claim.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-gray-900 mb-3">7. Changes</h2>
                        <p className="leading-relaxed mb-3">
                            We may update these Terms &amp; Conditions from time to time. Continued use of our services after changes constitutes acceptance. Material changes will be communicated where required by law or where we deem appropriate.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-gray-900 mb-3">8. Contact</h2>
                        <p className="leading-relaxed">
                            For questions about these terms or warranty, contact us via <Link href="/contact" className="text-blue-600 hover:text-blue-700 font-medium">Contact Support</Link>.
                        </p>
                    </section>

                    <div className="pt-8 border-t border-gray-200">
                        <Link href="/" className="text-sm font-medium text-blue-600 hover:text-blue-700">← Back to Home</Link>
                    </div>
                </div>
            </div>
        </ShopLayout>
    );
}
