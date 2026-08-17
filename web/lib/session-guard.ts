import { NextRequest, NextResponse } from 'next/server';
import { rateLimitAllow } from '@/lib/route-rate-limit';
import { isTrustedSessionOrigin } from '@/lib/same-origin';

export function gateSessionMutation(request: NextRequest): NextResponse | null {
    if (!isTrustedSessionOrigin(request.url, request.headers.get('origin'), request.headers.get('referer'))) {
        return NextResponse.json({ message: 'Invalid origin' }, { status: 403 });
    }
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
    if (!rateLimitAllow(`session:${ip}`, 20, 60_000)) {
        return NextResponse.json({ message: 'Too many requests' }, { status: 429 });
    }
    return null;
}

export function noStore(res: NextResponse) {
    res.headers.set('Cache-Control', 'private, no-store');
    return res;
}
