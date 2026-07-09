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
                className={`group relative block overflow-hidden rounded-2xl ${gradient} min-h-[148px] shadow-[0_8px_24px_-8px_rgba(0,0,0,0.25)] active:shadow-md transition-shadow`}
            >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(255,255,255,0.22),transparent_50%)] pointer-events-none" />
                <div className="relative p-4 pr-[42%] min-h-[148px] flex flex-col">
                    <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>
                    <p className="text-[11px] leading-snug text-white/85 mt-1 max-w-[120px]">{description}</p>
                    <span
                        className={`absolute bottom-3 right-3 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform ${accent}`}
                        aria-hidden
                    >
                        <ArrowUpRight className="h-4 w-4" strokeWidth={2.5} />
                    </span>
                </div>
                <div className="absolute bottom-0 right-0 w-[52%] h-[78%] pointer-events-none">
                    <Image
                        src={image}
                        alt=""
                        fill
                        className="object-contain object-bottom-right drop-shadow-xl translate-x-1 translate-y-1 group-hover:scale-105 transition-transform duration-500"
                        sizes="180px"
                    />
                </div>
            </Link>
        </motion.div>
    );
}
