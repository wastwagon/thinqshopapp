import { describe, it, expect } from 'vitest';
import { purchaseQtyForAddToCart, resolveLinePricing } from './wholesale-pricing';

const base = {
    listPrice: 100,
    wholesaleMinQty: 10,
    wholesaleDiscountPct: 15,
};

describe('resolveLinePricing', () => {
    it('sells qty 1 at list when toggle is off', () => {
        const p = resolveLinePricing({ ...base, quantity: 1, enforceMinQty: false });
        expect(p.purchaseMin).toBe(1);
        expect(p.unitPrice).toBe(100);
        expect(p.qualifiesWholesale).toBe(false);
        expect(p.canPurchase).toBe(true);
        expect(p.error).toBeNull();
    });

    it('applies discount at the wholesale threshold without requiring the pack toggle', () => {
        const p = resolveLinePricing({ ...base, quantity: 10, enforceMinQty: false });
        expect(p.qualifiesWholesale).toBe(true);
        expect(p.unitPrice).toBe(85);
        expect(p.lineTotal).toBe(850);
    });

    it('blocks qty below min when the pack toggle is on', () => {
        const p = resolveLinePricing({ ...base, quantity: 1, enforceMinQty: true });
        expect(p.purchaseMin).toBe(10);
        expect(p.canPurchase).toBe(false);
        expect(p.error).toBe('Minimum order quantity is 10');
    });

    it('allows the pack min and still applies discount', () => {
        const p = resolveLinePricing({ ...base, quantity: 10, enforceMinQty: true });
        expect(p.canPurchase).toBe(true);
        expect(p.unitPrice).toBe(85);
    });

    it('enforces min qty at list price when no discount is set', () => {
        const p = resolveLinePricing({
            listPrice: 40,
            quantity: 12,
            wholesaleMinQty: 12,
            wholesaleDiscountPct: null,
            enforceMinQty: true,
        });
        expect(p.hasWholesaleDiscount).toBe(false);
        expect(p.unitPrice).toBe(40);
        expect(p.canPurchase).toBe(true);
    });

    it('ignores pack enforcement on consignment listings', () => {
        const p = resolveLinePricing({
            ...base,
            quantity: 1,
            enforceMinQty: true,
            isConsignment: true,
            stock: 1,
        });
        expect(p.purchaseMin).toBe(1);
        expect(p.canPurchase).toBe(true);
    });

    it('treats stock below the pack min as unpurchasable', () => {
        const p = resolveLinePricing({ ...base, quantity: 10, enforceMinQty: true, stock: 7 });
        expect(p.canPurchase).toBe(false);
        expect(p.error).toBe('Not enough stock for the minimum order of 10');
    });

    it('uses out of stock when none remain', () => {
        const p = resolveLinePricing({ listPrice: 100, quantity: 1, stock: 0 });
        expect(p.error).toBe('This item is out of stock');
    });

    it('rounds the discounted unit price before line total', () => {
        const p = resolveLinePricing({
            listPrice: 99.99,
            quantity: 10,
            wholesaleMinQty: 10,
            wholesaleDiscountPct: 15,
        });
        expect(p.unitPrice).toBe(84.99);
        expect(p.lineTotal).toBe(849.9);
    });
});

describe('purchaseQtyForAddToCart', () => {
    it('uses the pack min when enforcement is on', () => {
        expect(
            purchaseQtyForAddToCart({
                wholesale_min_quantity: 10,
                enforce_min_quantity: true,
            }),
        ).toBe(10);
    });

    it('defaults to 1 when enforcement is off', () => {
        expect(
            purchaseQtyForAddToCart({
                wholesale_min_quantity: 10,
                enforce_min_quantity: false,
            }),
        ).toBe(1);
    });
});
