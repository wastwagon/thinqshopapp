'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { setAnalyticsConsent, isAnalyticsEnabledInEnv, hasAnalyticsConsent } from '@/lib/analytics';

export default function CookieConsent() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (!isAnalyticsEnabledInEnv()) return;
        if (hasAnalyticsConsent()) return;
        setVisible(true);
    }, []);

    if (!visible) return null;

    const accept = () => {
        setAnalyticsConsent(true);
        setVisible(false);
        window.dispatchEvent(new Event('thinqshop-analytics-consent'));
    };

    const decline = () => {
        setAnalyticsConsent(false);
        setVisible(false);
    };

    return (
        <div
            role="dialog"
            aria-label="Cookie preferences"
            className="fixed left-0 right-0 z-[105] p-4 md:p-6 pointer-events-none bottom-[calc(3.25rem+env(safe-area-inset-bottom,0px))] md:bottom-0"
        >
            <div className="max-w-3xl mx-auto pointer-events-auto flat-card border border-gray-200/90 shadow-xl p-4 md:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                <p className="text-sm text-gray-600 flex-1">
                    We use cookies for analytics to improve the shop experience. See our{' '}
                    <Link href="/privacy" className="text-blue-600 font-medium hover:underline">
                        privacy policy
                    </Link>
                    .
                </p>
                <div className="flex flex-shrink-0 gap-2">
                    <button
                        type="button"
                        onClick={decline}
                        className="min-h-[44px] px-4 py-2 rounded-xl border border-gray-200/90 text-sm font-medium text-gray-700 hover:border-gray-300 transition-colors"
                    >
                        Decline
                    </button>
                    <button
                        type="button"
                        onClick={accept}
                        className="min-h-[44px] px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
                    >
                        Accept
                    </button>
                </div>
            </div>
        </div>
    );
}
