'use client';

import { useEffect } from 'react';

/**
 * Adds app-loaded to html/body once the app shell has mounted, so the
 * background can transition from splash-matching (#0f172a) to the normal
 * page background (#f8fafc). Reduces white flash / flicker after the
 * native launch screen in WebView apps.
 */
export default function AppLoadedMarker() {
    useEffect(() => {
        document.documentElement.classList.add('app-loaded');
        document.body.classList.add('app-loaded');
    }, []);
    return null;
}
