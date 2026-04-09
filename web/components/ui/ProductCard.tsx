import Link from 'next/link';
import { Heart, ShoppingCart, Star, Eye, ArrowRight } from 'lucide-react';
import ProductImage from './ProductImage';
import PriceDisplay from './PriceDisplay';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';

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
}

interface ProductCardProps {
    product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
    const { addToCart } = useCart();
    const { isInWishlist, toggleWishlist } = useWishlist();

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

    const desc = product.short_description || product.description;
    const descPreview = desc ? (desc.length > 80 ? desc.slice(0, 80).trim() + '…' : desc) : null;

    return (
        <div className="group bg-white rounded-xl border border-gray-100/90 shadow-sm hover:shadow-lg hover:shadow-brand/5 hover:border-brand/20 transition-all duration-300 overflow-hidden relative flex flex-col h-full">
            {/* Image Container */}
            <div className="aspect-square relative overflow-hidden bg-gray-50/80 flex items-center justify-center">
                <ProductImage
                    src={productImage}
                    alt={product.name}
                    width={400}
                    height={400}
                    className="object-contain p-5 group-hover:scale-105 transition-transform duration-500"
                />

                {/* Sale Badge */}
                {product.compare_price && (
                    <div className="absolute top-3 left-3 bg-red-600 text-white text-xs font-semibold px-2 py-0.5 rounded z-10">
                        OFFER
                    </div>
                )}

                {/* Quick Actions - always visible on mobile; hover reveal on desktop */}
                <div className="absolute bottom-3 right-3 flex flex-col gap-1 translate-x-0 md:translate-x-10 md:group-hover:translate-x-0 transition-transform duration-300 z-20">
                    <button
                        onClick={(e) => {
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
                        }}
                        className={`min-w-[44px] min-h-[44px] w-11 h-11 bg-white/95 shadow border rounded-full flex items-center justify-center transition-all ${
                            isInWishlist(Number(productId)) ? 'border-red-200 text-red-500' : 'border-gray-100 text-gray-600 hover:bg-blue-600 hover:text-white hover:border-blue-600'
                        }`}
                        title={isInWishlist(Number(productId)) ? 'Remove from Wishlist' : 'Add to Wishlist'}
                        aria-label={isInWishlist(Number(productId)) ? 'Remove from wishlist' : 'Add to wishlist'}
                    >
                        <Heart className={`h-4 w-4 ${isInWishlist(Number(productId)) ? 'fill-current' : ''}`} aria-hidden />
                    </button>
                    <Link
                        href={`/products/${productSlug}`}
                        className="min-w-[44px] min-h-[44px] w-11 h-11 bg-white/95 shadow border border-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-blue-600 hover:text-white transition-all"
                        title="Quick View"
                        aria-label="Quick view product"
                    >
                        <Eye className="h-4 w-4" aria-hidden />
                    </Link>
                    <button
                        onClick={() => productId && addToCart(productId, 1, firstVariantId)}
                        className="min-w-[44px] min-h-[44px] w-11 h-11 bg-white/95 shadow border border-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-blue-600 hover:text-white transition-all"
                        title={hasVariants ? 'Add first option to cart (choose options on product page)' : 'Add to Cart'}
                        aria-label="Add to cart"
                    >
                        <ShoppingCart className="h-4 w-4" aria-hidden />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 flex flex-col flex-1">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-semibold text-brand uppercase tracking-wider truncate">
                        {typeof product.category === 'string' ? product.category : product.category?.name || 'Vetted Asset'}
                    </span>
                    <div className="flex items-center gap-0.5 shrink-0">
                        <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs text-gray-500">{product.rating || 4.8}</span>
                    </div>
                </div>

                <Link href={`/products/${productSlug}`}>
                    <h3 className="text-xs font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                        {product.name}
                    </h3>
                </Link>

                {descPreview && (
                    <p className="text-[11px] text-gray-500 line-clamp-2 mt-1 leading-relaxed">
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
                                <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">From</span>
                            )}
                            <PriceDisplay amountGhs={fromPrice} className="text-base font-semibold text-gray-900" />
                        </div>
                    </div>
                    <Link
                        href={`/products/${productSlug}`}
                        className="w-9 h-9 min-w-[36px] min-h-[36px] p-1.5 bg-gray-100 text-gray-700 rounded-lg flex items-center justify-center hover:bg-gray-200 hover:text-blue-600 transition-all group/btn"
                        aria-label="View product"
                    >
                        <ArrowRight className="h-4 w-4 shrink-0 group-hover/btn:scale-110 transition-transform" aria-hidden />
                    </Link>
                </div>
            </div>
        </div>
    );
}
