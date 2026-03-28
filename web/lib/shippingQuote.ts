/**
 * Pure helpers for admin Shipping Calculator (quote math, FX, rate typing).
 * Kept framework-free for unit tests.
 */

export type ShippingMode = 'sea' | 'air';
export type DimensionUnit = 'cm' | 'm' | 'mm';

export const DEFAULT_INVOICE_CURRENCY = 'GHS';

/** Currencies allowed for invoice line / dropdown */
export const INVOICE_CURRENCY_OPTIONS = ['GHS', 'USD', 'RMB', 'EUR'] as const;
export type InvoiceCurrencyOption = (typeof INVOICE_CURRENCY_OPTIONS)[number];

export interface InvoiceRate {
    id: number;
    name: string;
    unit: string;
    rate_per_unit: number;
    mode: string | null;
    is_active: boolean;
}

export interface FreightRateRow {
    id: number;
    rate_id: string;
    method: string;
    name: string;
    price: string | number;
    type: string;
    duration: string | null;
    currency?: string | null;
    is_active: boolean;
}

export type UnifiedQuote = {
    key: string;
    source: 'invoice' | 'freight';
    invoice?: InvoiceRate;
    freight?: FreightRateRow;
};

export function freightInvoiceCurrency(fr: FreightRateRow): string {
    const raw = (fr.currency || '').trim().toUpperCase();
    if (raw === 'CNY' || raw === 'RMB') return 'RMB';
    if (['air_phone', 'air_laptop'].includes(fr.rate_id)) return 'RMB';
    if (raw === 'EUR') return 'EUR';
    return raw || 'USD';
}

export function freightSymbol(fr: FreightRateRow): string {
    if (fr.currency === 'RMB' || fr.currency === 'CNY' || ['air_phone', 'air_laptop'].includes(fr.rate_id)) return '¥';
    return '$';
}

export function buildUnifiedQuotes(mode: ShippingMode, invoiceRates: InvoiceRate[], freightRates: FreightRateRow[]): UnifiedQuote[] {
    const out: UnifiedQuote[] = [];
    for (const r of freightRates) {
        if (!r.is_active) continue;
        if (mode === 'air' && r.method === 'air_freight' && ['KG', 'UNIT'].includes(r.type)) {
            out.push({ key: `fr:${r.id}`, source: 'freight', freight: r });
        }
        if (mode === 'sea' && r.method === 'sea_freight' && r.type === 'CBM') {
            out.push({ key: `fr:${r.id}`, source: 'freight', freight: r });
        }
    }
    for (const r of invoiceRates) {
        const m = (r.mode || '').toLowerCase();
        const u = (r.unit || '').toLowerCase();
        if (mode === 'air' && (m === 'air' || !m) && u === 'kg') {
            out.push({ key: `inv:${r.id}`, source: 'invoice', invoice: r });
        }
        if (mode === 'sea' && (m === 'sea' || !m) && u === 'cbm') {
            out.push({ key: `inv:${r.id}`, source: 'invoice', invoice: r });
        }
    }
    return out;
}

/** Convert dimensions to cubic meters (CBM) */
export function toCBM(length: number, width: number, height: number, unit: DimensionUnit): number {
    const l = length || 0,
        w = width || 0,
        h = height || 0;
    if (unit === 'cm') return (l * w * h) / 1_000_000;
    if (unit === 'm') return l * w * h;
    if (unit === 'mm') return (l * w * h) / 1_000_000_000;
    return (l * w * h) / 1_000_000;
}

export function normalizeCurrencyCode(c: string): string {
    return (c || '').trim().toUpperCase();
}

/** True when quote was computed in a different currency than the invoice line */
export function needsFxConversion(nativeCurrency: string | null | undefined, invoiceCurrency: string): boolean {
    if (nativeCurrency == null || nativeCurrency === '') return false;
    return normalizeCurrencyCode(nativeCurrency) !== normalizeCurrencyCode(invoiceCurrency);
}

/**
 * `fxInvoicePerNative` = how many units of invoice currency for 1 unit of native quote currency.
 * Example: native USD, invoice GHS, fx=15 → 1 USD = 15 GHS; line = nativeAmount * 15.
 */
export function parseFxInvoicePerNative(fxInvoicePerNativeStr: string): number | null {
    const raw = fxInvoicePerNativeStr.trim().replace(',', '.');
    if (raw === '') return null;
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0) return null;
    return n;
}

export type InvoiceConversionResult = {
    /** Amount in invoice currency for the line (before discount/tax) */
    amount: number | null;
    /** User must supply FX when conversion is required */
    needsFx: boolean;
    error: string | null;
};

export function invoiceLineAmountFromQuote(
    nativeAmount: number | null,
    nativeCurrency: string | null,
    invoiceCurrency: string,
    fxInvoicePerNativeStr: string,
): InvoiceConversionResult {
    if (nativeAmount == null || nativeAmount < 0) {
        return { amount: null, needsFx: false, error: null };
    }
    const inv = normalizeCurrencyCode(invoiceCurrency);
    const nat = nativeCurrency == null ? '' : normalizeCurrencyCode(nativeCurrency);

    if (!nat || nat === inv) {
        return { amount: nativeAmount, needsFx: false, error: null };
    }

    const fx = parseFxInvoicePerNative(fxInvoicePerNativeStr);
    if (fx == null) {
        return {
            amount: null,
            needsFx: true,
            error: `Enter how many ${inv} equal 1 ${nat} (e.g. 1 ${nat} = ? ${inv}).`,
        };
    }
    return { amount: nativeAmount * fx, needsFx: true, error: null };
}

export function formatFxHint(nativeCurrency: string, invoiceCurrency: string): string {
    const n = normalizeCurrencyCode(nativeCurrency);
    const i = normalizeCurrencyCode(invoiceCurrency);
    return `1 ${n} = how many ${i}?`;
}
