/** Guest bag in localStorage; merged into POST /cart after login. */

export const GUEST_CART_KEY = 'thinqshop_guest_cart';

export type GuestCartProduct = {
    id: number;
    name: string;
    price: number;
    images: string[];
    gallery_images?: string[];
    slug?: string;
    stock_quantity?: number;
    wholesale_min_quantity?: number | null;
    wholesale_discount_pct?: number | string | null;
    enforce_min_quantity?: boolean;
    is_consignment?: boolean;
    is_active?: boolean;
};

export type GuestCartVariant = {
    id?: number;
    variant_type: string;
    variant_value: string;
    price_adjust?: number | string;
    stock_quantity?: number;
};

export type GuestCartItem = {
    id: number;
    product_id: number;
    quantity: number;
    variant_id?: number | null;
    product: GuestCartProduct;
    variant?: GuestCartVariant | null;
};

export type MergeGuestCartResult = { posted: number; failed: number };

let mergeInflight: Promise<MergeGuestCartResult> | null = null;
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

function asStringArray(value: unknown): string[] {
    if (Array.isArray(value)) return value.map(String).filter(Boolean);
    if (typeof value === 'string' && value.trim()) {
        try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
        } catch {
            return [value];
        }
    }
    return [];
}

function parseMoney(value: unknown): number {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    const n = parseFloat(String(value ?? '').replace(/[^0-9.]/g, ''));
    return Number.isFinite(n) ? n : 0;
}

export function guestCartItemId(productId: number, variantId?: number | null): number {
    return -(Math.abs(productId) * 100000 + Math.abs(variantId ?? 0));
}

export function snapshotProduct(raw: unknown): GuestCartProduct | null {
    if (!isRecord(raw)) return null;
    const id = Number(raw.id);
    if (!Number.isInteger(id) || id <= 0) return null;
    const gallery = asStringArray(raw.gallery_images);
    const images = gallery.length ? gallery : asStringArray(raw.images);
    return {
        id,
        name: String(raw.name ?? ''),
        price: parseMoney(raw.price),
        images,
        gallery_images: gallery.length ? gallery : images,
        slug: raw.slug != null ? String(raw.slug) : undefined,
        stock_quantity: raw.stock_quantity != null ? Number(raw.stock_quantity) : undefined,
        wholesale_min_quantity:
            raw.wholesale_min_quantity == null ? null : Number(raw.wholesale_min_quantity),
        wholesale_discount_pct:
            raw.wholesale_discount_pct == null ? null : (raw.wholesale_discount_pct as number | string),
        enforce_min_quantity: Boolean(raw.enforce_min_quantity),
        is_consignment: Boolean(raw.is_consignment),
        is_active: raw.is_active == null ? true : Boolean(raw.is_active),
    };
}

export function pickVariant(rawProduct: unknown, variantId?: number | null): GuestCartVariant | null {
    if (variantId == null || !isRecord(rawProduct) || !Array.isArray(rawProduct.variants)) return null;
    const found = rawProduct.variants.find(
        (row) => isRecord(row) && Number(row.id) === Number(variantId),
    );
    return snapshotVariant(found);
}

export function snapshotVariant(raw: unknown): GuestCartVariant | null {
    if (!isRecord(raw)) return null;
    const type = raw.variant_type != null ? String(raw.variant_type) : '';
    const value = raw.variant_value != null ? String(raw.variant_value) : '';
    if (!type && !value) return null;
    return {
        id: raw.id != null ? Number(raw.id) : undefined,
        variant_type: type,
        variant_value: value,
        price_adjust: raw.price_adjust as number | string | undefined,
        stock_quantity: raw.stock_quantity != null ? Number(raw.stock_quantity) : undefined,
    };
}

export function parseGuestCart(raw: string | null | undefined): GuestCartItem[] {
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        const items: GuestCartItem[] = [];
        for (const row of parsed) {
            if (!isRecord(row)) continue;
            const product = snapshotProduct(row.product);
            if (!product) continue;
            const quantity = Math.max(1, Math.floor(Number(row.quantity) || 1));
            const variantId =
                row.variant_id == null || row.variant_id === '' ? null : Number(row.variant_id);
            const variant = snapshotVariant(row.variant);
            items.push({
                id: guestCartItemId(product.id, variantId),
                product_id: product.id,
                quantity,
                variant_id: Number.isFinite(variantId) ? variantId : null,
                product,
                variant,
            });
        }
        return items;
    } catch {
        return [];
    }
}

export function readGuestCart(): GuestCartItem[] {
    try {
        return parseGuestCart(guestStorage().getItem(GUEST_CART_KEY));
    } catch {
        return [];
    }
}

export function writeGuestCart(items: GuestCartItem[]): void {
    try {
        const store = guestStorage();
        if (!items.length) store.removeItem(GUEST_CART_KEY);
        else store.setItem(GUEST_CART_KEY, JSON.stringify(items));
    } catch {
        // Quota or private mode — bag stays in memory for this session.
    }
}

export function addOrIncrementGuestLine(
    items: GuestCartItem[],
    input: {
        product: GuestCartProduct;
        quantity: number;
        variantId?: number | null;
        variant?: GuestCartVariant | null;
    },
): GuestCartItem[] {
    const variantId = input.variantId ?? null;
    const addQty = Math.max(1, Math.floor(Number(input.quantity) || 1));
    const idx = items.findIndex(
        (item) => item.product_id === input.product.id && (item.variant_id ?? null) === variantId,
    );
    if (idx >= 0) {
        const next = items.slice();
        next[idx] = {
            ...next[idx],
            quantity: next[idx].quantity + addQty,
            product: input.product,
            variant: input.variant ?? next[idx].variant,
        };
        return next;
    }
    return [
        ...items,
        {
            id: guestCartItemId(input.product.id, variantId),
            product_id: input.product.id,
            quantity: addQty,
            variant_id: variantId,
            product: input.product,
            variant: input.variant ?? null,
        },
    ];
}

export function setGuestLineQuantity(
    items: GuestCartItem[],
    itemId: number,
    quantity: number,
): GuestCartItem[] {
    const qty = Math.floor(Number(quantity) || 0);
    if (qty <= 0) return items.filter((item) => item.id !== itemId);
    return items.map((item) => (item.id === itemId ? { ...item, quantity: qty } : item));
}

export async function mergeGuestCart(
    postAll: (items: GuestCartItem[]) => Promise<MergeGuestCartResult>,
    items: GuestCartItem[] = readGuestCart(),
): Promise<MergeGuestCartResult> {
    if (mergeInflight) return mergeInflight;
    if (!items.length) return { posted: 0, failed: 0 };
    writeGuestCart([]);
    mergeInflight = (async () => {
        try {
            return await postAll(items);
        } catch (error) {
            writeGuestCart(items);
            throw error;
        }
    })().finally(() => {
        mergeInflight = null;
    });
    return mergeInflight;
}

export function resetGuestCartMergeForTests(): void {
    mergeInflight = null;
}
