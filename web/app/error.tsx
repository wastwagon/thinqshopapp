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
        <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6">
            <div className="w-12 h-1 rounded-full bg-gradient-to-r from-blue-500 to-blue-700 mb-6" aria-hidden />
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Something went wrong</h1>
            <p className="text-gray-500 mb-8 max-w-md text-center text-sm">{message}</p>
            <div className="flex flex-col sm:flex-row gap-3">
                <button
                    type="button"
                    onClick={() => reset()}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors min-h-[44px] min-w-[140px] flex items-center justify-center"
                    aria-label="Try again"
                >
                    Try again
                </button>
                <Link
                    href="/"
                    className="px-6 py-3 border border-gray-200 text-gray-700 rounded-xl font-semibold text-sm hover:border-blue-300 hover:text-blue-600 transition-colors min-h-[44px] min-w-[140px] flex items-center justify-center"
                >
                    Go home
                </Link>
            </div>
        </div>
    );
}
