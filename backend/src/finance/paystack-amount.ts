/** Paystack amounts are the smallest currency unit (pesewas for GHS). */

export function paystackAmountMatches(
    storedGhs: unknown,
    paystackMinor: unknown,
    currency?: unknown,
): boolean {
    const expected = Math.round(Number(storedGhs) * 100);
    const got = Number(paystackMinor);
    if (!Number.isFinite(expected) || expected <= 0 || !Number.isInteger(got) || got <= 0) {
        return false;
    }
    if (currency != null && String(currency).toUpperCase() !== 'GHS') {
        return false;
    }
    return expected === got;
}
