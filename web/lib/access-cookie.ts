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
    return role === 'admin' || role === 'superadmin';
}

export async function verifyAccessToken(token: string | undefined | null): Promise<AccessClaims | null> {
    const secret = process.env.JWT_SECRET;
    if (!secret || !token) return null;
    try {
        const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
        const sub = Number(payload.sub);
        if (!Number.isInteger(sub) || sub <= 0) return null;
        if (payload.exp && payload.exp * 1000 < Date.now()) return null;
        return {
            sub,
            role: typeof payload.role === 'string' ? payload.role : 'user',
            email: typeof payload.email === 'string' ? payload.email : '',
        };
    } catch {
        return null;
    }
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
