import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SignJWT } from 'jose';
import {
    accessCookieHeader,
    decodeAccessToken,
    isAdminRole,
    isSecureCookieRequest,
    readAccessClaims,
    verifyAccessToken,
} from './access-cookie';

const SECRET = 'test-jwt-secret-please-use-32chars!';

describe('verifyAccessToken', () => {
    const prev = process.env.JWT_SECRET;

    beforeEach(() => {
        process.env.JWT_SECRET = SECRET;
    });

    afterEach(() => {
        process.env.JWT_SECRET = prev;
    });

    it('accepts a valid HS256 JWT', async () => {
        const token = await new SignJWT({ role: 'admin', email: 'a@b.c' })
            .setProtectedHeader({ alg: 'HS256' })
            .setSubject('12')
            .setExpirationTime('2h')
            .sign(new TextEncoder().encode(SECRET));
        await expect(verifyAccessToken(token)).resolves.toEqual({
            sub: 12,
            role: 'admin',
            email: 'a@b.c',
        });
    });

    it('rejects a forged token', async () => {
        const token = await new SignJWT({ role: 'admin', email: 'a@b.c' })
            .setProtectedHeader({ alg: 'HS256' })
            .setSubject('12')
            .setExpirationTime('2h')
            .sign(new TextEncoder().encode('wrong-secret-not-the-server-key!!'));
        await expect(verifyAccessToken(token)).resolves.toBeNull();
    });

    it('rejects missing secret or token', async () => {
        process.env.JWT_SECRET = '';
        await expect(verifyAccessToken('anything')).resolves.toBeNull();
    });

    it('readAccessClaims falls back to decode when the Edge secret is missing', async () => {
        const token = await new SignJWT({ role: 'admin', email: 'a@b.c' })
            .setProtectedHeader({ alg: 'HS256' })
            .setSubject('12')
            .setExpirationTime('2h')
            .sign(new TextEncoder().encode(SECRET));
        process.env.JWT_SECRET = '';
        await expect(readAccessClaims(token)).resolves.toMatchObject({
            sub: 12,
            role: 'admin',
            email: 'a@b.c',
        });
        expect(decodeAccessToken(token)?.role).toBe('admin');
    });

    it('readAccessClaims still rejects a forged token when the secret is present', async () => {
        const token = await new SignJWT({ role: 'admin', email: 'a@b.c' })
            .setProtectedHeader({ alg: 'HS256' })
            .setSubject('12')
            .setExpirationTime('2h')
            .sign(new TextEncoder().encode('wrong-secret-not-the-server-key!!'));
        await expect(readAccessClaims(token)).resolves.toBeNull();
    });
});

describe('isAdminRole', () => {
    it('accepts admin role aliases used in production data', () => {
        expect(isAdminRole('admin')).toBe(true);
        expect(isAdminRole('superadmin')).toBe(true);
        expect(isAdminRole('super_admin')).toBe(true);
        expect(isAdminRole('super-admin')).toBe(true);
        expect(isAdminRole('user')).toBe(false);
        expect(isAdminRole(undefined)).toBe(false);
    });
});

describe('access cookie flags', () => {
    it('sets Secure when the proxy forwards https', () => {
        expect(isSecureCookieRequest('http://web:3000/api/session', 'https')).toBe(true);
        expect(accessCookieHeader('tok', 'http://web:3000/api/session', 'https')).toContain('Secure');
        expect(accessCookieHeader('tok', 'http://web:3000/api/session', 'https')).toContain('HttpOnly');
        expect(accessCookieHeader('tok', 'http://web:3000/api/session', 'https')).toContain('SameSite=Lax');
    });

    it('does not set Secure on local http', () => {
        const prev = process.env.COOKIE_SECURE;
        process.env.COOKIE_SECURE = 'false';
        expect(isSecureCookieRequest('http://localhost:7001/api/session', null)).toBe(false);
        expect(accessCookieHeader('tok', 'http://localhost:7001/api/session')).not.toContain('Secure');
        process.env.COOKIE_SECURE = prev;
    });

    it('forces Secure when COOKIE_SECURE=true', () => {
        const prev = process.env.COOKIE_SECURE;
        process.env.COOKIE_SECURE = 'true';
        expect(isSecureCookieRequest('http://web:3000/api/session', 'http')).toBe(true);
        process.env.COOKIE_SECURE = prev;
    });
});
