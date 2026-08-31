import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import AppChrome from "@/components/AppChrome";
import AppProviders from "@/components/AppProviders";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thinqshopping.app';

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    viewportFit: 'cover',
    themeColor: '#ffffff',
};

export const metadata: Metadata = {
    metadataBase: new URL(siteUrl),
    title: {
        default: "ThinQShop | E-Commerce & Services",
        template: "%s | ThinQShop",
    },
    description: "Shop electronics and imaging systems delivered to Ghana. Order online, pay in GHS. Logistics, money transfer, and procurement support.",
    keywords: ["ThinQShop", "Ghana", "e-commerce", "electronics", "imaging", "shipping", "procurement"],
    appleWebApp: {
        capable: true,
        statusBarStyle: 'black-translucent',
        title: 'ThinQShop',
    },
    other: {
        'mobile-web-app-capable': 'yes',
    },
    openGraph: {
        type: "website",
        locale: "en",
        url: siteUrl,
        siteName: "ThinQShop",
        title: "ThinQShop | E-Commerce & Services",
        description: "Shop electronics and imaging systems delivered to Ghana. Order online, pay in GHS.",
        images: [{ url: `${siteUrl}/thinqshop-logo.webp`, width: 3139, height: 746, alt: "ThinQShopping" }],
    },
    twitter: {
        card: "summary_large_image",
        title: "ThinQShop | E-Commerce & Services",
        description: "Shop electronics and imaging systems delivered to Ghana. Order online, pay in GHS.",
    },
    icons: {
        icon: [
            { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
            { url: "/thinqshop-icon-192.png", sizes: "192x192", type: "image/png" },
            { url: "/thinqshop-icon-512.png", sizes: "512x512", type: "image/png" },
        ],
        shortcut: "/favicon-32.png",
        apple: "/thinqshop-icon-192.png",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className={outfit.variable}>
            <head>
                {/* First paint: white chrome matching Navbar/Topbar. */}
                <style
                    dangerouslySetInnerHTML={{
                        __html:
                            ':root{--app-chrome-bg:#ffffff;--app-sat:env(safe-area-inset-top,0px)}' +
                            'html,body{background-color:var(--app-chrome-bg);height:100%;overscroll-behavior:none}' +
                            '@supports (height:100svh){html,body{height:100svh}}' +
                            '#status-bar-cover{position:fixed;top:0;left:0;right:0;pointer-events:none;z-index:2000;' +
                            'height:constant(safe-area-inset-top);height:var(--app-sat,env(safe-area-inset-top,0px));' +
                            'background:var(--app-chrome-bg)}',
                    }}
                />
            </head>
            <body className={`${outfit.className} font-brand antialiased`}>
                <div id="status-bar-cover" aria-hidden="true" />
                <AppChrome />
                <a href="#main-content" className="skip-link">Skip to main content</a>
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            '@context': 'https://schema.org',
                            '@graph': [
                                {
                                    '@type': 'WebSite',
                                    name: 'ThinQShop',
                                    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://thinqshopping.app',
                                    description: 'E-commerce and services for Ghana. Shop electronics and imaging systems.',
                                },
                                {
                                    '@type': 'Organization',
                                    name: 'ThinQShop',
                                    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://thinqshopping.app',
                                    description: 'E-commerce, logistics, money transfer, and procurement services for Ghana and West Africa.',
                                },
                            ],
                        }).replace(/</g, '\\u003c'),
                    }}
                />
                <AppProviders>{children}</AppProviders>
            </body>
        </html>
    );
}
