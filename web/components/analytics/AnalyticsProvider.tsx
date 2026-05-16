'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { hasAnalyticsConsent, initAnalytics, isAnalyticsEnabledInEnv, trackPageView } from '@/lib/analytics';

export default function AnalyticsProvider() {
    const pathname = usePathname();

    useEffect(() => {
        const boot = () => {
            if (!isAnalyticsEnabledInEnv() || hasAnalyticsConsent()) {
                initAnalytics();
            }
        };
        boot();
        window.addEventListener('thinqshop-analytics-consent', boot);
        return () => window.removeEventListener('thinqshop-analytics-consent', boot);
    }, []);

    useEffect(() => {
        if (pathname) trackPageView(pathname, undefined);
    }, [pathname]);

    return null;
}
