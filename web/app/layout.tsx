import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import AppLoadedMarker from "@/components/AppLoadedMarker";

const outfit = Outfit({ subsets: ["latin"] });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thinqshopping.app';

const webViewGoldForceBridge = process.env.NEXT_PUBLIC_WEBVIEWGOLD_FORCE_BRIDGE === '1';

/**
 * Before React: WebViewGold docs — call disablepulltorefresh:// from the website
 * (Android ENABLE_PULL_REFRESH / iOS pulltorefresh sections). Iframe + <a> mirror
 * web/lib/webviewGoldClient.ts. PTR_OFF_VIA_LOCATION matches Android doc style for scheme APIs.
 */
const webViewGoldPtrOffViaLocation = process.env.NEXT_PUBLIC_WEBVIEWGOLD_PTR_OFF_VIA_LOCATION === '1';

const webViewGoldBootScript = `
(function(){
  var FORCE=${webViewGoldForceBridge ? 'true' : 'false'};
  var VIA_LOC=${webViewGoldPtrOffViaLocation ? 'true' : 'false'};
  var LOC_SENT=false;
  var SCHEME='disablepulltorefresh://';
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
  function disable(){
    try {
      if (!document.body) return;
      var f=document.createElement('iframe');
      f.setAttribute('src',SCHEME);
      f.setAttribute('title','WebViewGold disable pull to refresh');
      f.style.cssText='position:absolute;width:0;height:0;border:0;visibility:hidden;pointer-events:none';
      document.body.appendChild(f);
      setTimeout(function(){ if(f.parentNode)f.parentNode.removeChild(f);},400);
      var a=document.createElement('a');
      a.setAttribute('href',SCHEME);
      a.setAttribute('aria-hidden','true');
      a.style.cssText='position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0';
      document.body.appendChild(a);
      a.click();
      if(a.parentNode)a.parentNode.removeChild(a);
      if(VIA_LOC&&!LOC_SENT){ LOC_SENT=true; try{ window.location.href=SCHEME; }catch(e2){} }
    } catch(e){}
  }
  function schedule(){
    disable();
    [0,80,200,600,1500].forEach(function(ms){ setTimeout(disable,ms); });
  }
  mark();
  schedule();
  document.addEventListener('DOMContentLoaded',function(){ mark(); schedule(); });
  window.addEventListener('pageshow',function(){ mark(); schedule(); });
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
        images: [{ url: `${siteUrl}/thinqshop-logo.webp`, width: 1200, height: 630, alt: "ThinQShop" }],
    },
    twitter: {
        card: "summary_large_image",
        title: "ThinQShop | E-Commerce & Services",
        description: "Shop electronics and imaging systems delivered to Ghana. Order online, pay in GHS.",
    },
    icons: {
        icon: "/favicon.png",
        shortcut: "/favicon.png",
        apple: "/favicon.png",
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
                {/* Match app splash background so no white flash when WebView loads (smooth launch) */}
                <style
                    dangerouslySetInnerHTML={{
                        __html: 'html,body{background-color:#0f172a;min-height:100vh}',
                    }}
                />
            </head>
            <body className={outfit.className}>
                <script
                    dangerouslySetInnerHTML={{
                        __html: webViewGoldBootScript,
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
