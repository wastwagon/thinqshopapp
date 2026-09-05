/** Shared helpers for combinatorial product variants (admin + storefront). */

export type VariantOptionAxis = {
    slug: string;
    name: string;
    values: string[];
};

export type VariantRow = {
    variant_type: string;
    variant_value: string;
    option_values?: Record<string, string>;
    sku?: string;
    price_adjust?: number;
    stock_quantity?: number;
    image?: string;
};

export const MAX_VARIANT_COMBINATIONS = 200;

export function optionValuesKey(values: Record<string, string>, slugs: string[]): string {
    return slugs.map((s) => `${s}=${values[s] ?? ''}`).join('|');
}

export function cartesianProduct(axes: VariantOptionAxis[]): Record<string, string>[] {
    const usable = axes.filter((a) => a.slug && a.values.length > 0);
    if (usable.length === 0) return [];
    return usable.reduce<Record<string, string>[]>((acc, axis) => {
        if (acc.length === 0) {
            return axis.values.map((v) => ({ [axis.slug]: v }));
        }
        const next: Record<string, string>[] = [];
        for (const prev of acc) {
            for (const v of axis.values) {
                next.push({ ...prev, [axis.slug]: v });
            }
        }
        return next;
    }, []);
}

export function displayTypeFromAxes(axes: VariantOptionAxis[]): string {
    return axes.map((a) => a.slug).filter(Boolean).join(' / ');
}

export function displayValueFromCombo(combo: Record<string, string>, axes: VariantOptionAxis[]): string {
    return axes.map((a) => combo[a.slug] ?? '').filter(Boolean).join(' / ');
}

/** Rebuild variant rows from axes, preserving price/sku/stock for matching option_values. */
export function regenerateVariantRows(
    axes: VariantOptionAxis[],
    previous: VariantRow[],
): { rows: VariantRow[]; truncated: boolean } {
    const combos = cartesianProduct(axes);
    const truncated = combos.length > MAX_VARIANT_COMBINATIONS;
    const limited = truncated ? combos.slice(0, MAX_VARIANT_COMBINATIONS) : combos;
    const slugs = axes.map((a) => a.slug);
    const prevByKey = new Map<string, VariantRow>();
    for (const row of previous) {
        const ov = row.option_values;
        if (ov && typeof ov === 'object') {
            prevByKey.set(optionValuesKey(ov, Object.keys(ov).sort()), row);
        } else if (row.variant_type && row.variant_value && !row.variant_type.includes('/')) {
            // Legacy single-axis row
            prevByKey.set(optionValuesKey({ [row.variant_type]: row.variant_value }, [row.variant_type]), row);
        }
    }
    const typeLabel = displayTypeFromAxes(axes);
    const rows: VariantRow[] = limited.map((combo) => {
        const key = optionValuesKey(combo, slugs);
        const sortedKey = optionValuesKey(combo, [...slugs].sort());
        const prev = prevByKey.get(key) ?? prevByKey.get(sortedKey);
        return {
            variant_type: typeLabel || 'option',
            variant_value: displayValueFromCombo(combo, axes),
            option_values: { ...combo },
            sku: prev?.sku,
            price_adjust: prev?.price_adjust,
            stock_quantity: prev?.stock_quantity ?? 0,
            image: prev?.image,
        };
    });
    return { rows, truncated };
}

/** Reconstruct option axes from legacy single-type variant rows. */
export function reconstructAxesFromVariants(
    variants: Array<{ variant_type?: string; variant_value?: string; option_values?: Record<string, string> | null }>,
    catalog?: Array<{ slug: string; name: string }>,
): VariantOptionAxis[] {
    const withOptions = variants.filter((v) => v.option_values && typeof v.option_values === 'object');
    if (withOptions.length > 0) {
        const slugOrder: string[] = [];
        const valuesBySlug = new Map<string, Set<string>>();
        for (const v of withOptions) {
            const ov = v.option_values as Record<string, string>;
            for (const [slug, val] of Object.entries(ov)) {
                if (!valuesBySlug.has(slug)) {
                    valuesBySlug.set(slug, new Set());
                    slugOrder.push(slug);
                }
                if (val) valuesBySlug.get(slug)!.add(val);
            }
        }
        // Prefer order from first row's keys if consistent with type label
        const firstKeys = Object.keys(withOptions[0].option_values as Record<string, string>);
        const order = firstKeys.length ? firstKeys : slugOrder;
        return order.map((slug) => {
            const cat = catalog?.find((c) => c.slug === slug);
            return {
                slug,
                name: cat?.name ?? slug.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
                values: [...(valuesBySlug.get(slug) ?? [])],
            };
        });
    }

    const byType = new Map<string, Set<string>>();
    for (const v of variants) {
        const t = (v.variant_type || '').trim();
        const val = (v.variant_value || '').trim();
        if (!t || !val || t.includes('/')) continue;
        if (!byType.has(t)) byType.set(t, new Set());
        byType.get(t)!.add(val);
    }
    return [...byType.entries()].map(([slug, values]) => {
        const cat = catalog?.find((c) => c.slug === slug);
        return {
            slug,
            name: cat?.name ?? slug.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
            values: [...values],
        };
    });
}

export function findVariantBySelections(
    variants: Array<{ id?: number; option_values?: Record<string, string> | null; variant_type?: string; variant_value?: string }>,
    selections: Record<string, string>,
): (typeof variants)[number] | null {
    const slugs = Object.keys(selections);
    if (slugs.length === 0) return null;
    const key = optionValuesKey(selections, slugs);
    for (const v of variants) {
        const ov = v.option_values;
        if (ov && typeof ov === 'object') {
            if (optionValuesKey(ov as Record<string, string>, slugs) === key) return v;
        }
    }
    return null;
}
