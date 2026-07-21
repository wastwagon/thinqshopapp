'use client';

import type { MouseEvent } from 'react';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, ShoppingCart, Star, Eye, ArrowRight } from 'lucide-react';
import ProductImage from './ProductImage';
import ProductImageLightbox, { ProductImageTapHint } from './ProductImageLightbox';
import PriceDisplay from './PriceDisplay';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

interface ProductVariantRow {
    id?: number;
    variant_type?: string;
    variant_value?: string;
    price_adjust?: number | string;
    stock_quantity?: number;
}

interface Product {
    id?: string | number;
    name: string;
    price: string | number;
    image?: string;
    images?: string[] | string;
    gallery_images?: string[];
    category: any;
    rating?: number;
    reviews?: number;
    slug?: string;
    compare_price?: string | number;
    short_description?: string | null;
    description?: string | null;
    variants?: ProductVariantRow[];
    is_consignment?: boolean;
}

interface ProductCardProps {
    product: Product;
}

function collectGalleryImages(product: Product, imagesList: string[], fallback: string): string[] {
    const seen = new Set<string>();
    const out: string[] = [];
    const add = (raw?: string | null) => {
        if (!raw) return;
        const s = String(raw).trim();
        if (!s || seen.has(s)) return;
        seen.add(s);
        out.push(s);
    };
    for (const src of imagesList) add(src);
    for (const src of product.gallery_images ?? []) add(src);
    add(product.image);
    add(fallback);
    return out;
}

