import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SESSION_COOKIE = 'thinq_session';
const LOGIN_PATH = '/login';

function isProtectedPath(pathname: string): boolean {
    return pathname.startsWith('/dashboard') || pathname.startsWith('/admin');
}

function applySecurityHeaders(response: NextResponse): NextResponse {
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    return response;
}

export function middleware(request: NextRequest) {
    let response: NextResponse;

    if (isProtectedPath(request.nextUrl.pathname)) {
        const session = request.cookies.get(SESSION_COOKIE)?.value;
        if (!session) {
            const url = request.nextUrl.clone();
            url.pathname = LOGIN_PATH;
            url.searchParams.set('from', request.nextUrl.pathname);
            response = NextResponse.redirect(url);
        } else {
            response = NextResponse.next();
        }
    } else {
        response = NextResponse.next();
    }

    return applySecurityHeaders(response);
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon|thinqshop-logo).*)'],
};
