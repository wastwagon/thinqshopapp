'use client';

import { useCurrencyRates } from '@/hooks/useCurrencyRates';

const SHOW_CONVERTER = process.env.NEXT_PUBLIC_SHOW_CURRENCY_CONVERTER === 'true';

interface PriceDisplayProps {
    amountGhs: number;
    showAlternates?: boolean;
    /** For checkout: show both base and converted, e.g. "₵1,234.00 (≈ $80.21)" */
    checkoutStyle?: boolean;
    className?: string;
}

export default function PriceDisplay({
    amountGhs,
    showAlternates = true,
    checkoutStyle = false,
    className = '',
}: PriceDisplayProps) {
    const rates = useCurrencyRates();
    const canShowAlternates = SHOW_CONVERTER && showAlternates && rates;

    const usd = rates?.ghs_to_usd != null ? amountGhs * rates.ghs_to_usd : null;
    const cny = rates?.ghs_to_cny != null ? amountGhs * rates.ghs_to_cny : null;

    const parts: string[] = [];
    if (usd != null) parts.push(`$${usd.toFixed(2)}`);
    if (cny != null) parts.push(`¥${cny.toFixed(2)}`);
    const altText = parts.length > 0 ? `≈ ${parts.join(' · ')}` : null;

    return (
        <span className={className}>
            ₵{amountGhs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            {canShowAlternates && altText && (
                <span className="text-gray-500 text-[0.85em] ml-1">
                    {checkoutStyle ? ` (${altText})` : ` ${altText}`}
                </span>
            )}
        </span>
    );
}
