/** Base URL for media — always same-origin `/api` so the Next proxy serves files (fixes CORP / cross-origin image blocks). */
export function getMediaBaseUrl(): string {
    return '/api';
}

/** Full URL for a media path stored in DB (e.g. /media/files/xxx.jpg). Handles bare filenames. */
export function getMediaUrl(pathOrUrl: string | null | undefined): string {
    if (!pathOrUrl) return '';
    const trimmed = String(pathOrUrl).trim();
    if (!trimmed) return '';
    if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
        return trimmed;
    }
    if (
        trimmed.startsWith('/placeholder') ||
        trimmed.startsWith('/thinqshop') ||
        trimmed.startsWith('/_next/')
    ) {
        return trimmed;
    }
    // Already same-origin API media — calling this twice must not produce /api/api/...
    if (trimmed.startsWith('/api/')) return trimmed;
    const withoutLeading = trimmed.replace(/^\/+/, '');
    if (withoutLeading.startsWith('api/')) return `/${withoutLeading}`;
    const pathClean =
        withoutLeading.includes('/') || withoutLeading.startsWith('media')
            ? `/${withoutLeading}`
            : `/media/files/${withoutLeading}`;
    return `${getMediaBaseUrl()}${pathClean}`;
}
