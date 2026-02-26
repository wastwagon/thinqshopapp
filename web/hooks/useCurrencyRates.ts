'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';

const CACHE_KEY = 'currency_rates';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export type CurrencyRates = {
    ghs_to_usd: number | null;
    ghs_to_cny: number | null;
};

function getCached(): CurrencyRates | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (!raw) return null;
        const { data, ts } = JSON.parse(raw);
        if (Date.now() - ts > CACHE_TTL_MS) return null;
        return data;
    } catch {
        return null;
    }
}

function setCache(data: CurrencyRates) {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
    } catch {}
}

export function useCurrencyRates(): CurrencyRates | null {
    const [rates, setRates] = useState<CurrencyRates | null>(getCached);

    useEffect(() => {
        const cached = getCached();
        if (cached && cached.ghs_to_usd != null && cached.ghs_to_cny != null) {
            setRates(cached);
            return;
        }
        api.get<CurrencyRates>('/content/currency-rates')
            .then((res) => {
                const d = res.data;
                if (d && (d.ghs_to_usd != null || d.ghs_to_cny != null)) {
                    const out = {
                        ghs_to_usd: d.ghs_to_usd ?? null,
                        ghs_to_cny: d.ghs_to_cny ?? null,
                    };
                    setRates(out);
                    if (out.ghs_to_usd != null || out.ghs_to_cny != null) setCache(out);
                }
            })
            .catch(() => {});
    }, []);

    return rates;
}
