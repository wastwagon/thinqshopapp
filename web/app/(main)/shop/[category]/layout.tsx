import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thinqshopping.app';

function categoryTitle(slug: string): string {
    return slug
        .split(/[-_]/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
    const { category } = await params;
    const title = categoryTitle(category);
    return {
        title: `${title} – Shop`,
        description: `Shop ${title} at ThinQShop. Premium electronics and imaging systems delivered to Ghana. Order in GHS.`,
        openGraph: {
            title: `${title} | ThinQShop`,
            description: `Browse ${title}. Premium electronics delivered to Ghana.`,
            url: `${siteUrl}/shop/${category}`,
        },
    };
}

export default function CategoryLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
