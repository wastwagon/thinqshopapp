import { describe, it, expect, beforeEach } from 'vitest';
import {
    addOrIncrementGuestLine,
    guestCartItemId,
    mergeGuestCart,
    parseGuestCart,
    readGuestCart,
    resetGuestCartMergeForTests,
    setGuestLineQuantity,
    snapshotProduct,
    writeGuestCart,
} from './guest-cart';

const camera = {
    id: 12,
    name: 'Pocket camera',
    price: 499,
    images: ['cam.jpg'],
};

describe('guestCartItemId', () => {
    it('uses a negative id that encodes product and variant', () => {
        expect(guestCartItemId(12, 3)).toBe(-(12 * 100000 + 3));
        expect(guestCartItemId(12)).toBe(-(12 * 100000));
    });
});

describe('snapshotProduct', () => {
    it('parses currency-formatted prices instead of storing 0', () => {
        expect(snapshotProduct({ id: 1, name: 'Lens', price: '$1,234.50' })?.price).toBe(1234.5);
        expect(snapshotProduct({ id: 1, name: 'Lens', price: '499.00' })?.price).toBe(499);
    });
});

describe('parseGuestCart', () => {
    it('returns [] for junk', () => {
        expect(parseGuestCart(null)).toEqual([]);
        expect(parseGuestCart('{')).toEqual([]);
        expect(parseGuestCart('{}')).toEqual([]);
    });

    it('keeps valid lines and drops broken ones', () => {
        const items = parseGuestCart(
            JSON.stringify([
                { product: camera, quantity: 2, variant_id: null },
                { product: { name: 'no id' }, quantity: 1 },
            ]),
        );
        expect(items).toHaveLength(1);
        expect(items[0].product_id).toBe(12);
        expect(items[0].quantity).toBe(2);
        expect(items[0].id).toBe(guestCartItemId(12));
    });
});

describe('addOrIncrementGuestLine', () => {
    it('adds a new line then increments the same product/variant', () => {
        const product = snapshotProduct(camera)!;
        const once = addOrIncrementGuestLine([], { product, quantity: 1 });
        const twice = addOrIncrementGuestLine(once, { product, quantity: 2 });
        expect(twice).toHaveLength(1);
        expect(twice[0].quantity).toBe(3);
    });

    it('keeps different variants as separate lines', () => {
        const product = snapshotProduct(camera)!;
        const items = addOrIncrementGuestLine(
            addOrIncrementGuestLine([], { product, quantity: 1, variantId: 1 }),
            { product, quantity: 1, variantId: 2 },
        );
        expect(items).toHaveLength(2);
    });
});

describe('setGuestLineQuantity', () => {
    it('removes the line at qty 0', () => {
        const product = snapshotProduct(camera)!;
        const items = addOrIncrementGuestLine([], { product, quantity: 2 });
        expect(setGuestLineQuantity(items, items[0].id, 0)).toEqual([]);
    });
});

describe('mergeGuestCart', () => {
    beforeEach(() => {
        resetGuestCartMergeForTests();
        writeGuestCart([]);
    });

    it('posts the batch once while a merge is in flight', async () => {
        const product = snapshotProduct(camera)!;
        const items = addOrIncrementGuestLine([], { product, quantity: 2 });
        let calls = 0;
        let release!: () => void;
        const gate = new Promise<void>((resolve) => {
            release = resolve;
        });
        const postAll = async (lines: { product_id: number }[]) => {
            calls += 1;
            await gate;
            return { posted: lines.length, failed: 0 };
        };
        const first = mergeGuestCart(postAll, items);
        const second = mergeGuestCart(postAll, items);
        release();
        await expect(first).resolves.toEqual({ posted: 1, failed: 0 });
        await expect(second).resolves.toEqual({ posted: 1, failed: 0 });
        expect(calls).toBe(1);
    });

    it('restores guest lines when the batch post throws', async () => {
        const product = snapshotProduct(camera)!;
        const items = addOrIncrementGuestLine([], { product, quantity: 1 });
        await expect(
            mergeGuestCart(async () => {
                throw new Error('nope');
            }, items),
        ).rejects.toThrow('nope');
        expect(readGuestCart()).toHaveLength(1);
    });
});
