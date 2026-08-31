import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ACCESS_COOKIE, isAdminRole, readAccessClaims } from '@/lib/access-cookie';
import { CONTENT_SECURITY_POLICY } from '@/lib/csp';

const LOGIN_PATH = '/login';

function isProtectedPath(pathname: string): boolean {
    return pathname.startsWith('/dashboard') || pathname.startsWith('/admin');
}

function isAdminPath(pathname: string): boolean {
    return pathname.startsWith('/admin');
}

function applySecurityHeaders(response: NextResponse): NextResponse {
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(self), microphone=(), geolocation=()');
    response.headers.set('X-DNS-Prefetch-Control', 'off');
    response.headers.set('Content-Security-Policy', CONTENT_SECURITY_POLICY);
    return response;
}

export async function middleware(request: NextRequest) {
    let response: NextResponse;

    if (isProtectedPath(request.nextUrl.pathname)) {
        const claims = await readAccessClaims(request.cookies.get(ACCESS_COOKIE)?.value);
        if (!claims) {
            const url = request.nextUrl.clone();
            url.pathname = LOGIN_PATH;
            url.searchParams.set('from', request.nextUrl.pathname);
            response = NextResponse.redirect(url);
        } else if (isAdminPath(request.nextUrl.pathname) && !isAdminRole(claims.role)) {
            const url = request.nextUrl.clone();
            url.pathname = '/dashboard';
            url.searchParams.set('error', 'admin_required');
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
