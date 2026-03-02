'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';
import type { DisplayCurrency } from '@/context/CurrencyContext';

const CURRENCIES: { code: DisplayCurrency; symbol: string; label: string; flag: string }[] = [
    { code: 'GHS', symbol: '₵', label: 'GHS', flag: '🇬🇭' },
    { code: 'USD', symbol: '$', label: 'USD', flag: '🇺🇸' },
    { code: 'CNY', symbol: '¥', label: 'CNY', flag: '🇨🇳' },
];

export default function CurrencySwitcher() {
    const { currency, setCurrency } = useCurrency();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const current = CURRENCIES.find((c) => c.code === currency) ?? CURRENCIES[0];

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="flex items-center gap-1 sm:gap-1.5 min-h-[44px] px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border border-gray-200 bg-white hover:border-blue-200 hover:bg-blue-50/50 transition-all text-sm font-semibold text-gray-700 hover:text-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 min-w-[56px] sm:min-w-[72px] justify-between shrink-0"
                aria-expanded={open}
                aria-haspopup="listbox"
                aria-label={`Currency: ${current.label}. Click to change`}
            >
                <span className="flex items-center gap-1 sm:gap-1.5">
                    <span className="text-sm sm:text-base leading-none" aria-hidden>{current.flag}</span>
                    <span className="text-sm sm:text-base font-bold text-blue-600">{current.symbol}</span>
                    <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline">{current.label}</span>
                </span>
                <ChevronDown className={`h-3 sm:h-3.5 w-3 sm:w-3.5 text-gray-400 transition-transform shrink-0 ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div
                    role="listbox"
                    aria-label="Select currency"
                    className="absolute right-0 top-full mt-2 pt-2 z-[100] w-[min(200px,90vw)]"
                >
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                        {CURRENCIES.map((c) => (
                            <button
                                key={c.code}
                                role="option"
                                aria-selected={currency === c.code}
                                onClick={() => {
                                    setCurrency(c.code);
                                    setOpen(false);
                                }}
                                className={`w-full min-h-[44px] flex items-center gap-3 px-4 py-3 text-left transition-all ${
                                    currency === c.code
                                        ? 'bg-blue-50 text-blue-700 font-bold'
                                        : 'bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                <span className="text-xl leading-none" aria-hidden>{c.flag}</span>
                                <span className="text-lg font-bold text-blue-600">{c.symbol}</span>
                                <span className="text-sm font-semibold">{c.label}</span>
                                {currency === c.code && (
                                    <span className="ml-auto text-xs font-bold uppercase tracking-wider text-blue-600">✓</span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
