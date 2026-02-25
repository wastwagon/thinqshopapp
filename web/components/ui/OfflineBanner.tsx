'use client';

import { useState, useEffect } from 'react';

export default function OfflineBanner() {
    const [isOnline, setIsOnline] = useState(true);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true);
    }, []);

    useEffect(() => {
        if (!mounted) return;
        const onOnline = () => setIsOnline(true);
        const onOffline = () => setIsOnline(false);
        window.addEventListener('online', onOnline);
        window.addEventListener('offline', onOffline);
        return () => {
            window.removeEventListener('online', onOnline);
            window.removeEventListener('offline', onOffline);
        };
    }, [mounted]);

    if (!mounted || isOnline) return null;

    return (
        <div
            className="fixed top-0 left-0 right-0 z-[200] bg-amber-500 text-amber-950 py-2 px-4 text-center text-sm font-medium safe-area-inset-top"
            role="status"
            aria-live="polite"
            aria-label="You are offline"
        >
            You&apos;re offline. Some features may be unavailable until your connection is back.
        </div>
    );
}
