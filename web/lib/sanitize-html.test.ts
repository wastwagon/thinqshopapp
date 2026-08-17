import { describe, it, expect } from 'vitest';
import { sanitizeProductHtml } from './sanitize-html';

describe('sanitizeProductHtml', () => {
    it('returns empty for blank input', () => {
        expect(sanitizeProductHtml('')).toBe('');
        expect(sanitizeProductHtml(null)).toBe('');
    });

    it('keeps ordinary product copy', () => {
        expect(sanitizeProductHtml('<p>4K pocket camera</p>')).toBe('<p>4K pocket camera</p>');
    });

    it('strips script tags and inline handlers', () => {
        const dirty = `<p>Hi</p><script>alert(1)</script><img src=x onerror="alert(1)">`;
        const clean = sanitizeProductHtml(dirty);
        expect(clean).toContain('<p>Hi</p>');
        expect(clean.toLowerCase()).not.toContain('script');
        expect(clean.toLowerCase()).not.toContain('onerror');
    });

    it('neutralizes javascript URLs', () => {
        const clean = sanitizeProductHtml('<a href="javascript:alert(1)">x</a>');
        expect(clean.toLowerCase()).not.toContain('javascript:');
    });
});
