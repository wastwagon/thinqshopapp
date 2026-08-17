'use client';

import { useCurrencyRates } from '@/hooks/useCurrencyRates';
import { useCurrency } from '@/context/CurrencyContext';
import { roundGhs } from '@/lib/money';

interface PriceDisplayProps {
    amountGhs: number;
    /** Show the GHS amount (e.g. what Paystack will charge). Display conversion still uses CurrencyContext by default. */
    forceGhs?: boolean;
    className?: string;
}

export default function PriceDisplay({
    amountGhs,
    forceGhs = false,
    className = '',
}: PriceDisplayProps) {
    const rates = useCurrencyRates();
    const { currency } = useCurrency();

    const ghs = roundGhs(amountGhs);

    if (forceGhs) {
        return (
            <span className={className}>
                ₵{ghs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
        );
    }

    const usd = rates?.ghs_to_usd != null ? roundGhs(ghs * rates.ghs_to_usd) : null;
    const cny = rates?.ghs_to_cny != null ? roundGhs(ghs * rates.ghs_to_cny) : null;

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
            ₵{ghs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
    );
}
