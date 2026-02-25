import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thinqshopping.app';

export const metadata: Metadata = {
    title: 'Terms & Conditions',
    description: 'ThinQShop terms of use, warranty information, and service conditions for our e-commerce, logistics, money transfer, and procurement services.',
    openGraph: {
        title: 'Terms & Conditions | ThinQShop',
        description: 'Terms of use and warranty information for ThinQShop services.',
        url: `${siteUrl}/terms`,
    },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
