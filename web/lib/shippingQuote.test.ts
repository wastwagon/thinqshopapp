import { describe, it, expect } from 'vitest';
import {
    freightInvoiceCurrency,
    buildUnifiedQuotes,
    toCBM,
    needsFxConversion,
    parseFxInvoicePerNative,
    invoiceLineAmountFromQuote,
    formatFxHint,
    DEFAULT_INVOICE_CURRENCY,
} from './shippingQuote';

describe('freightInvoiceCurrency', () => {
    it('maps CNY to RMB', () => {
        expect(freightInvoiceCurrency({ currency: 'CNY' } as any)).toBe('RMB');
    });
    it('uses USD when empty', () => {
        expect(
            freightInvoiceCurrency({
                rate_id: 'x',
                currency: null,
            } as any),
        ).toBe('USD');
    });
    it('uses RMB for legacy rate ids', () => {
        expect(
            freightInvoiceCurrency({
                rate_id: 'air_phone',
                currency: null,
            } as any),
        ).toBe('RMB');
    });
});

describe('buildUnifiedQuotes', () => {
    const inv: any[] = [
        { id: 1, mode: 'air', unit: 'kg', is_active: true },
        { id: 2, mode: 'sea', unit: 'cbm', is_active: true },
    ];
    const fr: any[] = [
        { id: 10, method: 'air_freight', type: 'KG', is_active: true },
        { id: 11, method: 'sea_freight', type: 'CBM', is_active: true },
    ];
    it('air lists freight KG then invoice kg', () => {
        const q = buildUnifiedQuotes('air', inv, fr);
        expect(q.map((x) => x.key)).toEqual(['fr:10', 'inv:1']);
    });
    it('sea lists freight CBM then invoice cbm', () => {
        const q = buildUnifiedQuotes('sea', inv, fr);
        expect(q.map((x) => x.key)).toEqual(['fr:11', 'inv:2']);
    });
});

describe('toCBM', () => {
    it('converts cm', () => {
        expect(toCBM(100, 100, 100, 'cm')).toBeCloseTo(1, 5);
    });
});

describe('parseFxInvoicePerNative', () => {
    it('accepts positive decimals', () => {
        expect(parseFxInvoicePerNative('15.5')).toBe(15.5);
    });
    it('rejects zero and negative', () => {
        expect(parseFxInvoicePerNative('0')).toBeNull();
        expect(parseFxInvoicePerNative('-1')).toBeNull();
    });
    it('rejects empty', () => {
        expect(parseFxInvoicePerNative('')).toBeNull();
    });
});

describe('invoiceLineAmountFromQuote', () => {
    it('passes through when currencies match', () => {
        const r = invoiceLineAmountFromQuote(100, 'GHS', 'GHS', '');
        expect(r.amount).toBe(100);
        expect(r.needsFx).toBe(false);
        expect(r.error).toBeNull();
    });
    it('multiplies when FX provided', () => {
        const r = invoiceLineAmountFromQuote(100, 'USD', 'GHS', '15');
        expect(r.amount).toBe(1500);
        expect(r.needsFx).toBe(true);
    });
    it('returns error when FX missing for cross-currency', () => {
        const r = invoiceLineAmountFromQuote(100, 'USD', 'GHS', '');
        expect(r.amount).toBeNull();
        expect(r.needsFx).toBe(true);
        expect(r.error).toContain('Enter');
    });
});

describe('needsFxConversion', () => {
    it('is false for same code', () => {
        expect(needsFxConversion('USD', 'usd')).toBe(false);
    });
    it('is true when different', () => {
        expect(needsFxConversion('USD', 'GHS')).toBe(true);
    });
});

describe('formatFxHint', () => {
    it('includes both codes', () => {
        expect(formatFxHint('USD', 'GHS')).toContain('USD');
        expect(formatFxHint('USD', 'GHS')).toContain('GHS');
    });
});

describe('DEFAULT_INVOICE_CURRENCY', () => {
    it('is GHS', () => {
        expect(DEFAULT_INVOICE_CURRENCY).toBe('GHS');
    });
});
