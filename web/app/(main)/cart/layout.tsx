import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thinqshopping.app';

export const metadata: Metadata = {
    title: 'Shopping bag',
    description: 'Review items in your ThinQShop bag before checkout.',
    robots: { index: false, follow: false },
    openGraph: {
        title: 'Shopping bag | ThinQShop',
        url: `${siteUrl}/cart`,
    },
};

export default function CartLayout({ children }: { children: React.ReactNode }) {
    return children;
}
