/** Normalize product for consistent display across pages */
export function normalizeProduct(p: any, index: number = 0) {
    const categoryName = typeof p.category === 'object' ? p.category?.name : p.category;
    const price = typeof p.price === 'string' ? p.price : String(p.price ?? 0);
    let imgArr: string[] = [];
    if (Array.isArray(p.gallery_images) && p.gallery_images.length) imgArr = p.gallery_images.filter(Boolean);
    else if (Array.isArray(p.images) && p.images.length) imgArr = p.images.filter(Boolean);
    else if (p.images && typeof p.images === 'string') imgArr = [p.images];
    else if (p.image) imgArr = [p.image];
    const slug = p.slug ?? (typeof p.name === 'string' ? toSlug(p.name) : String(index));
    return {
        ...p,
        id: p.id ?? index + 1,
        slug,
        category: categoryName ?? 'Uncategorized',
        gallery_images: imgArr.length ? imgArr : p.gallery_images,
        images: imgArr.length ? imgArr : p.images,
        price,
    };
}

/** Convert product name to URL slug */
export function toSlug(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'product';
}

/** Check if slug matches product */
export function productMatchesSlug(product: any, slug: string): boolean {
    const pSlug = product.slug ?? toSlug(product.name);
    return pSlug === slug;
}

/** Parse price from API or static format ($1,234.56 or 1234.56) */
export function parsePrice(price: any): number {
    if (price == null) return 0;
    if (typeof price === 'number' && !isNaN(price)) return price;
    const str = String(price).replace(/[^0-9.]/g, '');
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
}

export const STATIC_CATEGORIES = [
    { name: 'Photography', slug: 'photography', icon: 'Camera', tagline: 'Cameras & lenses' },
    { name: 'Computers', slug: 'computers', icon: 'Monitor', tagline: 'Laptops & desktops' },
    { name: 'Pro Video', slug: 'pro-video', icon: 'Video', tagline: 'Video gear' },
    { name: 'Audio & Studio', slug: 'audio-studio', icon: 'Mic2', tagline: 'Mics & speakers' },
    { name: 'Gaming', slug: 'gaming', icon: 'Gamepad2', tagline: 'Consoles & accessories' },
    { name: 'Electronics', slug: 'electronics', icon: 'Cpu', tagline: 'Devices & components' },
    { name: 'Accessories', slug: 'accessories', icon: 'Package', tagline: 'Cables & bags' },
    { name: 'Lighting', slug: 'lighting', icon: 'Lightbulb', tagline: 'Strobes & LEDs' },
    { name: 'Drones', slug: 'drones', icon: 'Plane', tagline: 'UAVs & gimbals' },
    { name: 'Smart Home', slug: 'smart-home', icon: 'Home', tagline: 'IoT & automation' },
];
