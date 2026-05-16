'use client';

import { useEffect } from 'react';
import Link from 'next/link';

const isProd = process.env.NODE_ENV === 'production';

export default function ErrorPage({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        if (!isProd) console.error(error);
    }, [error]);

    const message = isProd
        ? 'An unexpected error occurred. Please try again or go back home.'
        : error.message || 'An unexpected error occurred.';

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-app px-6">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Something went wrong</h1>
            <p className="text-gray-500 mb-8 max-w-md text-center text-sm">{message}</p>
            <div className="flex flex-col sm:flex-row gap-3">
                <button
                    type="button"
                    onClick={() => reset()}
                    className="px-6 py-3 bg-brand text-white rounded-xl font-semibold text-sm hover:bg-brand/90 transition-colors min-h-[44px] min-w-[140px] flex items-center justify-center"
                    aria-label="Try again"
                >
                    Try again
                </button>
                <Link
                    href="/"
                    className="px-6 py-3 border border-gray-200/90 text-gray-700 rounded-xl font-semibold text-sm hover:border-brand hover:text-brand transition-colors min-h-[44px] min-w-[140px] flex items-center justify-center"
                >
                    Go home
                </Link>
            </div>
        </div>
    );
}
