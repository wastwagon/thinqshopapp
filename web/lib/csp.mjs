/** Single CSP string for middleware and next.config.mjs. */
export const CONTENT_SECURITY_POLICY = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://js.paystack.co https://checkout.paystack.com https://www.googletagmanager.com",
    "style-src 'self' 'unsafe-inline'",
    // statusbarcolor / statusbartextcolor / hidebars: WebViewGold Image() pings
    "img-src 'self' data: blob: https: statusbarcolor: statusbartextcolor: hidebars: disablepulltorefresh:",
    "font-src 'self' data:",
    "connect-src 'self' https://api.paystack.co https://checkout.paystack.com https://www.google-analytics.com https://www.googletagmanager.com",
    // 'self' about: — Paystack inline iframe (empty / about:blank); custom schemes — WebViewGold
    "frame-src 'self' about: blob: https://checkout.paystack.com https://js.paystack.co statusbarcolor: statusbartextcolor: hidebars: disablepulltorefresh:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    'upgrade-insecure-requests',
].join('; ');
