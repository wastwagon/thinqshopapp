import { NextRequest } from 'next/server';
import { ACCESS_COOKIE } from './access-cookie';

/**
 * Dedicated multipart routes cannot use the catch-all proxy (it reads the body
 * as text). They still need the httpOnly session cookie forwarded as Bearer.
 */
export function uploadAuthHeaders(request: NextRequest): HeadersInit {
    const access = request.cookies.get(ACCESS_COOKIE)?.value;
    if (access) {
        return { Authorization: `Bearer ${access}` };
    }
    const auth = request.headers.get('authorization');
    return auth ? { Authorization: auth } : {};
}
