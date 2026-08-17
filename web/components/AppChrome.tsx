'use client';

import { useLayoutEffect, useRef } from 'react';
import { initAppChrome, isAndroidWebView } from '@/lib/app-chrome';
import { isWebViewGoldClient, markWebViewGoldDocument } from '@/lib/webviewGoldClient';

/**
 * Measures safe-area-inset-top, paints html/body/theme-color to the AppBar
 * white, and pings WebViewGold status-bar schemes. Runs on every surface
 * (shop, dashboard, auth) from the root layout.
 */
export default function AppChrome() {
    const cleanup = useRef<(() => void) | null>(null);

    useLayoutEffect(() => {
        const isWebViewGold = isWebViewGoldClient();
        if (isWebViewGold || isAndroidWebView()) markWebViewGoldDocument();
        cleanup.current = initAppChrome({ isWebViewGold });
        return () => {
            cleanup.current?.();
            cleanup.current = null;
        };
    }, []);

    return null;
}
