/**
 * Mobile top chrome / status-bar fill (WebViewGold + Safari viewport-fit=cover).
 *
 * Web-only: existing store wrappers already intercept statusbarcolor:// so we
 * do not need an App Store / Play resubmit. Android's default bar is
 * colorPrimaryDark (#0F7FFC); we override it to AppBar white (255,255,255).
 *
 * Never use location.href custom schemes on Android (breaks relaunch).
 * hidebars:// is iOS-wrapper only — on Android it hides the clock.
 */

export const APP_CHROME_BG = '#ffffff';
export const APP_CHROME_RGB = '255,255,255';
export const APP_CHROME_STATUS_TEXT = 'black';

const HIDEBARS_ON = 'hidebars://on';
const STATUSBAR_COLOR = `statusbarcolor://${APP_CHROME_RGB}`;
const STATUSBAR_TEXT = `statusbartextcolor://${APP_CHROME_STATUS_TEXT}`;

let iosLocationPingDone = false;

export function isIosClient(): boolean {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent || '';
    if (/iPad|iPhone|iPod/i.test(ua)) return true;
    return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
}

export function isAndroidWebView(): boolean {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent || '';
    return /Android/i.test(ua) && /; wv\)/i.test(ua);
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

export function pingWebViewGoldScheme(url: string): void {
    if (typeof document === 'undefined') return;
    try {
        const iframe = document.createElement('iframe');
        iframe.setAttribute('src', url);
        iframe.setAttribute('aria-hidden', 'true');
        iframe.setAttribute('title', '');
        iframe.style.cssText =
            'position:absolute;width:0;height:0;border:0;visibility:hidden;pointer-events:none';
        (document.body || document.documentElement).appendChild(iframe);
        window.setTimeout(() => {
            iframe.remove();
        }, 400);
    } catch {
        /* ignore */
    }
    try {
        const img = new Image();
        img.src = url;
    } catch {
        /* ignore */
    }
}

/** iframe + Image. Color pings are safe in browsers (unknown schemes are ignored). */
export function pingWebViewGoldStatusBar(opts?: { hidebars?: boolean }): void {
    pingWebViewGoldScheme(STATUSBAR_COLOR);
    pingWebViewGoldScheme(STATUSBAR_TEXT);
    if (opts?.hidebars && isIosClient()) {
        pingWebViewGoldScheme(HIDEBARS_ON);
    }
}

/**
 * iOS only: top-frame hidebars then statusbarcolor. iframe pings are not
 * always enough in WKWebView. Never call this on Android.
 */
export function navigateIosStatusBarSchemes(): void {
    if (iosLocationPingDone || typeof window === 'undefined') return;
    if (!isIosClient()) return;
    iosLocationPingDone = true;
    try {
        window.location.href = HIDEBARS_ON;
        window.setTimeout(() => {
            try {
                window.location.href = STATUSBAR_COLOR;
            } catch {
                /* ignore */
            }
        }, 350);
    } catch {
        iosLocationPingDone = false;
    }
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

export function initAppChrome(opts: { isWebViewGold: boolean }): () => void {
    syncChromeBackground();
    measureAndApplySafeArea();

    const hidebars = opts.isWebViewGold && isIosClient();
    pingWebViewGoldStatusBar({ hidebars });
    if (hidebars) {
        navigateIosStatusBarSchemes();
    }
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
