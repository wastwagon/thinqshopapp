import { describe, it, expect } from 'vitest';
import {
    cartesianProduct,
    regenerateVariantRows,
    reconstructAxesFromVariants,
    findVariantBySelections,
    optionValuesKey,
} from './variant-options';

describe('cartesianProduct', () => {
    it('builds Color × Size combinations', () => {
        const combos = cartesianProduct([
            { slug: 'color', name: 'Color', values: ['Red', 'Yellow'] },
            { slug: 'size', name: 'Size', values: ['M', 'L'] },
        ]);
        expect(combos).toHaveLength(4);
        expect(combos).toContainEqual({ color: 'Red', size: 'M' });
        expect(combos).toContainEqual({ color: 'Yellow', size: 'L' });
    });
});

describe('regenerateVariantRows', () => {
    it('preserves price when option values overlap', () => {
        const axes = [
            { slug: 'color', name: 'Color', values: ['Red', 'Yellow'] },
            { slug: 'size', name: 'Size', values: ['M'] },
        ];
        const previous = [
            {
                variant_type: 'color / size',
                variant_value: 'Red / M',
                option_values: { color: 'Red', size: 'M' },
                price_adjust: 12,
                stock_quantity: 3,
                sku: 'RM',
            },
        ];
        const { rows } = regenerateVariantRows(axes, previous);
        expect(rows).toHaveLength(2);
        const red = rows.find((r) => r.variant_value === 'Red / M');
        expect(red?.price_adjust).toBe(12);
        expect(red?.sku).toBe('RM');
        expect(red?.stock_quantity).toBe(3);
    });
});

describe('reconstructAxesFromVariants', () => {
    it('rebuilds axes from option_values', () => {
        const axes = reconstructAxesFromVariants([
            { option_values: { color: 'Red', size: 'M' } },
            { option_values: { color: 'Yellow', size: 'M' } },
        ]);
        expect(axes.map((a) => a.slug).sort()).toEqual(['color', 'size']);
    });
});

describe('findVariantBySelections', () => {
    it('matches by option_values key', () => {
        const variants = [
            { id: 1, option_values: { color: 'Red', size: 'M' } },
            { id: 2, option_values: { color: 'Yellow', size: 'L' } },
        ];
        expect(findVariantBySelections(variants, { color: 'Yellow', size: 'L' })?.id).toBe(2);
        expect(optionValuesKey({ color: 'Red', size: 'M' }, ['color', 'size'])).toBe('color=Red|size=M');
    });
});
