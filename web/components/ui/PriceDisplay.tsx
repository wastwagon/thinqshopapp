'use client';

import { useCurrencyRates } from '@/hooks/useCurrencyRates';
import { useCurrency } from '@/context/CurrencyContext';

interface PriceDisplayProps {
    amountGhs: number;
    showAlternates?: boolean;
    /** For checkout: always show GHS (the amount that will be charged) */
    forceGhs?: boolean;
    /** @deprecated use forceGhs */
    checkoutStyle?: boolean;
    className?: string;
}

export default function PriceDisplay({
    amountGhs,
    showAlternates = true,
    forceGhs = false,
    checkoutStyle = false,
    className = '',
}: PriceDisplayProps) {
    const rates = useCurrencyRates();
    const { currency } = useCurrency();

    const alwaysGhs = forceGhs || checkoutStyle;

    if (alwaysGhs) {
        return (
            <span className={className}>
                ₵{amountGhs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
        );
    }

    const usd = rates?.ghs_to_usd != null ? amountGhs * rates.ghs_to_usd : null;
    const cny = rates?.ghs_to_cny != null ? amountGhs * rates.ghs_to_cny : null;

    if (currency === 'USD' && usd != null) {
        return (
            <span className={className}>
                ${usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
        );
    }

    if (currency === 'CNY' && cny != null) {
        return (
            <span className={className}>
                ¥{cny.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
        );
    }

    return (
        <span className={className}>
            ₵{amountGhs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
    );
}