export default function ProductCard({ product }: ProductCardProps) {
    const { addToCart } = useCart();
    const { isInWishlist, toggleWishlist } = useWishlist();
    const { user } = useAuth();
    const router = useRouter();
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [buying, setBuying] = useState(false);

    const basePrice = typeof product.price === 'string'
        ? parseFloat(String(product.price).replace(/[^0-9.]/g, ''))
        : Number(product.price);

    const variants = Array.isArray(product.variants) ? product.variants : [];
    const variantUnitPrices = variants.length
        ? variants.map((v) => basePrice + Number(v.price_adjust ?? 0))
        : [];
    const hasVariants = variantUnitPrices.length > 0;
    const fromPrice = hasVariants ? Math.min(...variantUnitPrices) : basePrice;
    const firstVariantId = hasVariants && variants[0]?.id != null ? variants[0].id : undefined;

    let imgs: unknown = product.images;
    if (typeof imgs === 'string') {
        try {
            imgs = JSON.parse(imgs);
        } catch {
            imgs = imgs ? [imgs] : [];
        }
    }
    const imagesList = Array.isArray(imgs) ? imgs.filter(Boolean).map(String) : [];
    const productImage = imagesList[0] || product.image || product.gallery_images?.[0] || '';

    const productSlug = product.slug || (typeof product.id !== 'undefined' ? String(product.id) : null) || product.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]/g, '');
    const productId = typeof product.id === 'number' ? product.id : Number(product.id) || 0;
    const productHref = `/products/${productSlug}`;

    const galleryImages = useMemo(
        () => collectGalleryImages(product, imagesList, productImage),
        [product, imagesList, productImage],
    );

    const desc = product.short_description || product.description;
    const descPreview = desc ? (desc.length > 80 ? desc.slice(0, 80).trim() + '…' : desc) : null;

    const handleWishlist = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const wishImages =
            imagesList.length > 0
                ? imagesList
                : product.image
                  ? [String(product.image)]
                  : product.gallery_images?.filter(Boolean).map(String);
        toggleWishlist({
            id: Number(productId),
            name: product.name,
            price: fromPrice,
            slug: productSlug,
            images: wishImages,
            gallery_images: product.gallery_images,
            category: product.category,
        });
    };

    const openLightbox = (e?: MouseEvent) => {
        e?.preventDefault();
        e?.stopPropagation();
        if (galleryImages.length > 0) setLightboxOpen(true);
    };

    const handleExpressBuy = async () => {
        if (!productId) return;
        if (!user) {
            toast.error('Please login to continue');
            setLightboxOpen(false);
            router.push('/login?from=/checkout');
            return;
        }
        setBuying(true);
        try {
            const ok = await addToCart(productId, 1, firstVariantId, {
                openDrawer: false,
                successMessage: 'Added — going to checkout',
            });
            if (!ok) return;
            setLightboxOpen(false);
            router.push('/checkout');
        } finally {
            setBuying(false);
        }
    };

    const inWishlist = isInWishlist(Number(productId));
    const wishlistBtnClass = inWishlist
        ? 'border-red-200 text-red-500'
        : 'border-gray-100 text-gray-600 hover:bg-blue-600 hover:text-white hover:border-blue-600';
    const actionBtnBase =
        'bg-white shadow-sm border rounded-full flex items-center justify-center transition-all';
    const actionBtnCompact = `${actionBtnBase} w-8 h-8`;
    const actionBtnDesktop = `${actionBtnBase} min-w-[44px] min-h-[44px] w-10 h-10`;
    const iconCompact = 'h-3.5 w-3.5';
    const iconDesktop = 'h-4 w-4';

    const quickActions = (compact: boolean) => (
        <>
            <button
                type="button"
                onClick={handleWishlist}
                className={`${compact ? actionBtnCompact : actionBtnDesktop} ${wishlistBtnClass}`}
                title={inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
                aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
            >
                <Heart className={`${compact ? iconCompact : iconDesktop} ${inWishlist ? 'fill-current' : ''}`} aria-hidden />
            </button>
            <Link
                href={productHref}
                className={`${compact ? actionBtnCompact : actionBtnDesktop} border-gray-100 text-gray-600 hover:bg-blue-600 hover:text-white`}
                title="Quick View"
                aria-label="Quick view product"
            >
                <Eye className={compact ? iconCompact : iconDesktop} aria-hidden />
            </Link>
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    productId && addToCart(productId, 1, firstVariantId);
                }}
                className={`${compact ? actionBtnCompact : actionBtnDesktop} border-gray-100 text-gray-600 hover:bg-blue-600 hover:text-white`}
                title={hasVariants ? 'Add first option to cart (choose options on product page)' : 'Add to Cart'}
                aria-label="Add to cart"
            >
                <ShoppingCart className={compact ? iconCompact : iconDesktop} aria-hidden />
            </button>
        </>
    );

    return (
        <>
            <div className="group flat-card-interactive overflow-hidden relative flex flex-col h-full">
                <div className="flex md:hidden items-center justify-end gap-1 px-2 pt-2 pb-1 shrink-0">
                    {quickActions(true)}
                </div>

                <button
                    type="button"
                    onClick={openLightbox}
                    disabled={galleryImages.length === 0}
                    aria-label={`Expand image: ${product.name}`}
                    className="group/image aspect-square relative overflow-hidden bg-gray-50/80 flex items-center justify-center w-full text-left cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset disabled:cursor-default"
                >
                    <ProductImage
                        src={productImage}
                        alt={product.name}
                        width={400}
                        height={400}
                        className="object-contain p-5 group-hover/image:scale-105 transition-transform duration-500 pointer-events-none"
                    />

                    {product.compare_price && (
                        <div className="absolute top-3 left-3 bg-red-600 text-white text-xs font-semibold px-2 py-0.5 rounded z-10 pointer-events-none">
                            OFFER
                        </div>
                    )}
                    {product.is_consignment && (
                        <div className={`absolute top-3 ${product.compare_price ? 'left-[4.5rem]' : 'left-3'} bg-violet-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded z-10 pointer-events-none`}>
                            CONSIGNMENT
                        </div>
                    )}

                    <ProductImageTapHint />

                    <div
                        className="hidden md:flex absolute top-3 right-3 flex-row gap-1.5 opacity-0 group-hover/image:opacity-100 transition-opacity duration-300 z-20"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                    >
                        {quickActions(false)}
                    </div>
                </button>

            {/* Content */}
            <div className="p-4 flex flex-col flex-1">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-medium text-blue-600 truncate">
                        {typeof product.category === 'string' ? product.category : product.category?.name || 'Vetted Asset'}
                    </span>
                    <div className="flex items-center gap-0.5 shrink-0">
                        <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs text-gray-500">{product.rating || 4.8}</span>
                    </div>
                </div>

                <Link href={productHref}>
                    <h3 className="text-xs font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                        {product.name}
                    </h3>
                </Link>

                {descPreview && (
                    <p className="hidden sm:block text-[11px] text-gray-500 line-clamp-2 mt-1 leading-relaxed">
                        {descPreview}
                    </p>
                )}

                <div className="flex items-center justify-between mt-auto pt-3">
                    <div className="flex flex-col">
                        {product.compare_price && (
                            <span className="text-xs text-gray-400 line-through">
                                ₵{Number(product.compare_price).toFixed(2)}
                            </span>
                        )}
                        <div className="flex flex-col items-start gap-0">
                            {hasVariants && (
                                <span className="text-xs font-medium text-gray-500">From</span>
                            )}
                            <PriceDisplay amountGhs={fromPrice} className="text-base font-semibold text-gray-900" />
                        </div>
                    </div>
                    <Link
                        href={productHref}
                        className="w-9 h-9 min-w-[36px] min-h-[36px] p-1.5 bg-gray-50 border border-gray-200/80 text-gray-700 rounded-lg flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors group/btn"
                        aria-label="View product"
                    >
                        <ArrowRight className="h-4 w-4 shrink-0 group-hover/btn:scale-110 transition-transform" aria-hidden />
                    </Link>
                </div>
            </div>
            </div>

            <ProductImageLightbox
                open={lightboxOpen}
                onClose={() => setLightboxOpen(false)}
                images={galleryImages}
                title={product.name}
                productHref={productHref}
                onBuy={handleExpressBuy}
                buying={buying}
                buyLabel="Buy"
                priceGhs={fromPrice}
                categoryLabel={
                    typeof product.category === 'string'
                        ? product.category
                        : product.category?.name || 'Vetted Asset'
                }
                rating={Number(product.rating) || 4.8}
                description={descPreview}
            />
        </>
    );
}
