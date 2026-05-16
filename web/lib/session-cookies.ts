/** Client-readable session flags for Next.js middleware (not a secret; JWT stays in localStorage). */

export const SESSION_COOKIE = 'thinq_session';
export const ROLE_COOKIE = 'thinq_role';
const MAX_AGE_SEC = 60 * 60 * 24 * 7;

export function isAdminRole(role: string | undefined | null): boolean {
    return role === 'admin' || role === 'superadmin';
}

export function setSessionCookies(role: string | undefined | null): void {
    if (typeof document === 'undefined') return;
    const safeRole = (role || 'user').replace(/[^a-z0-9_-]/gi, '').slice(0, 32) || 'user';
    document.cookie = `${SESSION_COOKIE}=1; path=/; max-age=${MAX_AGE_SEC}; SameSite=Lax`;
    document.cookie = `${ROLE_COOKIE}=${encodeURIComponent(safeRole)}; path=/; max-age=${MAX_AGE_SEC}; SameSite=Lax`;
}

export function clearSessionCookies(): void {
    if (typeof document === 'undefined') return;
    document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0`;
    document.cookie = `${ROLE_COOKIE}=; path=/; max-age=0`;
}

export function readRoleFromCookieHeader(cookieHeader: string | null | undefined): string | null {
    if (!cookieHeader) return null;
    const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${ROLE_COOKIE}=([^;]*)`));
    if (!match?.[1]) return null;
    try {
        return decodeURIComponent(match[1]);
    } catch {
        return match[1];
    }
}
