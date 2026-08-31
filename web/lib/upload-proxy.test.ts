import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { ACCESS_COOKIE } from './access-cookie';
import { uploadAuthHeaders } from './upload-proxy';

describe('uploadAuthHeaders', () => {
    it('forwards the session cookie as Bearer', () => {
        const request = new NextRequest('http://localhost/api/media/upload', {
            headers: { cookie: `${ACCESS_COOKIE}=jwt-token` },
        });
        expect(uploadAuthHeaders(request)).toEqual({ Authorization: 'Bearer jwt-token' });
    });

    it('falls back to an Authorization header when there is no cookie', () => {
        const request = new NextRequest('http://localhost/api/media/upload', {
            headers: { authorization: 'Bearer header-token' },
        });
        expect(uploadAuthHeaders(request)).toEqual({ Authorization: 'Bearer header-token' });
    });

    it('prefers the cookie over a client Authorization header', () => {
        const request = new NextRequest('http://localhost/api/media/upload', {
            headers: {
                cookie: `${ACCESS_COOKIE}=cookie-token`,
                authorization: 'Bearer header-token',
            },
        });
        expect(uploadAuthHeaders(request)).toEqual({ Authorization: 'Bearer cookie-token' });
    });
});
