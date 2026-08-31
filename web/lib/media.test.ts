import { describe, it, expect } from 'vitest';
import { getMediaUrl } from './media';

describe('getMediaUrl', () => {
    it('prefixes same-origin /api for stored media paths and bare filenames', () => {
        expect(getMediaUrl('/media/files/bag.jpg')).toBe('/api/media/files/bag.jpg');
        expect(getMediaUrl('media/files/bag.jpg')).toBe('/api/media/files/bag.jpg');
        expect(getMediaUrl('bag.jpg')).toBe('/api/media/files/bag.jpg');
    });

    it('is idempotent so zoom/lightbox can resolve already-proxied URLs', () => {
        const once = getMediaUrl('/media/files/bag.jpg');
        expect(getMediaUrl(once)).toBe('/api/media/files/bag.jpg');
        expect(getMediaUrl('/api/media/files/bag.jpg')).toBe('/api/media/files/bag.jpg');
        expect(getMediaUrl('api/media/files/bag.jpg')).toBe('/api/media/files/bag.jpg');
    });

    it('leaves absolute and public static URLs unchanged', () => {
        expect(getMediaUrl('https://www.bhphotovideo.com/images/bag.jpg')).toBe(
            'https://www.bhphotovideo.com/images/bag.jpg',
        );
        expect(getMediaUrl('/placeholder.svg')).toBe('/placeholder.svg');
        expect(getMediaUrl('')).toBe('');
    });
});
