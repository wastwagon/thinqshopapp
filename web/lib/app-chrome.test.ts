import { describe, it, expect } from 'vitest';
import {
    iosFallbackStatusBarHeight,
    isEdgeToEdgeViewport,
    resolveSafeAreaTopPx,
} from './app-chrome';

describe('iosFallbackStatusBarHeight', () => {
    it('uses 59px on iPhone 14 Pro and taller', () => {
        expect(iosFallbackStatusBarHeight(852)).toBe(59);
        expect(iosFallbackStatusBarHeight(932)).toBe(59);
    });

    it('uses 47px on X / 11 / 12 / 13 class phones', () => {
        expect(iosFallbackStatusBarHeight(812)).toBe(47);
        expect(iosFallbackStatusBarHeight(844)).toBe(47);
        expect(iosFallbackStatusBarHeight(851)).toBe(47);
    });

    it('uses 20px on older iPhones', () => {
        expect(iosFallbackStatusBarHeight(667)).toBe(20);
        expect(iosFallbackStatusBarHeight(736)).toBe(20);
    });
});

describe('resolveSafeAreaTopPx', () => {
    it('prefers a measured env() inset', () => {
        expect(
            resolveSafeAreaTopPx({
                measuredPx: 47,
                isIOS: true,
                viewportHeight: 800,
                screenHeight: 844,
            }),
        ).toBe(47);
    });

    it('falls back on iOS when env is 0 but the viewport is edge-to-edge', () => {
        expect(
            resolveSafeAreaTopPx({
                measuredPx: 0,
                isIOS: true,
                viewportHeight: 820,
                screenHeight: 844,
            }),
        ).toBe(47);
    });

    it('does not invent an inset on Android (opaque native bar, env is 0)', () => {
        expect(
            resolveSafeAreaTopPx({
                measuredPx: 0,
                isIOS: false,
                viewportHeight: 800,
                screenHeight: 800,
            }),
        ).toBe(0);
    });

    it('does not fall back when the viewport is not edge-to-edge', () => {
        expect(isEdgeToEdgeViewport(600, 844)).toBe(false);
        expect(
            resolveSafeAreaTopPx({
                measuredPx: 0,
                isIOS: true,
                viewportHeight: 600,
                screenHeight: 844,
            }),
        ).toBe(0);
    });
});
