/** httpOnly JWT cookie — Edge-safe. Do not import Node-only modules here. */

import { jwtVerify } from 'jose';

export const ACCESS_COOKIE = 'thinq_access';
export const ACCESS_MAX_AGE_SEC = 60 * 60 * 24 * 90;

export type AccessClaims = {
    sub: number;
    role: string;
    email: string;
};

export function isAdminRole(role: string | undefined | null): boolean {
    const normalized = (role || '').toLowerCase().replace(/[\s-]/g, '_');
    return normalized === 'admin' || normalized === 'superadmin' || normalized === 'super_admin';
}

/** Bracket access so Next.js Edge middleware does not inline an empty secret at Docker build time. */
export function jwtSecret(): string {
    return (process.env['JWT_SECRET'] || process.env.JWT_SECRET || '').trim();
}

function claimsFromPayload(payload: { sub?: unknown; role?: unknown; email?: unknown; exp?: unknown }): AccessClaims | null {
    const sub = Number(payload.sub);
    if (!Number.isInteger(sub) || sub <= 0) return null;
    if (typeof payload.exp === 'number' && payload.exp * 1000 < Date.now()) return null;
    return {
        sub,
        role: typeof payload.role === 'string' ? payload.role : 'user',
        email: typeof payload.email === 'string' ? payload.email : '',
    };
}

/** Decode JWT payload without verifying. Used only when Edge has no runtime secret. */
export function decodeAccessToken(token: string | undefined | null): AccessClaims | null {
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length < 2) return null;
    try {
        const json = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
        return claimsFromPayload(JSON.parse(json));
    } catch {
        return null;
    }
}

export async function verifyAccessToken(token: string | undefined | null): Promise<AccessClaims | null> {
    const secret = jwtSecret();
    if (!secret || !token) return null;
    try {
        const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
        return claimsFromPayload(payload);
    } catch {
        return null;
    }
}

/**
 * Middleware gate: verify when the secret is available (Node + correctly bundled Edge).
 * If Docker/Edge inlined an empty JWT_SECRET at build time, still honor a well-formed
 * cookie so a successful login is not immediately bounced to /login. API routes verify.
 */
export async function readAccessClaims(token: string | undefined | null): Promise<AccessClaims | null> {
    const verified = await verifyAccessToken(token);
    if (verified) return verified;
    if (jwtSecret()) return null;
    return decodeAccessToken(token);
}

/** Prefer X-Forwarded-Proto (Coolify/TLS proxy); fall back to the request URL. */
export function isSecureCookieRequest(requestUrl: string, forwardedProto?: string | null): boolean {
    if (process.env.COOKIE_SECURE === 'true') return true;
    if (process.env.COOKIE_SECURE === 'false') return false;
    const proto = (forwardedProto || '').split(',')[0].trim().toLowerCase();
    if (proto === 'https') return true;
    if (proto === 'http') return false;
    if (requestUrl.startsWith('https:')) return true;
    return process.env.NODE_ENV === 'production';
}

export function accessCookieHeader(token: string, requestUrl: string, forwardedProto?: string | null): string {
    const secure = isSecureCookieRequest(requestUrl, forwardedProto) ? '; Secure' : '';
    return `${ACCESS_COOKIE}=${token}; Path=/; Max-Age=${ACCESS_MAX_AGE_SEC}; HttpOnly; SameSite=Lax${secure}`;
}

export function expireAccessCookieHeader(requestUrl: string, forwardedProto?: string | null): string {
    const secure = isSecureCookieRequest(requestUrl, forwardedProto) ? '; Secure' : '';
    return `${ACCESS_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${secure}`;
}
