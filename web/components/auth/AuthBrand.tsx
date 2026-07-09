'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';

export default function AuthBrand() {
    return (
        <div className="flex flex-col items-center text-center mb-8">
            <div className="relative h-11 w-[220px] sm:h-12 sm:w-[240px] mb-2">
                <Image
                    src="/thinqshop-logo.webp"
                    alt="ThinQShopping"
                    fill
                    className="object-contain"
                    sizes="240px"
                    priority
                />
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
