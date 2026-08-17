import { createHash, randomBytes, timingSafeEqual } from 'crypto';

export function createGuestAccessToken(): { token: string; hash: string } {
    const token = randomBytes(32).toString('hex');
    return { token, hash: hashGuestAccessToken(token) };
}

export function hashGuestAccessToken(token: string): string {
    return createHash('sha256').update(token, 'utf8').digest('hex');
}

export function guestAccessTokenMatches(token: string | undefined, hash: string | null | undefined): boolean {
    if (!token || !hash) return false;
    const computed = hashGuestAccessToken(token);
    try {
        const left = Buffer.from(computed, 'hex');
        const right = Buffer.from(hash, 'hex');
        if (left.length !== right.length) return false;
        return timingSafeEqual(left, right);
    } catch {
        return false;
    }
}
