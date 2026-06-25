import Link from 'next/link';
import { Tag, ArrowRight, Wallet } from 'lucide-react';

export default function SellForMeCta() {
    return (
        <section className="py-8 sm:py-10" aria-labelledby="sell-for-me-cta-heading">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
                <div className="flat-card border-l-4 border-l-brand p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="w-9 h-9 rounded-xl bg-brand/10 flex items-center justify-center text-brand">
                                <Tag className="h-4 w-4" aria-hidden />
                            </span>
                            <p className="text-xs font-semibold text-brand uppercase tracking-wide">Sell for Me</p>
                        </div>
                        <h2 id="sell-for-me-cta-heading" className="text-lg sm:text-xl font-semibold text-gray-900 tracking-tight mb-2">
                            Can&apos;t sell it yourself? We&apos;ll sell it for you.
                        </h2>
                        <p className="text-sm text-gray-600 max-w-xl leading-relaxed">
                            List your electronics and gear on ThinQShop. We handle listing, sale, and delivery — earnings go to your unified wallet.
                        </p>
                        <p className="text-xs text-gray-500 mt-2 flex items-center gap-1.5">
                            <Wallet className="h-3.5 w-3.5" aria-hidden />
                            Payouts to wallet · Withdraw after admin approval
                        </p>
                    </div>
                    <Link
                        href="/dashboard/sell-for-me"
                        className="inline-flex items-center justify-center gap-2 min-h-[44px] px-6 py-3 bg-brand text-white text-sm font-semibold rounded-xl hover:bg-brand/90 transition-colors shrink-0"
                    >
                        Start selling
                        <ArrowRight className="h-4 w-4" aria-hidden />
                    </Link>
                </div>
            </div>
        </section>
    );
}
