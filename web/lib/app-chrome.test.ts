import { describe, it, expect } from 'vitest';
import {
    iosFallbackStatusBarHeight,
    isEdgeToEdgeViewport,
    isInAppWebView,
    isNativeTopAlreadyReserved,
    resolveSafeAreaTopPx,
    APP_CHROME_BOOT_SCRIPT,
} from './app-chrome';

const UA = {
    iosSafari:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.3 Mobile/15E148 Safari/604.1',
    iosWkWebView:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
    iosChrome:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.6099.119 Mobile/15E148 Safari/604.1',
    androidChrome:
        'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    androidWebView:
        'Mozilla/5.0 (Linux; Android 14; Pixel 8; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0.6099.210 Mobile Safari/537.36',
};

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

describe('isInAppWebView', () => {
    it('detects iOS WKWebView (WebViewGold)', () => {
        expect(isInAppWebView(UA.iosWkWebView)).toBe(true);
    });

    it('does not treat iOS Safari as an in-app webview', () => {
        expect(isInAppWebView(UA.iosSafari)).toBe(false);
    });

    it('does not treat iOS Chrome as an in-app webview', () => {
        expect(isInAppWebView(UA.iosChrome)).toBe(false);
    });

    it('detects Android WebView', () => {
        expect(isInAppWebView(UA.androidWebView)).toBe(true);
    });

    it('does not treat Android Chrome as an in-app webview', () => {
        expect(isInAppWebView(UA.androidChrome)).toBe(false);
    });
});

describe('isNativeTopAlreadyReserved', () => {
    it('is true when WebViewGold pins below a notched status bar', () => {
        expect(isNativeTopAlreadyReserved(793, 852)).toBe(true);
        expect(isNativeTopAlreadyReserved(797, 844)).toBe(true);
    });

    it('is false when the viewport is edge-to-edge', () => {
        expect(isNativeTopAlreadyReserved(852, 852)).toBe(false);
        expect(isNativeTopAlreadyReserved(844, 844)).toBe(false);
    });
});

describe('resolveSafeAreaTopPx', () => {
    it('prefers a measured env() inset in Safari', () => {
        expect(
            resolveSafeAreaTopPx({
                measuredPx: 47,
                isIOS: true,
                viewportHeight: 800,
                screenHeight: 844,
                inAppWebView: false,
            }),
        ).toBe(47);
    });

    it('falls back on iOS Safari when env is 0 but the viewport is edge-to-edge', () => {
        expect(
            resolveSafeAreaTopPx({
                measuredPx: 0,
                isIOS: true,
                viewportHeight: 844,
                screenHeight: 844,
                inAppWebView: false,
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
                inAppWebView: false,
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
                inAppWebView: false,
            }),
        ).toBe(0);
    });

    it('zeros the inset in WebViewGold when native already reserved the status bar (env is 0)', () => {
        expect(
            resolveSafeAreaTopPx({
                measuredPx: 0,
                isIOS: true,
                viewportHeight: 793,
                screenHeight: 852,
                inAppWebView: true,
            }),
        ).toBe(0);
    });

    it('zeros the inset in WebViewGold even if CSS env() still reports the notch', () => {
        expect(
            resolveSafeAreaTopPx({
                measuredPx: 59,
                isIOS: true,
                viewportHeight: 793,
                screenHeight: 852,
                inAppWebView: true,
            }),
        ).toBe(0);
    });

    it('does not invent a fallback on iPhone SE in WebViewGold (20px native bar)', () => {
        expect(
            resolveSafeAreaTopPx({
                measuredPx: 0,
                isIOS: true,
                viewportHeight: 647,
                screenHeight: 667,
                inAppWebView: true,
            }),
        ).toBe(0);
    });

    it('keeps env() when an in-app webview is truly edge-to-edge', () => {
        expect(
            resolveSafeAreaTopPx({
                measuredPx: 59,
                isIOS: true,
                viewportHeight: 852,
                screenHeight: 852,
                inAppWebView: true,
            }),
        ).toBe(59);
    });
});

describe('APP_CHROME_BOOT_SCRIPT', () => {
    it('is a self-contained IIFE that can zero --app-sat', () => {
        expect(APP_CHROME_BOOT_SCRIPT.startsWith('(function(){')).toBe(true);
        expect(APP_CHROME_BOOT_SCRIPT).toContain('--app-sat');
        expect(APP_CHROME_BOOT_SCRIPT).toContain('0px');
    });
});
