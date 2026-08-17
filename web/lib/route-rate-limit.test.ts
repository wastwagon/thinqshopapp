import { describe, it, expect } from 'vitest';
import { rateLimitAllow } from './route-rate-limit';

describe('rateLimitAllow', () => {
    it('allows up to the limit then blocks', () => {
        const key = `test-${Date.now()}`;
        expect(rateLimitAllow(key, 2, 60_000)).toBe(true);
        expect(rateLimitAllow(key, 2, 60_000)).toBe(true);
        expect(rateLimitAllow(key, 2, 60_000)).toBe(false);
    });
});
