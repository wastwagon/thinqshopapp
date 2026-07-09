'use client';

import { Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';

type DashboardWalletBalancePanelProps = {
    label: string;
    amount: string;
    currency?: string;
    hidden?: boolean;
    onToggleHidden?: () => void;
    footer?: React.ReactNode;
    actions?: React.ReactNode;
};

export default function DashboardWalletBalancePanel({
    label,
    amount,
    currency = 'GHS',
    hidden = false,
    onToggleHidden,
    footer,
    actions,
}: DashboardWalletBalancePanelProps) {
    const [whole, fraction] = amount.split('.');

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-950 via-[#02274f] to-blue-900 p-5 md:p-6 mb-4 shadow-[0_12px_40px_-12px_rgba(2,39,79,0.5)]"
        >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(255,255,255,0.1),transparent_50%)] pointer-events-none" />
            <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium text-blue-100/90 tracking-wide">{label}</span>
                    {onToggleHidden && (
                        <button
                            type="button"
                            onClick={onToggleHidden}
                            className="min-w-[32px] min-h-[32px] -m-1 flex items-center justify-center rounded-lg text-blue-200/80 hover:text-white hover:bg-white/10 transition-colors"
                            aria-label={hidden ? 'Show balance' : 'Hide balance'}
                        >
                            {hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                    )}
                </div>
                <p className="text-white font-bold tracking-tight mb-3">
                    {hidden ? (
                        <span className="text-3xl md:text-4xl">••••••</span>
                    ) : (
                        <>
                            <span className="text-base font-semibold text-blue-100/90 mr-1.5">{currency}</span>
                            <span className="text-3xl md:text-4xl">{whole}</span>
                            <span className="text-xl md:text-2xl text-blue-100/80">.{fraction ?? '00'}</span>
                        </>
                    )}
                </p>
                {footer && !hidden && (
                    <div className="text-[11px] md:text-xs text-blue-100/75 leading-relaxed space-y-1 mb-4">{footer}</div>
                )}
                {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
            </div>
        </motion.div>
    );
}
