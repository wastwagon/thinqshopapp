import { resolveLinePricing } from './wholesale-pricing';

describe('resolveLinePricing', () => {
    const base = {
        listPrice: 100,
        wholesaleMinQty: 10,
        wholesaleDiscountPct: 15,
    };

    it('sells qty 1 at list when toggle is off', () => {
        const p = resolveLinePricing({ ...base, quantity: 1, enforceMinQty: false });
        expect(p.purchaseMin).toBe(1);
        expect(p.unitPrice).toBe(100);
        expect(p.canPurchase).toBe(true);
    });

    it('applies discount at threshold when toggle is off', () => {
        const p = resolveLinePricing({ ...base, quantity: 10, enforceMinQty: false });
        expect(p.unitPrice).toBe(85);
        expect(p.lineTotal).toBe(850);
    });

    it('rejects qty below min when toggle is on', () => {
        const p = resolveLinePricing({ ...base, quantity: 1, enforceMinQty: true });
        expect(p.error).toBe('Minimum order quantity is 10');
    });

    it('charges discounted pack price at the min', () => {
        const p = resolveLinePricing({ ...base, quantity: 10, enforceMinQty: true });
        expect(p.canPurchase).toBe(true);
        expect(p.unitPrice).toBe(85);
    });
});
