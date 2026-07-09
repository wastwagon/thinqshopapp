'use client';

import Link from 'next/link';
import { Eye, EyeOff, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

type DashboardWalletCardProps = {
    balance: string;
    hidden: boolean;
    onToggleHidden: () => void;
};

export default function DashboardWalletCard({ balance, hidden, onToggleHidden }: DashboardWalletCardProps) {
    const [whole, fraction] = balance.split('.');

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-950 via-[#02274f] to-blue-900 p-3.5 shadow-[0_8px_32px_-8px_rgba(2,39,79,0.45)] min-h-[84px]"
        >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.08),transparent_55%)] pointer-events-none" />
            <div className="relative w-full min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[11px] font-medium text-blue-100/90 tracking-wide">Wallet Balance</span>
                    <div className="flex items-center gap-1 shrink-0">
                        <button
                            type="button"
                            onClick={onToggleHidden}
                            className="h-7 w-7 flex items-center justify-center rounded-lg text-blue-200/80 hover:text-white hover:bg-white/10 transition-colors"
                            aria-label={hidden ? 'Show balance' : 'Hide balance'}
                        >
                            {hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                        <Link
                            href="/dashboard/wallet"
                            className="h-7 w-7 rounded-lg bg-gradient-to-b from-white to-blue-50 text-blue-950 flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.12)] ring-1 ring-white/40 hover:shadow-[0_4px_12px_rgba(0,0,0,0.18)] hover:scale-105 active:scale-95 transition-all"
                            aria-label="Top up wallet"
                        >
                            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                        </Link>
                    </div>
                </div>
                <p className="text-white font-bold tracking-tight tabular-nums whitespace-nowrap">
                    {hidden ? (
                        <span className="text-xl">••••••</span>
                    ) : (
                        <>
                            <span className="text-xs font-semibold text-blue-100/90 mr-1">GHS</span>
                            <span className="text-xl sm:text-2xl">{whole}</span>
                            <span className="text-base sm:text-lg text-blue-100/80">.{fraction ?? '00'}</span>
                        </>
                    )}
                </p>
            </div>
        </motion.div>
    );
}
