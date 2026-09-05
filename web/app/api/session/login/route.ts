import { NextRequest, NextResponse } from 'next/server';
import {
    accessCookieHeader,
    jwtSecret,
    verifyAccessToken,
} from '@/lib/access-cookie';
import { ensureJwtSecretLoaded } from '@/lib/load-jwt-secret';
import { gateSessionMutation, noStore } from '@/lib/session-guard';

const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7000';

export async function POST(request: NextRequest) {
    const blocked = gateSessionMutation(request);
    if (blocked) return noStore(blocked);

    let email = '';
    let password = '';
    try {
        const body = await request.json();
        email = typeof body?.email === 'string' ? body.email.trim() : '';
        password = typeof body?.password === 'string' ? body.password : '';
    } catch {
        return noStore(NextResponse.json({ message: 'Invalid request' }, { status: 400 }));
    }
    if (!email || !password) {
        return noStore(NextResponse.json({ message: 'Email and password are required' }, { status: 400 }));
    }

    let upstream: Response;
    try {
        upstream = await fetch(`${BACKEND_URL.replace(/\/$/, '')}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({ email, password }),
        });
    } catch {
        return noStore(NextResponse.json({ message: 'Backend unreachable' }, { status: 502 }));
    }

    const data = await upstream.json().catch(() => ({}));
    const token = typeof data?.access_token === 'string' ? data.access_token : '';
    if (!upstream.ok || !token) {
        return noStore(NextResponse.json(
            { message: data?.message || 'Invalid credentials' },
            { status: upstream.status === 401 ? 401 : upstream.status || 401 },
        ));
    }

    ensureJwtSecretLoaded();
    if (!jwtSecret()) {
        return noStore(NextResponse.json({ message: 'Session signing is not configured' }, { status: 500 }));
    }

    const claims = await verifyAccessToken(token);
    if (!claims) {
        return noStore(NextResponse.json({ message: 'Invalid session token' }, { status: 401 }));
    }

    const res = NextResponse.json({ authenticated: true, role: claims.role, email: claims.email });
    res.headers.set(
        'Set-Cookie',
        accessCookieHeader(token, request.url, request.headers.get('x-forwarded-proto')),
    );
    return noStore(res);
}
