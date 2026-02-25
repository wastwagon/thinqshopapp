'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

export default function SplashScreen() {
    const [isLoading, setIsLoading] = useState(true);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        // Adjust the time based on when your app actually mounts or a hardcoded smooth duration (2.5s)
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 2500);

        return () => clearTimeout(timer);
    }, []);

    if (!isMounted) return null;

    return (
        <AnimatePresence>
            {isLoading && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-white"
                >
                    <div className="relative w-64 h-64 md:w-96 md:h-96">
                        <Image
                            src="/splash.gif"
                            alt="ThinQShop Loading..."
                            fill
                            className="object-contain"
                            priority
                            unoptimized
                        />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
