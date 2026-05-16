/** Consistent GHS rounding for UI totals (2 decimal places). */
export function roundGhs(amount: number): number {
    if (!Number.isFinite(amount)) return 0;
    return Math.round(amount * 100) / 100;
}

export function formatGhs(amount: number): string {
    return roundGhs(amount).toFixed(2);
}
