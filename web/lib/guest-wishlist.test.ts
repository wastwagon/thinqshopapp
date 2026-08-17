import { describe, it, expect, beforeEach } from 'vitest';
import {
    addGuestWishlistItem,
    mapServerWishlist,
    mergeGuestWishlist,
    parseGuestWishlist,
    readGuestWishlist,
    removeGuestWishlistItem,
    resetGuestWishlistMergeForTests,
    writeGuestWishlist,
} from './guest-wishlist';

const camera = {
    id: 12,
    name: 'Pocket camera',
    price: 499,
    images: ['cam.jpg'],
};

describe('parseGuestWishlist', () => {
    it('keeps the existing device format (product objects, not cart lines)', () => {
        const items = parseGuestWishlist(JSON.stringify([camera, { name: 'no id' }]));
        expect(items).toHaveLength(1);
        expect(items[0].id).toBe(12);
        expect(items[0].name).toBe('Pocket camera');
    });

    it('dedupes by product id', () => {
        const items = parseGuestWishlist(JSON.stringify([camera, camera]));
        expect(items).toHaveLength(1);
    });
});

describe('guest wishlist mutations', () => {
    it('adds once and removes by id', () => {
        const once = addGuestWishlistItem([], camera);
        const twice = addGuestWishlistItem(once, camera);
        expect(twice).toHaveLength(1);
        expect(removeGuestWishlistItem(twice, 12)).toEqual([]);
    });
});

describe('mapServerWishlist', () => {
    it('unwraps API rows that include product', () => {
        const items = mapServerWishlist([{ id: 99, product: camera }]);
        expect(items[0].id).toBe(12);
        expect(items[0].name).toBe('Pocket camera');
    });
});

describe('mergeGuestWishlist', () => {
    beforeEach(() => {
        resetGuestWishlistMergeForTests();
        writeGuestWishlist([]);
    });

    it('posts the batch once while a merge is in flight', async () => {
        let calls = 0;
        let release!: () => void;
        const gate = new Promise<void>((resolve) => {
            release = resolve;
        });
        const postAll = async (items: { id: number }[]) => {
            calls += 1;
            await gate;
            return { posted: items.length, failed: 0 };
        };
        const first = mergeGuestWishlist(postAll, [camera]);
        const second = mergeGuestWishlist(postAll, [camera]);
        release();
        await expect(first).resolves.toEqual({ posted: 1, failed: 0 });
        await expect(second).resolves.toEqual({ posted: 1, failed: 0 });
        expect(calls).toBe(1);
    });

    it('restores guest products when the batch post throws', async () => {
        await expect(
            mergeGuestWishlist(async () => {
                throw new Error('nope');
            }, [camera]),
        ).rejects.toThrow('nope');
        expect(readGuestWishlist()).toHaveLength(1);
    });
});
