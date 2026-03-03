'use client';

import { useEffect, useRef } from 'react';

/**
 * When the site is loaded inside WebViewGold (Android app), tell the app to
 * disable pull-to-refresh so our in-page scroll behavior takes precedence.
 * Config.ENABLE_PULL_REFRESH can stay true in the app; we disable it dynamically
 * via the custom scheme so no app update is required.
 * See WebViewGold Config: "call disablepulltorefresh:// from your website"
 */
export default function WebViewGoldBridge() {
    const done = useRef(false);

    useEffect(() => {
        if (done.current) return;
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
            // Ignore (e.g. in non-WebView environment)
        }
    }, []);

    return null;
}
