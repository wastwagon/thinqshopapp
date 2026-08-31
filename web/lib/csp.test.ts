import { describe, it, expect } from 'vitest';
import { CONTENT_SECURITY_POLICY } from './csp';

describe('CONTENT_SECURITY_POLICY', () => {
    it('does not allow WebViewGold custom URL schemes', () => {
        expect(CONTENT_SECURITY_POLICY).not.toContain('statusbarcolor:');
        expect(CONTENT_SECURITY_POLICY).not.toContain('statusbartextcolor:');
        expect(CONTENT_SECURITY_POLICY).not.toContain('hidebars:');
        expect(CONTENT_SECURITY_POLICY).not.toContain('disablepulltorefresh:');
    });

    it('allows webpack eval in non-production so Next.js can hydrate', () => {
        if (process.env.NODE_ENV === 'production') {
            expect(CONTENT_SECURITY_POLICY).not.toContain("'unsafe-eval'");
        } else {
            expect(CONTENT_SECURITY_POLICY).toContain("'unsafe-eval'");
        }
    });

    it('allows Cloudflare Web Analytics beacon', () => {
        expect(CONTENT_SECURITY_POLICY).toContain('https://static.cloudflareinsights.com');
        expect(CONTENT_SECURITY_POLICY).toContain('https://cloudflareinsights.com');
    });

    it('allows Paystack checkout plus empty/about:blank frames', () => {
        expect(CONTENT_SECURITY_POLICY).toContain(
            "frame-src 'self' about: blob: https://checkout.paystack.com https://js.paystack.co",
        );
    });
});
