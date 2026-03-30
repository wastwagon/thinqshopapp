'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';
import {
    disableWebViewGoldPullToRefresh,
    isWebViewGoldClient,
    markWebViewGoldDocument,
    scheduleDisableWebViewGoldPullToRefresh,
} from '@/lib/webviewGoldClient';

export default function WebViewGoldBridge() {
    const marked = useRef(false);

    useLayoutEffect(() => {
        if (marked.current || !isWebViewGoldClient()) return;
        marked.current = true;
        markWebViewGoldDocument();
    }, []);

    useEffect(() => {
        if (!isWebViewGoldClient()) return;

        scheduleDisableWebViewGoldPullToRefresh();

        const onPageShow = () => {
            markWebViewGoldDocument();
            scheduleDisableWebViewGoldPullToRefresh();
        };
        window.addEventListener('pageshow', onPageShow);

        const onVisible = () => {
            if (document.visibilityState === 'visible') {
                disableWebViewGoldPullToRefresh();
            }
        };
        document.addEventListener('visibilitychange', onVisible);

        return () => {
            window.removeEventListener('pageshow', onPageShow);
            document.removeEventListener('visibilitychange', onVisible);
        };
    }, []);

    return null;
}
