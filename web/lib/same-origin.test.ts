import { describe, it, expect } from 'vitest';
import { isTrustedSessionOrigin } from './same-origin';

describe('isTrustedSessionOrigin', () => {
    it('allows missing origin (same-origin fetch / WebView)', () => {
        expect(isTrustedSessionOrigin('https://thinqshopping.app/api/session')).toBe(true);
    });

    it('allows matching public site origin behind an internal request URL', () => {
        const prev = process.env.FRONTEND_URL;
        process.env.FRONTEND_URL = 'https://thinqshopping.app';
        expect(
            isTrustedSessionOrigin('http://web:3000/api/session', 'https://thinqshopping.app'),
        ).toBe(true);
        process.env.FRONTEND_URL = prev;
    });

    it('rejects a cross-site origin', () => {
        const prev = process.env.FRONTEND_URL;
        process.env.FRONTEND_URL = 'https://thinqshopping.app';
        expect(
            isTrustedSessionOrigin('http://web:3000/api/session', 'https://evil.example'),
        ).toBe(false);
        process.env.FRONTEND_URL = prev;
    });
});
