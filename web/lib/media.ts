/** Base URL for media — always same-origin `/api` so the Next proxy serves files (fixes CORP / cross-origin image blocks). */
export function getMediaBaseUrl(): string {
    return '/api';
}

/** Full URL for a media path stored in DB (e.g. /media/files/xxx.jpg). Handles bare filenames. */
export function getMediaUrl(pathOrUrl: string | null | undefined): string {
    if (!pathOrUrl) return '';
    const path = pathOrUrl.startsWith('http') ? pathOrUrl : pathOrUrl.replace(/^\/+/, '');
    if (path.startsWith('http')) return path;
    const base = getMediaBaseUrl();
    const baseClean = base.replace(/\/$/, '');
    // Bare filename (e.g. 1717616198_1833503_1.jpg) -> serve from /media/files/
    const pathClean = path.includes('/') || path.startsWith('media')
        ? (path.startsWith('/') ? path : `/${path}`)
        : `/media/files/${path}`;
    return `${baseClean}${pathClean}`;
}
