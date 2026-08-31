/**
 * Mobile top chrome (Safari / Chrome theme-color + viewport-fit=cover).
 * Does not ping WebViewGold custom URL schemes — those wrappers are reference-only
 * and are not part of the web app runtime.
 */

export const APP_CHROME_BG = '#ffffff';

export function isIosClient(): boolean {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent || '';
    if (/iPad|iPhone|iPod/i.test(ua)) return true;
    return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
}

export function iosFallbackStatusBarHeight(screenHeight: number): number {
    if (screenHeight >= 852) return 59;
    if (screenHeight >= 812) return 47;
    return 20;
}

export function isEdgeToEdgeViewport(viewportHeight: number, screenHeight: number): boolean {
    if (screenHeight <= 0) return false;
    return viewportHeight / screenHeight >= 0.92;
}

export function resolveSafeAreaTopPx(opts: {
    measuredPx: number;
    isIOS: boolean;
    viewportHeight: number;
    screenHeight: number;
}): number {
    if (opts.measuredPx > 0) return Math.round(opts.measuredPx);
    if (opts.isIOS && isEdgeToEdgeViewport(opts.viewportHeight, opts.screenHeight)) {
        return iosFallbackStatusBarHeight(opts.screenHeight);
    }
    return 0;
}

export function measureSafeAreaInsetTopPx(): number {
    if (typeof document === 'undefined' || !document.body) return 0;
    const probe = document.createElement('div');
    probe.setAttribute('aria-hidden', 'true');
    probe.style.cssText =
        'position:absolute;visibility:hidden;pointer-events:none;padding-top:env(safe-area-inset-top,0px)';
    document.body.appendChild(probe);
    const measured = parseFloat(getComputedStyle(probe).paddingTop) || 0;
    probe.remove();
    const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
    const screenHeight = window.screen?.height ?? 0;
    return resolveSafeAreaTopPx({
        measuredPx: measured,
        isIOS: isIosClient(),
        viewportHeight,
        screenHeight,
    });
}

export function applySafeAreaTopVar(px: number): void {
    if (typeof document === 'undefined') return;
    document.documentElement.style.setProperty('--app-sat', `${Math.max(0, px)}px`);
}

export function syncChromeBackground(): void {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.style.setProperty('--app-chrome-bg', APP_CHROME_BG);
    root.style.backgroundColor = APP_CHROME_BG;
    if (document.body) document.body.style.backgroundColor = APP_CHROME_BG;

    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'theme-color');
        document.head.appendChild(meta);
    }
    meta.setAttribute('content', APP_CHROME_BG);
}

export function measureAndApplySafeArea(): number {
    const px = measureSafeAreaInsetTopPx();
    applySafeAreaTopVar(px);
    return px;
}

export function initAppChrome(): () => void {
    syncChromeBackground();
    measureAndApplySafeArea();
    window.setTimeout(() => {
        measureAndApplySafeArea();
    }, 400);

    const onResize = () => {
        measureAndApplySafeArea();
    };
    window.visualViewport?.addEventListener('resize', onResize);
    window.addEventListener('resize', onResize);

    return () => {
        window.visualViewport?.removeEventListener('resize', onResize);
        window.removeEventListener('resize', onResize);
    };
}
