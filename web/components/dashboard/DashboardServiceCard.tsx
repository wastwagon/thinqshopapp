'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';

export type ServiceCardConfig = {
    title: string;
    description: string;
    href: string;
    image: string;
    gradient: string;
    accent: string;
    /** multiply dissolves white PNG boards into the card color */
    imageBlend?: 'multiply' | 'normal';
};

type DashboardServiceCardProps = ServiceCardConfig & {
    index: number;
};

export default function DashboardServiceCard({
    title,
    description,
    href,
    image,
    gradient,
    accent,
    imageBlend = 'normal',
    index,
}: DashboardServiceCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08 * index, ease: [0.16, 1, 0.3, 1] }}
            whileTap={{ scale: 0.98 }}
        >
            <Link
                href={href}
                className={`group relative block overflow-hidden rounded-2xl ${gradient} min-h-[156px] shadow-[0_8px_24px_-8px_rgba(0,0,0,0.25)] active:shadow-md transition-shadow`}
            >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(255,255,255,0.22),transparent_50%)] pointer-events-none" />

                {/* Soft left fade keeps title/copy readable over the illustration */}
                <div
                    className="absolute bottom-0 right-0 w-[52%] h-[80%] pointer-events-none"
                    style={{
                        WebkitMaskImage: 'linear-gradient(90deg, transparent 0%, black 24%, black 100%)',
                        maskImage: 'linear-gradient(90deg, transparent 0%, black 24%, black 100%)',
                    }}
                >
                    <Image
                        src={image}
                        alt=""
                        fill
                        className={`object-contain object-bottom-right drop-shadow-lg translate-x-0.5 translate-y-1 scale-[0.94] origin-bottom-right group-hover:scale-[0.98] transition-transform duration-500 ${
                            imageBlend === 'multiply' ? 'mix-blend-multiply opacity-95' : 'opacity-90'
                        }`}
                        sizes="180px"
                    />
                </div>

                <div className="relative z-10 p-4 pr-[46%] min-h-[156px] flex flex-col">
                    <h3 className="text-base font-bold text-white tracking-tight drop-shadow-sm">{title}</h3>
                    <p className="text-[11px] leading-snug text-white/90 mt-1 max-w-[11rem]">{description}</p>
                    <span
                        className={`mt-auto self-start w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform ${accent}`}
                        aria-hidden
                    >
                        <ArrowUpRight className="h-4 w-4" strokeWidth={2.5} />
                    </span>
                </div>
            </Link>
        </motion.div>
    );
}
