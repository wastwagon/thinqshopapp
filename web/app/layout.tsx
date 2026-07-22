import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import AppLoadedMarker from "@/components/AppLoadedMarker";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thinqshopping.app';

const webViewGoldForceBridge = process.env.NEXT_PUBLIC_WEBVIEWGOLD_FORCE_BRIDGE === '1';
const webViewGoldPtrOffIframe = process.env.NEXT_PUBLIC_WEBVIEWGOLD_PTR_OFF_IFRAME === '1';

/**
 * Before React: mark .webview-gold for CSS overscroll only.
 * Do NOT navigate via <a>/location to disablepulltorefresh:// — that can leave
 * Android WebView on a non-http last URL so relaunch fails after first close.
 * Optional PTR_OFF_IFRAME: one hidden iframe, once (never on pageshow).
 */
const webViewGoldBootScript = `
(function(){
  var FORCE=${webViewGoldForceBridge ? 'true' : 'false'};
  var IFRAME_PTR=${webViewGoldPtrOffIframe ? 'true' : 'false'};
  var SCHEME='disablepulltorefresh://';
  var sent=false;
  function isWG(){
    try {
      if (window.__WEBVIEWGOLD__===true) return true;
      if (FORCE) return true;
      return /WebViewGold/i.test(navigator.userAgent||'');
    } catch(e){ return false; }
  }
  if (!isWG()) return;
  function mark(){
    try {
      document.documentElement.classList.add('webview-gold');
      if (document.body) document.body.classList.add('webview-gold');
    } catch(e){}
  }
  function iframeOnce(){
    if (!IFRAME_PTR || sent || !document.body) return;
    sent=true;
    try {
      var f=document.createElement('iframe');
      f.setAttribute('src',SCHEME);
      f.setAttribute('title','WebViewGold disable pull to refresh');
      f.style.cssText='position:absolute;width:0;height:0;border:0;visibility:hidden;pointer-events:none';
      document.body.appendChild(f);
      setTimeout(function(){ if(f.parentNode)f.parentNode.removeChild(f);},400);
    } catch(e){}
  }
  mark();
  iframeOnce();
  document.addEventListener('DOMContentLoaded',function(){ mark(); iframeOnce(); });
})();`;
/** If React never adds .app-loaded (hydration error / broken navigation), exit slate splash after 5s. */
const appLoadedFallbackScript = `
(function(){
  function ensure(){
    if (!document.documentElement.classList.contains('app-loaded')) {
      document.documentElement.classList.add('app-loaded');
      if (document.body) document.body.classList.add('app-loaded');
    }
  }
  function arm(){ setTimeout(ensure, 5000); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arm);
  else arm();
})();`;

export const metadata: Metadata = {
    metadataBase: new URL(siteUrl),
    title: {
        default: "ThinQShop | E-Commerce & Services",
        template: "%s | ThinQShop",
    },
    description: "Shop electronics and imaging systems delivered to Ghana. Order online, pay in GHS. Logistics, money transfer, and procurement support.",
    keywords: ["ThinQShop", "Ghana", "e-commerce", "electronics", "imaging", "shipping", "procurement"],
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
                {/* Single viewport meta: viewport-fit=cover enables safe-area insets on notched iOS / WebView apps */}
                <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
                {/* Match app splash background so no white flash when WebView loads (smooth launch) */}
                <style
                    dangerouslySetInnerHTML={{
                        __html: 'html,body{background-color:#0f172a;min-height:100vh}',
                    }}
                />
            </head>
            <body className={`${outfit.className} font-brand antialiased`}>
                <script
                    dangerouslySetInnerHTML={{
                        __html: webViewGoldBootScript,
                    }}
                />
                <script
                    dangerouslySetInnerHTML={{
                        __html: appLoadedFallbackScript,
                    }}
                />
                <AppLoadedMarker />
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
                {children}
            </body>
        </html>
    );
}
