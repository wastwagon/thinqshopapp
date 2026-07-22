'use client';

import { useLayoutEffect, useRef } from 'react';
import {
    disableWebViewGoldPullToRefresh,
    isWebViewGoldClient,
} from '@/lib/webviewGoldClient';

/**
 * Marks the document for WebViewGold CSS (overscroll) once.
 * Does not re-fire custom URL schemes on pageshow/visibility — that can trap
 * Android WebView on relaunch.
 */
export default function WebViewGoldBridge() {
    const ran = useRef(false);

    useLayoutEffect(() => {
        if (ran.current || !isWebViewGoldClient()) return;
        ran.current = true;
        disableWebViewGoldPullToRefresh();
    }, []);

    return null;
}
