'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type DisplayCurrency = 'GHS' | 'USD' | 'CNY';

const STORAGE_KEY = 'thinqshop_display_currency';

interface CurrencyContextType {
    currency: DisplayCurrency;
    setCurrency: (c: DisplayCurrency) => void;
}

const CurrencyContext = createContext<CurrencyContextType | null>(null);

function getStored(): DisplayCurrency {
    if (typeof window === 'undefined') return 'GHS';
    try {
        const v = localStorage.getItem(STORAGE_KEY);
        if (v === 'USD' || v === 'CNY' || v === 'GHS') return v;
    } catch {}
    return 'GHS';
}

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
    const [currency, setCurrencyState] = useState<DisplayCurrency>(getStored);

    const setCurrency = useCallback((c: DisplayCurrency) => {
        setCurrencyState(c);
        try {
            localStorage.setItem(STORAGE_KEY, c);
        } catch {}
    }, []);

    useEffect(() => {
        const handleStorage = (e: StorageEvent) => {
            if (e.key === STORAGE_KEY && e.newValue && (e.newValue === 'GHS' || e.newValue === 'USD' || e.newValue === 'CNY')) {
                setCurrencyState(e.newValue);
            }
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    return (
        <CurrencyContext.Provider value={{ currency, setCurrency }}>
            {children}
        </CurrencyContext.Provider>
    );
}

export function useCurrency() {
    const ctx = useContext(CurrencyContext);
    return ctx ?? { currency: 'GHS' as DisplayCurrency, setCurrency: () => {} };
}
