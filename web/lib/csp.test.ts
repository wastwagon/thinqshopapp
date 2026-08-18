import { describe, it, expect } from 'vitest';
import { CONTENT_SECURITY_POLICY } from './csp';

describe('CONTENT_SECURITY_POLICY', () => {
    it('allows WebViewGold status-bar schemes on img and frame', () => {
        expect(CONTENT_SECURITY_POLICY).toContain('img-src ');
        expect(CONTENT_SECURITY_POLICY).toContain('statusbarcolor:');
        expect(CONTENT_SECURITY_POLICY).toContain('statusbartextcolor:');
        expect(CONTENT_SECURITY_POLICY).toContain('hidebars:');
        expect(CONTENT_SECURITY_POLICY).toContain('disablepulltorefresh:');
    });

    it('allows Paystack checkout plus empty/about:blank frames', () => {
        expect(CONTENT_SECURITY_POLICY).toContain(
            "frame-src 'self' about: blob: https://checkout.paystack.com https://js.paystack.co",
        );
    });
});
