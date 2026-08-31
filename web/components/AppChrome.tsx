'use client';

import { useLayoutEffect, useRef } from 'react';
import { initAppChrome } from '@/lib/app-chrome';

/**
 * Measures safe-area-inset-top and paints html/body/theme-color to the AppBar
 * white. Runs on every surface (shop, dashboard, auth) from the root layout.
 */
export default function AppChrome() {
    const cleanup = useRef<(() => void) | null>(null);

    useLayoutEffect(() => {
        cleanup.current = initAppChrome();
        return () => {
            cleanup.current?.();
            cleanup.current = null;
        };
    }, []);

    return null;
}
