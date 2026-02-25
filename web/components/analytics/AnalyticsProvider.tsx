'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { initAnalytics, trackPageView } from '@/lib/analytics';

export default function AnalyticsProvider() {
    const pathname = usePathname();

    useEffect(() => {
        initAnalytics();
    }, []);

    useEffect(() => {
        if (pathname) trackPageView(pathname, undefined);
    }, [pathname]);

    return null;
}
