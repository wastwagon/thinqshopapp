/** Shared wholesale quantity + discount rules (keep in sync with web/lib/wholesale-pricing.ts). */

export type ResolveLinePricingInput = {
    listPrice: number;
    quantity: number;
    wholesaleMinQty?: number | string | null;
    wholesaleDiscountPct?: number | string | null;
    enforceMinQty?: boolean | null;
    stock?: number | null;
    isConsignment?: boolean | null;
};

export type LinePricing = {
    listUnitPrice: number;
    unitPrice: number;
    lineTotal: number;
    minQty: number;
    discountPct: number;
    purchaseMin: number;
    hasWholesaleDiscount: boolean;
    qualifiesWholesale: boolean;
    enforceMin: boolean;
    canPurchase: boolean;
    error: string | null;
};

function toNum(value: number | string | null | undefined): number {
    if (value == null || value === '') return 0;
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
}

function roundMoney(amount: number): number {
    if (!Number.isFinite(amount)) return 0;
    return Math.round(amount * 100) / 100;
}

export function resolveLinePricing(input: ResolveLinePricingInput): LinePricing {
    const listUnitPrice = roundMoney(Number(input.listPrice) || 0);
    const quantity = Math.max(0, Math.floor(Number(input.quantity) || 0));
    const minQty = Math.max(0, Math.floor(toNum(input.wholesaleMinQty)));
    const discountPct = Math.min(100, Math.max(0, toNum(input.wholesaleDiscountPct)));
    const isConsignment = Boolean(input.isConsignment);
    const enforceMin = Boolean(input.enforceMinQty) && !isConsignment && minQty >= 2;
    const purchaseMin = isConsignment ? 1 : enforceMin ? minQty : 1;
    const hasWholesaleDiscount = minQty > 0 && discountPct > 0;
    const qualifiesWholesale = hasWholesaleDiscount && quantity >= minQty;
    const unitPrice = roundMoney(
        qualifiesWholesale ? listUnitPrice * (1 - discountPct / 100) : listUnitPrice,
    );
    const lineTotal = roundMoney(unitPrice * quantity);

    let error: string | null = null;
    const stock = input.stock == null || input.stock === undefined ? null : Number(input.stock);
    const stockKnown = stock != null && Number.isFinite(stock);

    if (stockKnown && stock <= 0) {
        error = 'This item is out of stock';
    } else if (stockKnown && stock < purchaseMin) {
        error = `Not enough stock for the minimum order of ${purchaseMin}`;
    } else if (quantity < purchaseMin) {
        error = `Minimum order quantity is ${purchaseMin}`;
    } else if (stockKnown && quantity > stock) {
        error = `Only ${stock} available`;
    }

    return {
        listUnitPrice,
        unitPrice,
        lineTotal,
        minQty,
        discountPct,
        purchaseMin,
        hasWholesaleDiscount,
        qualifiesWholesale,
        enforceMin,
        canPurchase: error == null && quantity >= purchaseMin && quantity > 0,
        error,
    };
}

export type ProductWholesaleSource = {
    wholesale_min_quantity?: unknown;
    wholesale_discount_pct?: unknown;
    enforce_min_quantity?: unknown;
    is_consignment?: unknown;
};

export function resolveProductLinePricing(
    product: ProductWholesaleSource | null | undefined,
    opts: { listPrice: number; quantity: number; stock?: number | null },
): LinePricing {
    return resolveLinePricing({
        listPrice: opts.listPrice,
        quantity: opts.quantity,
        wholesaleMinQty: product?.wholesale_min_quantity != null ? Number(product.wholesale_min_quantity) : null,
        wholesaleDiscountPct:
            product?.wholesale_discount_pct != null ? Number(product.wholesale_discount_pct) : null,
        enforceMinQty: Boolean(product?.enforce_min_quantity),
        stock: opts.stock,
        isConsignment: Boolean(product?.is_consignment),
    });
}

export function purchaseQtyForAddToCart(product?: ProductWholesaleSource | null): number {
    return resolveProductLinePricing(product, { listPrice: 0, quantity: 1 }).purchaseMin;
}
