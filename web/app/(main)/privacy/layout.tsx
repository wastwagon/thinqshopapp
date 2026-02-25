import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thinqshopping.app';

export const metadata: Metadata = {
    title: 'Privacy Policy',
    description: 'How ThinQShop collects, uses, and protects your information when you use our website, shop, logistics, money transfer, and procurement services.',
    openGraph: {
        title: 'Privacy Policy | ThinQShop',
        description: 'How we collect, use, and protect your information.',
        url: `${siteUrl}/privacy`,
    },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
