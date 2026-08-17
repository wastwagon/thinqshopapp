const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0']);

function originHost(value: string): { host: string; protocol: string } | null {
    try {
        const url = new URL(value);
        return { host: url.hostname.toLowerCase(), protocol: url.protocol };
    } catch {
        return null;
    }
}

function allowedOrigins(): string[] {
    return [
        process.env.FRONTEND_URL,
        process.env.NEXT_PUBLIC_SITE_URL,
    ]
        .flatMap((value) => (value || '').split(','))
        .map((value) => value.trim().replace(/\/$/, ''))
        .filter(Boolean);
}

/** Same-site POST: browser Origin, or configured public site, or local loopback. */
export function isTrustedSessionOrigin(requestUrl: string, originHeader?: string | null, refererHeader?: string | null): boolean {
    const incoming = originHeader || (refererHeader ? originFromReferer(refererHeader) : '');
    if (!incoming) {
        // Same-origin fetch (and some WebViews) omit Origin. Cross-site POSTs send Origin.
        return true;
    }
    const got = originHost(incoming);
    if (!got) return false;

    const candidates = [requestUrl.replace(/\/$/, ''), ...allowedOrigins()];
    for (const candidate of candidates) {
        const want = originHost(candidate.startsWith('http') ? candidate : `https://${candidate}`);
        if (!want) continue;
        if (got.host === want.host) return true;
    }
    return LOCAL_HOSTS.has(got.host);
}

function originFromReferer(referer: string): string {
    try {
        return new URL(referer).origin;
    } catch {
        return '';
    }
}
