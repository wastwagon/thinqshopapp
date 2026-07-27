/** Client-readable session flags for Next.js middleware (not a secret; JWT stays in localStorage). */

export const SESSION_COOKIE = 'thinq_session';
export const ROLE_COOKIE = 'thinq_role';
/** Match JWT lifetime (90d) so middleware still sees a session after app relaunch. */
const MAX_AGE_SEC = 60 * 60 * 24 * 90;

export function isAdminRole(role: string | undefined | null): boolean {
    return role === 'admin' || role === 'superadmin';
}

function cookieAttrs(maxAge: number): string {
    // Secure helps WKWebView (iOS app) persist first-party cookies across launches on HTTPS.
    const secure =
        typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
    return `path=/; max-age=${maxAge}; SameSite=Lax${secure}`;
}

export function setSessionCookies(role: string | undefined | null): void {
    if (typeof document === 'undefined') return;
    const safeRole = (role || 'user').replace(/[^a-z0-9_-]/gi, '').slice(0, 32) || 'user';
    const attrs = cookieAttrs(MAX_AGE_SEC);
    document.cookie = `${SESSION_COOKIE}=1; ${attrs}`;
    document.cookie = `${ROLE_COOKIE}=${encodeURIComponent(safeRole)}; ${attrs}`;
}

export function clearSessionCookies(): void {
    if (typeof document === 'undefined') return;
    const attrs = cookieAttrs(0);
    document.cookie = `${SESSION_COOKIE}=; ${attrs}`;
    document.cookie = `${ROLE_COOKIE}=; ${attrs}`;
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
