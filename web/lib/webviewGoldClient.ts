/**
 * WebViewGold — disable native pull-to-refresh from the website (no native rebuild).
 *
 * Official docs (same API on both platforms):
 * - Android `Config.java` → ENABLE_PULL_REFRESH: “Additionally, you can always call
 *   `enablepulltorefresh://` or `disablepulltorefresh://` from your website to activate
 *   or deactivate pull-to-refresh dynamically.”
 *   https://www.webviewgold.com/docs/android/
 * - iOS `Config.swift` → pulltorefresh: same `enablepulltorefresh://` / `disablepulltorefresh://` note.
 *   https://www.webviewgold.com/docs/iOS/
 *
 * Android docs also use `window.location.href = "…://"` for other scheme APIs; we prefer
 * iframe + synthetic `<a click>` first so the SPA main frame does not navigate if a
 * scheme is not handled. Optional `NEXT_PUBLIC_WEBVIEWGOLD_PTR_OFF_VIA_LOCATION=1` adds
 * a top-frame `location.href` attempt (set only if your build intercepts that reliably).
 *
 * `NEXT_PUBLIC_WEBVIEWGOLD_FORCE_BRIDGE=1` — run when the app strips “WebViewGold” from
 * the user agent but still registers WebViewGold URL handlers.
 */

const DISABLE_PTR_SCHEME = 'disablepulltorefresh://';

function fireIframeScheme(url: string): void {
    try {
        const iframe = document.createElement('iframe');
        iframe.setAttribute('src', url);
        iframe.setAttribute('title', 'WebViewGold disable pull to refresh');
        iframe.style.cssText =
            'position:absolute;width:0;height:0;border:0;visibility:hidden;pointer-events:none';
        document.body.appendChild(iframe);
        window.setTimeout(() => {
            iframe.remove();
        }, 400);
    } catch {
        /* ignore */
    }
}

/** Matches WebViewGold doc examples that use `<a href="scheme://">` for native hooks. */
function fireAnchorScheme(url: string): void {
    try {
        const a = document.createElement('a');
        a.setAttribute('href', url);
        a.setAttribute('aria-hidden', 'true');
        a.style.cssText =
            'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0';
        document.body.appendChild(a);
        a.click();
        a.remove();
    } catch {
        /* ignore */
    }
}

let pullToRefreshLocationOffSent = false;

/** Android doc pattern for scheme APIs; opt-in env only; once per page (schedule fires many times). */
function fireLocationSchemeOnce(url: string): void {
    if (pullToRefreshLocationOffSent) return;
    pullToRefreshLocationOffSent = true;
    try {
        window.location.href = url;
    } catch {
        /* ignore */
    }
}

export function isWebViewGoldClient(): boolean {
    if (typeof window === 'undefined') return false;
    const w = window as unknown as { __WEBVIEWGOLD__?: boolean };
    if (w.__WEBVIEWGOLD__ === true) return true;
    if (process.env.NEXT_PUBLIC_WEBVIEWGOLD_FORCE_BRIDGE === '1') return true;
    return /WebViewGold/i.test(navigator.userAgent);
}

export function markWebViewGoldDocument(): void {
    document.documentElement.classList.add('webview-gold');
    document.body.classList.add('webview-gold');
}

export function disableWebViewGoldPullToRefresh(): void {
    if (!document.body) return;
    fireIframeScheme(DISABLE_PTR_SCHEME);
    fireAnchorScheme(DISABLE_PTR_SCHEME);
    if (process.env.NEXT_PUBLIC_WEBVIEWGOLD_PTR_OFF_VIA_LOCATION === '1') {
        fireLocationSchemeOnce(DISABLE_PTR_SCHEME);
    }
}

export function scheduleDisableWebViewGoldPullToRefresh(): void {
    disableWebViewGoldPullToRefresh();
    const delays = [0, 80, 200, 600, 1500];
    delays.forEach((ms) => window.setTimeout(disableWebViewGoldPullToRefresh, ms));
}
