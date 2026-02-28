import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thinqshopping.app';
const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7000';
const isCI = process.env.CI === 'true';

async function getProduct(slug: string) {
    if (isCI) return null;
    try {
        const res = await fetch(`${apiBase}/products/${slug}`, { next: { revalidate: 60 } });
        if (!res.ok) return null;
        return res.json();
    } catch {
        return null;
    }
}

function productImageUrl(path: string | undefined, forOg = false): string {
    if (!path) return `${siteUrl}/thinqshop-logo.webp`;
    if (path.startsWith('http')) return path;
    const pathClean = path.replace(/^\//, '');
    if (forOg) return `${siteUrl}/api/${pathClean.startsWith('media/') ? pathClean : `media/${pathClean}`}`;
    return `${apiBase.replace(/\/$/, '')}/${pathClean.startsWith('media/') ? pathClean : `media/${pathClean}`}`;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const product = await getProduct(slug);
    if (!product) {
        return { title: 'Product' };
    }
    const name = product.name || 'Product';
    const description =
        typeof product.description === 'string' && product.description
            ? product.description.slice(0, 160)
            : `Buy ${name} at ThinQShop. Electronics and imaging systems delivered to Ghana.`;
    const image = product.images?.[0] || product.image || product.images;
    const imageUrl = Array.isArray(image) ? image[0] : image;
    const ogImage = imageUrl ? productImageUrl(imageUrl, true) : `${siteUrl}/thinqshop-logo.webp`;

    return {
        title: name,
        description,
        openGraph: {
            title: `${name} | ThinQShop`,
            description,
            url: `${siteUrl}/products/${slug}`,
            type: 'website',
            images: [{ url: ogImage, alt: name }],
        },
        twitter: {
            card: 'summary_large_image',
            title: `${name} | ThinQShop`,
            description,
        },
    };
}

export default async function ProductLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const product = await getProduct(slug);
    const siteUrlBase = siteUrl;

    const jsonLd = product
        ? {
              '@context': 'https://schema.org',
              '@type': 'Product',
              name: product.name,
              description: typeof product.description === 'string' ? product.description : undefined,
              image: [product.images?.[0] || product.image].filter(Boolean).map((p: string) => productImageUrl(p, true)),
              url: `${siteUrlBase}/products/${slug}`,
              offers: {
                  '@type': 'Offer',
                  price: product.price ?? product.price_ghs,
                  priceCurrency: 'GHS',
                  availability: product.is_active !== false ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
              },
          }
        : null;

    return (
        <>
            {jsonLd && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            )}
            {children}
        </>
    );
}
