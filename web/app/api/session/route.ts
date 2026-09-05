import { NextRequest, NextResponse } from 'next/server';
import {
    ACCESS_COOKIE,
    accessCookieHeader,
    expireAccessCookieHeader,
    jwtSecret,
    verifyAccessToken,
} from '@/lib/access-cookie';
import { ensureJwtSecretLoaded } from '@/lib/load-jwt-secret';
import { gateSessionMutation, noStore } from '@/lib/session-guard';

function sessionSecretMissing() {
    ensureJwtSecretLoaded();
    if (jwtSecret()) return null;
    return noStore(NextResponse.json({ message: 'Session signing is not configured' }, { status: 500 }));
}

export async function GET(request: NextRequest) {
    const misconfigured = sessionSecretMissing();
    if (misconfigured) return misconfigured;

    const claims = await verifyAccessToken(request.cookies.get(ACCESS_COOKIE)?.value);
    if (!claims) {
        return noStore(NextResponse.json({ authenticated: false }, { status: 401 }));
    }
    return noStore(NextResponse.json({ authenticated: true, ...claims }));
}

export async function POST(request: NextRequest) {
    const blocked = gateSessionMutation(request);
    if (blocked) return noStore(blocked);

    const misconfigured = sessionSecretMissing();
    if (misconfigured) return misconfigured;

    let token = '';
    try {
        const body = await request.json();
        token = typeof body?.token === 'string' ? body.token.trim() : '';
    } catch {
        token = '';
    }
    const claims = await verifyAccessToken(token);
    if (!claims) {
        return noStore(NextResponse.json({ message: 'Invalid session token' }, { status: 401 }));
    }
    const res = NextResponse.json({ authenticated: true, ...claims });
    res.headers.set(
        'Set-Cookie',
        accessCookieHeader(token, request.url, request.headers.get('x-forwarded-proto')),
    );
    return noStore(res);
}

export async function DELETE(request: NextRequest) {
    const blocked = gateSessionMutation(request);
    if (blocked) return noStore(blocked);
    const res = NextResponse.json({ ok: true });
    res.headers.set(
        'Set-Cookie',
        expireAccessCookieHeader(request.url, request.headers.get('x-forwarded-proto')),
    );
    return noStore(res);
}
