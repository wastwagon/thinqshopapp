import sanitizeHtml from 'sanitize-html';

const OPTIONS: sanitizeHtml.IOptions = {
    allowedTags: [
        'p', 'br', 'ul', 'ol', 'li', 'strong', 'em', 'b', 'i', 'u',
        'a', 'h2', 'h3', 'h4', 'span', 'div', 'img', 'blockquote',
    ],
    allowedAttributes: {
        a: ['href', 'target', 'rel'],
        img: ['src', 'alt', 'width', 'height'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
        a: (tagName, attribs) => ({
            tagName,
            attribs: {
                ...attribs,
                rel: 'noopener noreferrer',
                target: attribs.target === '_blank' ? '_blank' : attribs.target,
            },
        }),
    },
};

export function sanitizeProductHtml(input: unknown): string {
    const html = String(input ?? '');
    if (!html.trim()) return '';
    return sanitizeHtml(html, OPTIONS).trim();
}
