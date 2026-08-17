import { paystackAmountMatches } from './paystack-amount';

describe('paystackAmountMatches', () => {
    it('accepts matching GHS pesewas', () => {
        expect(paystackAmountMatches(10.5, 1050, 'GHS')).toBe(true);
        expect(paystackAmountMatches('10.50', 1050, 'ghs')).toBe(true);
    });

    it('rejects underpay, overpay, or wrong currency', () => {
        expect(paystackAmountMatches(10.5, 1000, 'GHS')).toBe(false);
        expect(paystackAmountMatches(10.5, 1050, 'NGN')).toBe(false);
        expect(paystackAmountMatches(0, 0, 'GHS')).toBe(false);
    });
});
