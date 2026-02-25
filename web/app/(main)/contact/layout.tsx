import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thinqshopping.app';

export const metadata: Metadata = {
    title: 'Contact',
    description: 'Get in touch with ThinQShop support. Phone, WhatsApp, and email for orders, logistics, transfers, and procurement.',
    openGraph: {
        title: 'Contact | ThinQShop',
        description: 'Contact our team for support and enquiries.',
        url: `${siteUrl}/contact`,
    },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
