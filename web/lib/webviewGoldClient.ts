/**
 * WebViewGold client helpers.
 *
 * Prefer native Config (`ENABLE_PULL_REFRESH` / `pulltorefresh` = false) for PTR.
 * Do NOT navigate the top frame to `disablepulltorefresh://` — that can leave Android
 * WebView on a non-http last URL so the app opens once, then fails on relaunch.
 *
 * We only mark `.webview-gold` so CSS overscroll rules apply.
 * Optional `NEXT_PUBLIC_WEBVIEWGOLD_PTR_OFF_IFRAME=1` fires the scheme once via a
 * hidden iframe (never `<a click>` / `location.href`).
 *
 * `NEXT_PUBLIC_WEBVIEWGOLD_FORCE_BRIDGE=1` — treat all clients as WebViewGold when
 * the app strips “WebViewGold” from the user agent.
 */

const DISABLE_PTR_SCHEME = 'disablepulltorefresh://';

let pullToRefreshIframeSent = false;

function fireIframeSchemeOnce(url: string): void {
    if (pullToRefreshIframeSent || !document.body) return;
    pullToRefreshIframeSent = true;
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

/** CSS class + optional one-shot iframe scheme (never navigates the main frame). */
export function disableWebViewGoldPullToRefresh(): void {
    if (!document.body) return;
    markWebViewGoldDocument();
    if (process.env.NEXT_PUBLIC_WEBVIEWGOLD_PTR_OFF_IFRAME === '1') {
        fireIframeSchemeOnce(DISABLE_PTR_SCHEME);
    }
}
