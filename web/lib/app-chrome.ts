/**
 * Mobile top chrome (Safari / Chrome theme-color + viewport-fit=cover).
 *
 * WebViewGold (and similar native wrappers) pin the WKWebView / WebView below
 * the status bar. Applying env(safe-area-inset-top) on top of that doubles the
 * gap. Safari / PWA still need the inset because they draw edge-to-edge.
 */

export const APP_CHROME_BG = '#ffffff';

const IOS_THIRD_PARTY_BROWSER = /CriOS|FxiOS|EdgiOS|OPiOS|OPT\/|DuckDuckGo|YaBrowser/i;

export function isIosClient(userAgent?: string, maxTouchPoints?: number, platform?: string): boolean {
    const nav = typeof navigator !== 'undefined' ? navigator : undefined;
    const ua = userAgent ?? nav?.userAgent ?? '';
    if (/iPad|iPhone|iPod/i.test(ua)) return true;
    const plat = platform ?? nav?.platform;
    const touches = maxTouchPoints ?? nav?.maxTouchPoints ?? 0;
    return plat === 'MacIntel' && touches > 1;
}

/**
 * WKWebView (iOS) omits Safari's Version/…Safari/ tokens.
 * Android WebView includes `; wv)`.
 */
export function isInAppWebView(userAgent: string): boolean {
    const ua = userAgent || '';
    if (/; wv\)/.test(ua)) return true;

    const isIOS = /iPhone|iPad|iPod/i.test(ua);
    if (!isIOS) return false;
    if (IOS_THIRD_PARTY_BROWSER.test(ua)) return false;
    if (/Version\/[\d.]+/i.test(ua) && /Safari\//i.test(ua)) return false;
    return /AppleWebKit/i.test(ua);
}

export function iosFallbackStatusBarHeight(screenHeight: number): number {
    if (screenHeight >= 852) return 59;
    if (screenHeight >= 812) return 47;
    return 20;
}

export function isEdgeToEdgeViewport(viewportHeight: number, screenHeight: number): boolean {
    if (screenHeight <= 0) return false;
    return viewportHeight / screenHeight >= 0.96;
}

/**
 * Native wrappers pin the webview below the status bar, so the layout viewport
 * is already shorter than the screen by ~20–59px (status bar / notch) while
 * still extending under the home indicator.
 */
export function isNativeTopAlreadyReserved(viewportHeight: number, screenHeight: number): boolean {
    if (screenHeight <= 0 || viewportHeight <= 0) return false;
    return screenHeight - viewportHeight >= 20;
}

export function resolveSafeAreaTopPx(opts: {
    measuredPx: number;
    isIOS: boolean;
    viewportHeight: number;
    screenHeight: number;
    inAppWebView?: boolean;
}): number {
    if (opts.inAppWebView && isNativeTopAlreadyReserved(opts.viewportHeight, opts.screenHeight)) {
        return 0;
    }
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
    const ua = navigator.userAgent || '';
    return resolveSafeAreaTopPx({
        measuredPx: measured,
        isIOS: isIosClient(ua),
        viewportHeight,
        screenHeight,
        inAppWebView: isInAppWebView(ua),
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

/**
 * Runs in <head> before first paint so WebViewGold does not flash a doubled
 * status-bar gap. Keep detection in sync with isInAppWebView / resolveSafeAreaTopPx.
 */
export const APP_CHROME_BOOT_SCRIPT =
    '(function(){try{' +
    'var ua=navigator.userAgent||"";' +
    'var inApp=/; wv\\)/.test(ua)||(/iPhone|iPad|iPod/i.test(ua)&&/AppleWebKit/i.test(ua)' +
    '&&!/CriOS|FxiOS|EdgiOS|OPiOS|OPT\\//i.test(ua)&&!(/Version\\/[\\d.]+/i.test(ua)&&/Safari\\//i.test(ua)));' +
    'if(!inApp)return;' +
    'var vh=(window.visualViewport&&window.visualViewport.height)||window.innerHeight||0;' +
    'var sh=(window.screen&&window.screen.height)||0;' +
    'if(sh>0&&vh>0&&(sh-vh)>=20){document.documentElement.style.setProperty("--app-sat","0px")}' +
    '}catch(e){}})();';
