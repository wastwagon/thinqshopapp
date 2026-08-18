import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import AppChrome from "@/components/AppChrome";
import AppProviders from "@/components/AppProviders";
import { APP_CHROME_RGB, APP_CHROME_STATUS_TEXT } from "@/lib/app-chrome";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thinqshopping.app';

const webViewGoldForceBridge = process.env.NEXT_PUBLIC_WEBVIEWGOLD_FORCE_BRIDGE === '1';
const webViewGoldPtrOffIframe = process.env.NEXT_PUBLIC_WEBVIEWGOLD_PTR_OFF_IFRAME === '1';

/**
 * Before React: paint status-bar chrome and ping wrapper schemes via hidden
 * iframes (do not wait for hydration). No native store rebuild required —
 * existing WebViewGold already intercepts statusbarcolor://.
 *
 * statusbarcolor / statusbartextcolor: WebViewGold and Android WebView only
 * (Safari/Chrome cannot use those schemes; pinging them only spams CSP).
 * hidebars://: iOS wrapper only (on Android it hides the clock).
 * Do NOT navigate the top frame to custom schemes on Android.
 */
const webViewGoldBootScript = `
(function(){
  var FORCE=${webViewGoldForceBridge ? 'true' : 'false'};
  var IFRAME_PTR=${webViewGoldPtrOffIframe ? 'true' : 'false'};
  var PTR_SCHEME='disablepulltorefresh://';
  var ptrSent=false;
  var chromeSent=false;
  function isWG(){
    try {
      if (window.__WEBVIEWGOLD__===true) return true;
      if (FORCE) return true;
      return /WebViewGold/i.test(navigator.userAgent||'');
    } catch(e){ return false; }
  }
  function isIOS(){
    try {
      var ua=navigator.userAgent||'';
      if (/iPad|iPhone|iPod/i.test(ua)) return true;
      return navigator.platform==='MacIntel' && navigator.maxTouchPoints>1;
    } catch(e){ return false; }
  }
  function isAndroidWV(){
    try {
      var ua=navigator.userAgent||'';
      return /Android/i.test(ua) && /; wv\\)/i.test(ua);
    } catch(e){ return false; }
  }
  function ping(url){
    try {
      var f=document.createElement('iframe');
      f.setAttribute('src',url);
      f.setAttribute('aria-hidden','true');
      f.style.cssText='position:absolute;width:0;height:0;border:0;visibility:hidden;pointer-events:none';
      (document.body||document.documentElement).appendChild(f);
      setTimeout(function(){ if(f.parentNode)f.parentNode.removeChild(f); },400);
    } catch(e){}
    try { var img=new Image(); img.src=url; } catch(e){}
  }
  function mark(){
    try {
      document.documentElement.classList.add('webview-gold');
      if (document.body) document.body.classList.add('webview-gold');
    } catch(e){}
  }
  function iframePtrOnce(){
    if (!IFRAME_PTR || ptrSent || !document.body) return;
    ptrSent=true;
    ping(PTR_SCHEME);
  }
  function chromePings(){
    if (chromeSent) return;
    chromeSent=true;
    ping('statusbarcolor://${APP_CHROME_RGB}');
    ping('statusbartextcolor://${APP_CHROME_STATUS_TEXT}');
    if (isIOS() && isWG()) ping('hidebars://on');
  }
  if (isWG() || isAndroidWV()) {
    mark();
    chromePings();
    iframePtrOnce();
  }
  document.addEventListener('DOMContentLoaded',function(){
    if (isWG() || isAndroidWV()) { mark(); chromePings(); iframePtrOnce(); }
  });
})();`;

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
                <script
                    dangerouslySetInnerHTML={{
                        __html: webViewGoldBootScript,
                    }}
                />
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
