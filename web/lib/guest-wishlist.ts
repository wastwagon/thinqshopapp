/** Guest wishlist in localStorage; merged into POST /wishlist after login. */

import { snapshotProduct } from './guest-cart';

export const GUEST_WISHLIST_KEY = 'thinqshop_wishlist';

export type WishlistProduct = {
    id: number;
    name: string;
    price: string | number;
    slug?: string;
    images?: string[];
    gallery_images?: string[];
    category?: string | { name: string };
    wholesale_min_quantity?: number | string | null;
    wholesale_discount_pct?: number | string | null;
    enforce_min_quantity?: boolean;
    is_consignment?: boolean;
};

export type MergeGuestWishlistResult = { posted: number; failed: number };

let mergeInflight: Promise<MergeGuestWishlistResult> | null = null;
const memoryStore = new Map<string, string>();

function guestStorage(): {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
} {
    try {
        if (typeof globalThis.localStorage !== 'undefined' && globalThis.localStorage) {
            return globalThis.localStorage;
        }
    } catch {
        // Private mode or non-browser.
    }
    return {
        getItem: (key) => memoryStore.get(key) ?? null,
        setItem: (key, value) => {
            memoryStore.set(key, value);
        },
        removeItem: (key) => {
            memoryStore.delete(key);
        },
    };
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return !!value && typeof value === 'object';
}

export function mapWishlistProduct(raw: unknown): WishlistProduct | null {
    const source = isRecord(raw) && isRecord(raw.product) ? raw.product : raw;
    const snap = snapshotProduct(source);
    if (!snap) return null;
    const category = isRecord(source) ? source.category : undefined;
    return {
        id: snap.id,
        name: snap.name,
        price: snap.price,
        slug: snap.slug,
        images: snap.images,
        gallery_images: snap.gallery_images,
        category: category as WishlistProduct['category'],
        wholesale_min_quantity: snap.wholesale_min_quantity,
        wholesale_discount_pct: snap.wholesale_discount_pct,
        enforce_min_quantity: snap.enforce_min_quantity,
        is_consignment: snap.is_consignment,
    };
}

export function parseGuestWishlist(raw: string | null | undefined): WishlistProduct[] {
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        const seen = new Set<number>();
        const items: WishlistProduct[] = [];
        for (const row of parsed) {
            const product = mapWishlistProduct(row);
            if (!product || seen.has(product.id)) continue;
            seen.add(product.id);
            items.push(product);
        }
        return items;
    } catch {
        return [];
    }
}

export function readGuestWishlist(): WishlistProduct[] {
    try {
        return parseGuestWishlist(guestStorage().getItem(GUEST_WISHLIST_KEY));
    } catch {
        return [];
    }
}

export function writeGuestWishlist(items: WishlistProduct[]): void {
    try {
        const store = guestStorage();
        if (!items.length) store.removeItem(GUEST_WISHLIST_KEY);
        else store.setItem(GUEST_WISHLIST_KEY, JSON.stringify(items));
    } catch {
        // Quota or private mode.
    }
}

export function addGuestWishlistItem(
    items: WishlistProduct[],
    product: WishlistProduct,
): WishlistProduct[] {
    if (items.some((item) => item.id === product.id)) return items;
    return [...items, product];
}

export function removeGuestWishlistItem(items: WishlistProduct[], productId: number): WishlistProduct[] {
    return items.filter((item) => item.id !== productId);
}

export function mapServerWishlist(rows: unknown): WishlistProduct[] {
    if (!Array.isArray(rows)) return [];
    return rows.flatMap((row) => {
        const product = mapWishlistProduct(row);
        return product ? [product] : [];
    });
}

export async function mergeGuestWishlist(
    postAll: (items: WishlistProduct[]) => Promise<MergeGuestWishlistResult>,
    items: WishlistProduct[] = readGuestWishlist(),
): Promise<MergeGuestWishlistResult> {
    if (mergeInflight) return mergeInflight;
    if (!items.length) return { posted: 0, failed: 0 };
    writeGuestWishlist([]);
    mergeInflight = (async () => {
        try {
            return await postAll(items);
        } catch (error) {
            writeGuestWishlist(items);
            throw error;
        }
    })().finally(() => {
        mergeInflight = null;
    });
    return mergeInflight;
}

export function resetGuestWishlistMergeForTests(): void {
    mergeInflight = null;
}
