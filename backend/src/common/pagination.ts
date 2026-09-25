export function clampPage(value: unknown, fallback = 1): number {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 1) return fallback;
    return Math.min(Math.floor(n), 10_000);
}

export function clampLimit(value: unknown, fallback: number, max: number): number {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 1) return fallback;
    return Math.min(Math.floor(n), max);
}

/** Admin product list page sizes. Anything else falls back to 50. */
export function adminProductPageSize(value: unknown): 50 | 100 | 500 {
    const n = Number(value);
    if (n === 100 || n === 500) return n;
    return 50;
}
