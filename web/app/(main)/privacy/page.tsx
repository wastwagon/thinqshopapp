'use client';

import Link from 'next/link';
import ShopLayout from '@/components/layout/ShopLayout';
import PageHeader from '@/components/ui/PageHeader';

export default function PrivacyPage() {
    return (
        <ShopLayout>
            <div className="max-w-4xl mx-auto px-6 py-12">
                <PageHeader
                    title="Privacy Policy"
                    subtitle="How we collect, use, and protect your information"
                    breadcrumbs={[{ label: 'Privacy Policy' }]}
                />

                <div className="prose prose-gray max-w-none text-gray-600 space-y-8">
                    <p className="text-sm text-gray-500">
                        Last updated: February 2026. This policy describes how ThinQShop (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) handles your personal data when you use our website and services.
                    </p>

                    <section>
                        <h2 className="text-lg font-bold text-gray-900 mb-3">1. Information We Collect</h2>
                        <p className="leading-relaxed mb-3">
                            We may collect information you provide directly (e.g. name, email, phone, address, payment and identity details when you register, shop, use logistics, transfers, or procurement). We also collect technical and usage data such as IP address, device type, browser, and how you use our site and services, including via cookies and similar technologies.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-gray-900 mb-3">2. How We Use Your Information</h2>
                        <p className="leading-relaxed mb-3">
                            We use your information to provide, operate, and improve our services; process orders and payments; facilitate logistics and transfers; communicate with you (e.g. order updates, support, marketing where you have agreed); prevent fraud and comply with legal obligations; and for analytics and security.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-gray-900 mb-3">3. Sharing of Information</h2>
                        <p className="leading-relaxed mb-3">
                            We may share your information with service providers (e.g. payment processors, carriers, cloud hosting) who assist in delivering our services, subject to confidentiality and data protection commitments. We may also share data where required by law, to protect our rights or safety, or with your consent.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-gray-900 mb-3">4. Data Retention &amp; Security</h2>
                        <p className="leading-relaxed mb-3">
                            We retain your data for as long as needed to provide our services, comply with law, and resolve disputes. We implement technical and organisational measures to protect your data against unauthorised access, loss, or misuse; however, no system is completely secure.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-gray-900 mb-3">5. Your Rights</h2>
                        <p className="leading-relaxed mb-3">
                            Depending on your location, you may have rights to access, correct, delete, or restrict processing of your personal data, or to object to certain processing and to data portability. You may also withdraw consent where we rely on it. To exercise these rights or ask questions, contact us via <Link href="/contact" className="text-blue-600 hover:text-blue-700 font-medium">Contact Support</Link>. You may also have the right to lodge a complaint with a supervisory authority.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-gray-900 mb-3">6. Cookies &amp; Similar Technologies</h2>
                        <p className="leading-relaxed mb-3">
                            We use cookies and similar technologies for authentication, preferences, analytics, and security. You can manage cookie settings in your browser; some features may not work fully if you disable certain cookies.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-gray-900 mb-3">7. Changes to This Policy</h2>
                        <p className="leading-relaxed mb-3">
                            We may update this Privacy Policy from time to time. We will post the updated version on this page and indicate the last updated date. Continued use of our services after changes constitutes acceptance of the updated policy where permitted by law.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-gray-900 mb-3">8. Contact Us</h2>
                        <p className="leading-relaxed">
                            For privacy-related questions or requests, please use our <Link href="/contact" className="text-blue-600 hover:text-blue-700 font-medium">Contact Support</Link> page.
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
