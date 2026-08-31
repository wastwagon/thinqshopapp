'use client';

import { useLayoutEffect, useRef } from 'react';
import { initAppChrome } from '@/lib/app-chrome';

/**
 * Measures the CSS top safe-area inset (skipped when a native wrapper already
 * reserved it) and paints html/body/theme-color to the AppBar white.
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
