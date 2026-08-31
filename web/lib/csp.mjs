/** Single CSP string for middleware and next.config.mjs. */
const isDev = process.env.NODE_ENV !== 'production';

export const CONTENT_SECURITY_POLICY = [
    "default-src 'self'",
    // Next.js webpack uses eval() in development; without it the client never hydrates
    // and pages stay on loading.tsx / opacity-0 auth cards.
    [
        "script-src 'self' 'unsafe-inline'",
        isDev ? "'unsafe-eval' 'wasm-unsafe-eval'" : null,
        'https://js.paystack.co https://checkout.paystack.com https://www.googletagmanager.com',
    ]
        .filter(Boolean)
        .join(' '),
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    [
        "connect-src 'self'",
        isDev ? 'http://127.0.0.1:* http://localhost:* ws://127.0.0.1:* ws://localhost:*' : null,
        'https://api.paystack.co https://checkout.paystack.com https://www.google-analytics.com https://www.googletagmanager.com',
    ]
        .filter(Boolean)
        .join(' '),
    // 'self' about: — Paystack inline iframe (empty / about:blank); custom schemes — WebViewGold
    "frame-src 'self' about: blob: https://checkout.paystack.com https://js.paystack.co statusbarcolor: statusbartextcolor: hidebars: disablepulltorefresh:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    'upgrade-insecure-requests',
].join('; ');
