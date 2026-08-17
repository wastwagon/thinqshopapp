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
