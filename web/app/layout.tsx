import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"] });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thinqshopping.app';

export const metadata: Metadata = {
    metadataBase: new URL(siteUrl),
    title: {
        default: "ThinQShop | Premium E-Commerce & Services",
        template: "%s | ThinQShop",
    },
    description: "Shop premium imaging systems and electronics delivered to Ghana with verified global warranty. Order online, pay in GHS, and get support for logistics and procurement.",
    keywords: ["ThinQShop", "Ghana", "e-commerce", "electronics", "imaging", "shipping", "procurement"],
    openGraph: {
        type: "website",
        locale: "en",
        url: siteUrl,
        siteName: "ThinQShop",
        title: "ThinQShop | Premium E-Commerce & Services",
        description: "Shop premium imaging systems and electronics delivered to Ghana with verified global warranty.",
        images: [{ url: `${siteUrl}/thinqshop-logo.webp`, width: 1200, height: 630, alt: "ThinQShop" }],
    },
    twitter: {
        card: "summary_large_image",
        title: "ThinQShop | Premium E-Commerce & Services",
        description: "Shop premium imaging systems and electronics delivered to Ghana with verified global warranty.",
    },
    icons: {
        icon: "/favicon.gif",
        shortcut: "/favicon.gif",
        apple: "/favicon.gif",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <head>
                {/* Single viewport meta: viewport-fit=cover enables safe-area insets on notched iOS / WebView apps */}
                <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
            </head>
            <body className={outfit.className}>
                <a href="#main-content" className="skip-link">Skip to main content</a>
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify([
                            {
                                '@context': 'https://schema.org',
                                '@type': 'WebSite',
                                name: 'ThinQShop',
                                url: process.env.NEXT_PUBLIC_SITE_URL || 'https://thinqshopping.app',
                                description: 'Premium e-commerce and services for Ghana. Shop electronics and imaging systems with verified global warranty.',
                            },
                            {
                                '@context': 'https://schema.org',
                                '@type': 'Organization',
                                name: 'ThinQShop',
                                url: process.env.NEXT_PUBLIC_SITE_URL || 'https://thinqshopping.app',
                                description: 'Premium e-commerce, logistics, money transfer, and procurement services for Ghana and West Africa.',
                            },
                        ]),
                    }}
                />
                {children}
            </body>
        </html>
    );
}
