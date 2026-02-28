import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thinqshopping.app';

export const metadata: Metadata = {
    title: 'Shop',
    description: 'Browse electronics and imaging systems at ThinQShop. Order in GHS with delivery across Ghana and support for logistics and procurement.',
    openGraph: {
        title: 'Shop | ThinQShop',
        description: 'Browse electronics and imaging systems. Order in GHS with delivery across Ghana.',
        url: `${siteUrl}/shop`,
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Shop | ThinQShop',
        description: 'Browse electronics and imaging systems. Order in GHS with delivery across Ghana.',
    },
};

export default function ShopLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
