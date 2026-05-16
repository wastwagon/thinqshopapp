import { describe, it, expect } from 'vitest';
import { roundGhs, formatGhs } from './money';

describe('money', () => {
    it('rounds to 2 decimal places', () => {
        expect(roundGhs(10.005)).toBe(10.01);
        expect(roundGhs(10.004)).toBe(10);
    });

    it('handles non-finite values', () => {
        expect(roundGhs(NaN)).toBe(0);
        expect(formatGhs(Infinity)).toBe('0.00');
    });

    it('formats GHS strings', () => {
        expect(formatGhs(12.5)).toBe('12.50');
    });
});
