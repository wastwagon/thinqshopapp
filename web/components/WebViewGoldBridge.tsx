'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';

/**
 * When the site is loaded inside WebViewGold (Android app), tell the app to
 * disable pull-to-refresh so our in-page scroll behavior takes precedence.
 * Only runs when the app is detected to avoid "scheme does not have a registered
 * handler" errors in the browser. Set window.__WEBVIEWGOLD__ = true in the app
 * or ensure the WebView user agent includes "WebViewGold".
 */
function isWebViewGold(): boolean {
    if (typeof window === 'undefined') return false;
    if ((window as unknown as { __WEBVIEWGOLD__?: boolean }).__WEBVIEWGOLD__ === true) return true;
    return /WebViewGold/i.test(navigator.userAgent);
}

export default function WebViewGoldBridge() {
    const done = useRef(false);
    const marked = useRef(false);

    /** Mark html/body before paint so scroll/overscroll CSS applies on first frame. */
    useLayoutEffect(() => {
        if (marked.current || !isWebViewGold()) return;
        marked.current = true;
        document.documentElement.classList.add('webview-gold');
        document.body.classList.add('webview-gold');
    }, []);

    useEffect(() => {
        if (done.current || !isWebViewGold()) return;
        done.current = true;
        try {
            const iframe = document.createElement('iframe');
            iframe.setAttribute('src', 'disablepulltorefresh://');
            iframe.setAttribute('title', 'WebViewGold disable pull to refresh');
            iframe.style.cssText = 'position:absolute;width:0;height:0;border:0;visibility:hidden;pointer-events:none';
            document.body.appendChild(iframe);
            setTimeout(() => {
                if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
            }, 500);
        } catch {
            // Ignore
        }
    }, []);

    return null;
}
