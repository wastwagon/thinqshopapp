/**
 * WebViewGold: native pull-to-refresh reloads the WebView when the user is at the
 * document top. Our layout scrolls inside #main-content, so "top" gestures still
 * hit SwipeRefresh — unless the app handles disablepulltorefresh:// early enough.
 *
 * Set NEXT_PUBLIC_WEBVIEWGOLD_FORCE_BRIDGE=1 on your deploy if the packaged app
 * strips "WebViewGold" from the user agent but still handles the custom URL schemes.
 * Prefer fixing the native Config (ENABLE_PULL_REFRESH / pulltorefresh) when you can ship a build.
 */

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
    try {
        const iframe = document.createElement('iframe');
        iframe.setAttribute('src', 'disablepulltorefresh://');
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

export function scheduleDisableWebViewGoldPullToRefresh(): void {
    disableWebViewGoldPullToRefresh();
    const delays = [0, 80, 200, 600, 1500];
    delays.forEach((ms) => window.setTimeout(disableWebViewGoldPullToRefresh, ms));
}
