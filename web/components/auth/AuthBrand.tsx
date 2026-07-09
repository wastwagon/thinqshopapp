'use client';

import { motion } from 'framer-motion';

export default function AuthBrand() {
    return (
        <div className="flex flex-col items-center text-center mb-8">
            <div className="flex items-center gap-2 mb-1">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-[0_8px_24px_-8px_rgba(37,99,235,0.45)]">
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
                        <path d="M6 8h12l-1.2 10.5a1 1 0 01-1 .8H8.2a1 1 0 01-1-.8L6 8z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                        <path d="M9 8V6a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        <circle cx="15" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M16.5 13.5l1.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                </span>
                <span className="text-xl font-bold text-gray-900 tracking-tight">
                    ThinQ<span className="text-blue-600">Shopping</span>
                </span>
            </div>
            <p className="text-xs font-medium text-gray-400 tracking-wide">Buy Smart, Ship Anywhere</p>
        </div>
    );
}

export function AuthCard({ children }: { children: React.ReactNode }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-[0_12px_40px_-16px_rgba(0,0,0,0.12)]"
        >
            <div className="h-1.5 bg-gradient-to-r from-blue-500 to-blue-700" />
            <div className="p-8 sm:p-10">{children}</div>
        </motion.div>
    );
}
