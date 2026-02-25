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

    const message = isProd ? 'An unexpected error occurred. Please try again or go back home.' : (error.message || 'An unexpected error occurred.');

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-6 font-sans">
            <h1 className="text-4xl font-black text-blue-600 mb-4 tracking-tighter">Something went wrong</h1>
            <p className="text-slate-600 mb-8 max-w-md text-center">{message}</p>
            <div className="flex flex-col sm:flex-row gap-4">
                <button
                    onClick={() => reset()}
                    className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm uppercase tracking-wider hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors min-h-[48px] min-w-[140px] flex items-center justify-center"
                    aria-label="Try again"
                >
                    Try again
                </button>
                <Link
                    href="/"
                    className="px-8 py-4 border-2 border-slate-200 text-slate-700 rounded-2xl font-bold text-sm uppercase tracking-wider hover:border-blue-600 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors min-h-[48px] min-w-[140px] flex items-center justify-center"
                >
                    Go home
                </Link>
            </div>
        </div>
    );
}
