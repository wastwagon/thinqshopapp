import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thinqshopping.app';

export const metadata: Metadata = {
    title: 'About Us',
    description: 'ThinQShop bridges world-class technology and West African businesses. E-commerce, digital logistics, money transfer, and tech sourcing in one trusted platform.',
    openGraph: {
        title: 'About Us | ThinQShop',
        description: 'Who we are and what we stand for. Premium electronics and services for Ghana and West Africa.',
        url: `${siteUrl}/about`,
    },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
