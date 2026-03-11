/** Base URL for media served from backend (use /api so proxy serves them). */
export function getMediaBaseUrl(): string {
    if (typeof window !== 'undefined') return '/api';
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7000';
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
