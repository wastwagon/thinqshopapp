'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Star, Heart, Plus, Minus, Truck, RotateCcw, ZoomIn } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/axios';
import ShopLayout from '@/components/layout/ShopLayout';
import PageHeader from '@/components/ui/PageHeader';
import ShopContent from '@/components/shop/ShopContent';
import ShopTrustRow from '@/components/shop/ShopTrustRow';
import { ShopLoadingState } from '@/components/shop/ShopSuccessShell';
import ProductCard from '@/components/ui/ProductCard';
import PriceDisplay from '@/components/ui/PriceDisplay';
import localProducts from '@/lib/data/scraped_products.json';
import { toSlug, parsePrice, normalizeProduct } from '@/lib/product-utils';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/context/AuthContext';
import { trackViewItem } from '@/lib/analytics';
import { getMediaUrl } from '@/lib/media';
import ProductReviewForm from '@/components/product/ProductReviewForm';
import ProductImageLightbox from '@/components/ui/ProductImageLightbox';

function normalizeProductImages(product: any): string[] {
    let raw = product?.images ?? product?.gallery_images;
    if (typeof raw === 'string') {
        try {
            raw = JSON.parse(raw);
        } catch {
            raw = [];
        }
    }
    if (!Array.isArray(raw)) raw = [];
    const urls = raw.filter(Boolean).map((x: unknown) => getMediaUrl(String(x)));
    return urls.length ? urls : ['/placeholder.svg'];
}

type ReviewRow = { id: number; rating: number; review_text: string | null; review_images?: string[]; display_name: string; created_at: string };
type PolicyRow = { type: string; short_text: string | null; full_text: string | null };

export default function ProductDetailsPage({ params }: { params: { slug: string } }) {
    const { slug } = params;
    const router = useRouter();
    const { addToCart } = useCart();
    const { isInWishlist, toggleWishlist } = useWishlist();
    const { user } = useAuth();
    const [product, setProduct] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(0);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [buying, setBuying] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [reviews, setReviews] = useState<{ data: ReviewRow[]; meta: { total: number; totalPages: number } }>({ data: [], meta: { total: 0, totalPages: 0 } });
    const [policies, setPolicies] = useState<PolicyRow[]>([]);
    const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
    const [relatedProducts, setRelatedProducts] = useState<any[]>([]);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const { data } = await api.get(`/products/${slug}`);
                if (data) {
                    setProduct(data);
                    const v = Array.isArray(data.variants) ? data.variants : [];
                    setSelectedVariantId(v.length && v[0]?.id != null ? Number(v[0].id) : null);
                    setLoading(false);
                    return;
                }
            } catch (_) {}
            const found = (localProducts as any[]).find((p) => toSlug(p.name) === slug);
            if (found) {
                const id = typeof found.id === 'number' ? found.id : (localProducts as any[]).indexOf(found) + 1;
                setProduct({ ...found, id, slug, images: found.gallery_images ?? found.images ?? [] });
                setSelectedVariantId(null);
            } else {
                setSelectedVariantId(null);
            }
            setLoading(false);
        };

        if (slug) fetchProduct();
    }, [slug]);

    useEffect(() => {
        if (!slug) return;
        api.get(`/products/${slug}/reviews`, { params: { page: 1, limit: 5 } })
            .then((res) => setReviews({ data: res.data?.data ?? [], meta: res.data?.meta ?? { total: 0, totalPages: 0 } }))
            .catch(() => {});
    }, [slug]);

    useEffect(() => {
        api.get('/content/policies')
            .then((res) => setPolicies(Array.isArray(res.data) ? res.data : []))
            .catch(() => {});
    }, []);

    useEffect(() => {
        if (!product) {
            setRelatedProducts([]);
            return;
        }
        const categorySlug =
            product.category?.slug ??
            (typeof product.category === 'string'
                ? product.category.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
                : null);
        const catName = typeof product.category === 'string' ? product.category : product.category?.name;

        const loadRelated = async () => {
            if (categorySlug) {
                try {
                    const { data } = await api.get('/products', { params: { category: categorySlug, limit: 8 } });
                    const list = (data?.data ?? [])
                        .map((p: any, i: number) => normalizeProduct(p, i))
                        .filter((p: any) => (p.slug ?? toSlug(p.name)) !== slug && p.id !== product.id)
                        .slice(0, 4);
                    if (list.length > 0) {
                        setRelatedProducts(list);
                        return;
                    }
                } catch (_) {
                    /* fallback below */
                }
            }
            const fallback = (localProducts as any[])
                .filter(
                    (p: any) =>
                        (typeof p.category === 'string' ? p.category : p.category?.name) === catName &&
                        toSlug(p.name) !== slug
                )
                .slice(0, 4)
                .map((p, i) => normalizeProduct({ ...p, id: p.id ?? i + 1 }, i));
            setRelatedProducts(fallback);
        };

        loadRelated();
    }, [product, slug]);

    useEffect(() => {
        if (product) {
            trackViewItem(
                String(product.id),
                product.name,
                product.category?.name ?? product.category
            );
        }
    }, [product]);

    if (loading) return (
        <ShopLayout>
            <ShopLoadingState message="Loading product…" />
        </ShopLayout>
    );

    if (!product) return (
        <ShopLayout>
            <div className="min-h-[60vh] flex items-center justify-center bg-white">
                <div className="text-gray-900 font-bold tracking-tight">Product not found</div>
            </div>
        </ShopLayout>
    );

    const images = normalizeProductImages(product);
    const galleryImages = images.filter((img) => img && img !== '/placeholder.svg');
    const canExpandGallery = galleryImages.length > 0;
    const variants = Array.isArray(product.variants) ? product.variants : [];
    const selectedVariant =
        variants.find((v: { id: number }) => Number(v.id) === selectedVariantId) ?? (variants[0] as { id?: number } | undefined) ?? null;
    const imgUnoptimized = (src: string) => src.startsWith('/api') || src.startsWith('http');

    const catName = typeof product.category === 'object' ? product.category?.name : product.category;
    const catSlug = typeof product.category === 'object' ? product.category?.slug : (product.category?.toString?.() || '').toLowerCase().replace(/\s+/g, '-');
    const breadcrumbs = [
        { label: 'Shop', href: '/shop' },
        ...(catName ? [{ label: String(catName), href: catSlug ? `/shop/${catSlug}` : '/shop' }] : []),
        { label: product.name },
    ];

    const minQty = product.wholesale_min_quantity != null ? Number(product.wholesale_min_quantity) : 0;
    const discountPct = product.wholesale_discount_pct != null ? Number(product.wholesale_discount_pct) : 0;
    const hasWholesale = minQty > 0 && discountPct > 0;
    const qualifiesWholesale = hasWholesale && quantity >= minQty;
    const basePrice = parsePrice(product.price);
    const variantAdjust = selectedVariant != null ? Number((selectedVariant as { price_adjust?: number }).price_adjust ?? 0) : 0;
    const listUnitBeforeWholesale = basePrice + variantAdjust;
    const unitPrice = qualifiesWholesale ? listUnitBeforeWholesale * (1 - discountPct / 100) : listUnitBeforeWholesale;
    const stockToShow =
        product.is_consignment
            ? Number(product.stock_quantity ?? 0)
            : selectedVariant != null && (selectedVariant as { stock_quantity?: number }).stock_quantity != null
              ? Number((selectedVariant as { stock_quantity: number }).stock_quantity)
              : Number(product.stock_quantity ?? 0);
    const isOwnConsignment =
        Boolean(
            product.is_consignment &&
                user?.id != null &&
                product.consignor_user_id != null &&
                Number(user.id) === Number(product.consignor_user_id),
        );
    const maxQuantity = product.is_consignment ? 1 : Math.max(1, stockToShow);
    const moreNeeded = hasWholesale && quantity < minQty ? minQty - quantity : 0;

    const expressVariantId =
        selectedVariantId ??
        (variants.length > 0 && variants[0]?.id != null ? Number(variants[0].id) : undefined);

    const handleExpressBuy = async () => {
        if (isOwnConsignment) {
            toast.error('You cannot purchase your own Sell for Me listing');
            return;
        }
        if (stockToShow <= 0) {
            toast.error('Out of stock');
            return;
        }
        if (!user) {
            toast.error('Please login to continue');
            setLightboxOpen(false);
            router.push('/login?from=/checkout');
            return;
        }
        setBuying(true);
        try {
            const ok = await addToCart(Number(product.id), Math.max(1, quantity), expressVariantId, {
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

    return (
        <ShopLayout>
            <div className="bg-white min-h-full pb-8">
            <ShopContent wide className="py-8 sm:py-12">
                <PageHeader breadcrumbs={breadcrumbs} accent="amber" />
                <ShopTrustRow compact />
                <div className="lg:grid lg:grid-cols-2 lg:gap-x-16 lg:items-start">
                    {/* Image Gallery */}
                    <div className="px-4 sm:px-0">
                        <div className="flex flex-col-reverse">
                            {images.length > 1 && (
                                <div className="mt-3 sm:mt-8 w-full max-w-2xl mx-auto lg:max-w-none">
                                    <div className="flex sm:grid sm:grid-cols-4 gap-3 sm:gap-6 overflow-x-auto sm:overflow-visible pb-1 sm:pb-0">
                                        {images.map((img: string, idx: number) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                aria-label={`View image ${idx + 1} of ${images.length}`}
                                                className={`relative h-20 w-20 sm:h-24 sm:w-auto shrink-0 bg-gray-50 rounded-2xl flex items-center justify-center overflow-hidden border transition-all ${selectedImage === idx ? 'border-blue-500 ring-1 ring-blue-100' : 'border-gray-100 hover:border-gray-200'}`}
                                                onClick={() => setSelectedImage(idx)}
                                            >
                                                <Image src={img} alt="" fill className="object-contain p-2" sizes="96px" unoptimized={imgUnoptimized(img)} />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={() => canExpandGallery && setLightboxOpen(true)}
                                disabled={!canExpandGallery}
                                aria-label={`Expand image: ${product.name}`}
                                className="group/image w-full aspect-[4/3] max-h-[42vh] lg:aspect-square lg:max-h-none relative rounded-lg lg:rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-default"
                            >
                                <Image
                                    src={images[selectedImage] || '/placeholder.svg'}
                                    alt={product.name}
                                    fill
                                    className="object-contain p-2 sm:p-4 lg:p-8 transition-transform duration-700 group-hover/image:scale-[1.02] pointer-events-none"
                                    sizes="(max-width: 1024px) 100vw, 50vw"
                                    unoptimized={imgUnoptimized(images[selectedImage] || '')}
                                />
                                {canExpandGallery && (
                                    <span className="pointer-events-none absolute bottom-2 right-2 lg:bottom-3 lg:right-3 flex items-center gap-1 lg:gap-1.5 rounded-lg lg:rounded-xl bg-black/50 px-2 py-1 lg:px-3 lg:py-1.5 text-[10px] lg:text-xs font-medium text-white backdrop-blur-sm">
                                        <ZoomIn className="h-3 w-3 lg:h-3.5 lg:w-3.5" aria-hidden />
                                        Tap to expand
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Product Info */}
                    <div className="mt-6 px-4 sm:px-0 sm:mt-16 lg:mt-0">
                        <div className="mb-8">
                            <div className="flex flex-wrap gap-2 mb-4">
                                <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${stockToShow > (product.low_stock_threshold ?? 10) ? 'bg-green-50 text-green-700 border border-green-100' : stockToShow > 0 ? 'bg-orange-50 text-orange-700 border border-orange-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                                    {stockToShow === 0 ? 'Out of stock' : stockToShow <= (product.low_stock_threshold ?? 10) ? `Only ${stockToShow} left` : 'In stock'}
                                </span>
                                {product.is_consignment && (
                                    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-100">
                                        Sell for Me listing
                                    </span>
                                )}
                            </div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-xs font-medium text-blue-700 mb-4">
                                {product.is_consignment
                                    ? 'Sell for Me · Local pickup & handover'
                                    : 'Ships from abroad · 7–14 day delivery'}
                            </div>
                            <h1 className="text-xl font-bold text-gray-900 tracking-tight leading-snug">{product.name}</h1>
                        </div>

                        <div className="flex flex-wrap items-baseline gap-2 sm:gap-4 mb-6 sm:mb-8">
                            <p className="text-base sm:text-lg md:text-xl font-bold text-gray-900 tracking-tight">
                                <PriceDisplay amountGhs={unitPrice} className="font-bold" /> <span className="text-xs sm:text-sm font-normal text-gray-500">each</span>
                            </p>
                            {qualifiesWholesale && (
                                <span className="px-2 py-1 rounded-lg bg-green-100 text-green-700 text-xs font-bold">Wholesale {discountPct}% off</span>
                            )}
                            {product.compare_price != null && Number(product.compare_price) > unitPrice && (
                                <p className="text-sm sm:text-base font-bold text-gray-400 line-through">₵{Number(product.compare_price).toFixed(2)}</p>
                            )}
                            {variants.length > 0 && (
                                <p className="text-xs text-gray-500 w-full">Price updates when you select an option below.</p>
                            )}
                        </div>

                        {variants.length > 0 && (
                            <div className="mb-8 rounded-2xl border border-gray-100 bg-gray-50/80 p-4">
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Options</p>
                                <div className="flex flex-col gap-2">
                                    {variants.map((v: { id: number; variant_type: string; variant_value: string; price_adjust?: number; stock_quantity?: number }) => {
                                        const vid = Number(v.id);
                                        const vUnit = basePrice + Number(v.price_adjust ?? 0);
                                        const sel = selectedVariantId === vid;
                                        const oos = product.is_consignment
                                            ? Number(product.stock_quantity ?? 0) <= 0
                                            : Number(v.stock_quantity ?? 0) <= 0;
                                        return (
                                            <button
                                                key={vid}
                                                type="button"
                                                disabled={oos}
                                                onClick={() => setSelectedVariantId(vid)}
                                                className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition-all ${sel ? 'border-blue-500 bg-white ring-1 ring-blue-100' : 'border-gray-200 bg-white hover:border-gray-300'} ${oos ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            >
                                                <span className="font-semibold text-gray-900 capitalize">
                                                    {String(v.variant_type).replace(/_/g, ' ')}: <span className="text-gray-600">{v.variant_value}</span>
                                                </span>
                                                <span className="font-bold text-gray-900 tabular-nums">₵{vUnit.toFixed(2)}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <div className="space-y-6 mb-10">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center">
                                    {[0, 1, 2, 3, 4].map((rating) => {
                                        const r = product.rating_aggregate != null ? Number(product.rating_aggregate) : 4;
                                        return (
                                            <Star
                                                key={rating}
                                                className={`h-4 w-4 fill-current ${rating < Math.round(r) ? 'text-yellow-400' : 'text-gray-200'}`}
                                            />
                                        );
                                    })}
                                </div>
                                <span className="text-xs font-medium text-gray-500">
                                    {product.rating_aggregate != null ? Number(product.rating_aggregate).toFixed(1) : '4.8'} / {product.review_count ?? reviews.meta.total ?? 0} Reviews
                                </span>
                            </div>

                            {product.short_description && (
                                <p className="text-sm sm:text-base text-gray-600 leading-relaxed font-medium">{product.short_description}</p>
                            )}

                            {product.description && (
                                <div className="text-sm sm:text-base md:text-lg text-gray-600 leading-relaxed font-medium space-y-4 sm:space-y-6" dangerouslySetInnerHTML={{ __html: product.description }} />
                            )}

                            {product.specifications && typeof product.specifications === 'object' && Object.keys(product.specifications).length > 0 && (
                                <div className="rounded-2xl border border-gray-100 bg-gray-50 overflow-hidden">
                                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest px-4 py-3 border-b border-gray-100">Specifications</h3>
                                    <dl className="divide-y divide-gray-100">
                                        {Object.entries(product.specifications).map(([key, value]) => (
                                            <div key={key} className="flex flex-wrap gap-2 px-4 py-3 sm:flex-nowrap">
                                                <dt className="text-sm font-semibold text-gray-500 min-w-[8rem]">{key}</dt>
                                                <dd className="text-sm font-medium text-gray-900">{value != null ? String(value) : '—'}</dd>
                                            </div>
                                        ))}
                                    </dl>
                                </div>
                            )}
                        </div>

                        <div className="space-y-3 mb-10">
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                <div className="flex items-center gap-2 shrink-0">
                                    <div className="flex items-center gap-1 p-1 bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl">
                                        <button
                                            type="button"
                                            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                                            className="min-w-[44px] min-h-[44px] w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600 transition-all"
                                            aria-label="Decrease quantity"
                                        >
                                            <Minus className="h-4 w-4" />
                                        </button>
                                        <span className="w-12 text-center text-sm font-bold text-gray-900">{quantity}</span>
                                        <button
                                            type="button"
                                            onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
                                            disabled={quantity >= maxQuantity}
                                            className="min-w-[44px] min-h-[44px] w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600 transition-all disabled:opacity-40"
                                            aria-label="Increase quantity"
                                        >
                                            <Plus className="h-4 w-4" />
                                        </button>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            toggleWishlist({
                                                id: Number(product.id),
                                                name: product.name,
                                                price: listUnitBeforeWholesale,
                                                slug: product.slug ?? slug,
                                                images: product.images,
                                                gallery_images: product.gallery_images,
                                                category: product.category,
                                            })
                                        }
                                        className={`min-w-[44px] min-h-[44px] w-10 h-10 sm:w-12 sm:h-12 border rounded-lg sm:rounded-xl flex items-center justify-center transition-all shrink-0 ${
                                            isInWishlist(Number(product.id))
                                                ? 'bg-red-50 border-red-200 text-red-500'
                                                : 'border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50'
                                        }`}
                                    >
                                        <Heart
                                            className={`h-4 w-4 sm:h-5 sm:w-5 ${isInWishlist(Number(product.id)) ? 'fill-current' : ''}`}
                                        />
                                    </button>
                                </div>
                                <button
                                    type="button"
                                    className="flex-1 min-w-[7.5rem] min-h-[44px] border border-blue-600 text-blue-700 bg-white rounded-xl font-semibold text-sm hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 py-2.5 px-3 disabled:opacity-50 disabled:cursor-not-allowed"
                                    onClick={() => {
                                        if (isOwnConsignment) {
                                            toast.error('You cannot purchase your own Sell for Me listing');
                                            return;
                                        }
                                        if (variants.length > 0 && selectedVariantId == null) {
                                            toast.error('Please select an option');
                                            return;
                                        }
                                        addToCart(Number(product.id), quantity, selectedVariantId ?? undefined);
                                    }}
                                    disabled={isOwnConsignment || stockToShow <= 0}
                                >
                                    <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" aria-hidden />
                                    <span className="whitespace-nowrap">
                                        {isOwnConsignment
                                            ? 'Your listing'
                                            : stockToShow <= 0
                                              ? 'Out of stock'
                                              : 'Add to Cart'}
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    className="flex-1 min-w-[7.5rem] min-h-[44px] bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 py-2.5 px-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_8px_24px_-8px_rgba(2,39,79,0.35)]"
                                    onClick={() => void handleExpressBuy()}
                                    disabled={buying || isOwnConsignment || stockToShow <= 0}
                                >
                                    <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" aria-hidden />
                                    <span className="whitespace-nowrap">
                                        {buying
                                            ? 'Buying…'
                                            : isOwnConsignment
                                              ? 'Your listing'
                                              : stockToShow <= 0
                                                ? 'Out of stock'
                                                : 'Buy'}
                                    </span>
                                </button>
                            </div>
                            {isOwnConsignment && (
                                <p className="text-xs text-violet-700 bg-violet-50 border border-violet-100 rounded-xl px-3 py-2">
                                    This is your Sell for Me listing. Buyers can add it to cart — you cannot purchase it yourself.
                                </p>
                            )}
                            {hasWholesale && (
                                <div className={`text-sm font-medium px-4 py-3 rounded-xl ${qualifiesWholesale ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-orange-50 text-orange-800 border border-orange-200'}`}>
                                    {qualifiesWholesale
                                        ? `You qualify for wholesale! Save ${discountPct}% on this order.`
                                        : `Add ${moreNeeded} more to get ${discountPct}% wholesale discount.`
                                    }
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {policies.filter((p) => p.type === 'delivery').map((p) => (
                                <div key={p.type} className="bg-gray-50 p-4 sm:p-6 rounded-2xl border border-gray-100">
                                    <p className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-2 flex items-center gap-1.5">
                                        <Truck className="h-3.5 w-3.5" /> Delivery
                                    </p>
                                    <p className="text-xs sm:text-sm font-medium text-gray-900">{p.short_text || '7–14 days (international)'}</p>
                                    {p.full_text && (
                                        <Link href="/privacy" className="text-xs font-semibold text-blue-600 mt-2 inline-block touch-manipulation">Full delivery info</Link>
                                    )}
                                </div>
                            ))}
                            {policies.filter((p) => p.type === 'returns').map((p) => (
                                <div key={p.type} className="bg-gray-50 p-4 sm:p-6 rounded-2xl border border-gray-100">
                                    <p className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-2 flex items-center gap-1.5">
                                        <RotateCcw className="h-3.5 w-3.5" /> Returns
                                    </p>
                                    <p className="text-xs sm:text-sm font-medium text-gray-900">{p.short_text || '14-day returns on unused items'}</p>
                                    {p.full_text && (
                                        <Link href="/terms" className="text-xs font-semibold text-blue-600 mt-2 inline-block touch-manipulation">Returns policy</Link>
                                    )}
                                </div>
                            ))}
                            {policies.length === 0 && (
                                <>
                                    <div className="bg-gray-50 p-4 sm:p-6 rounded-2xl border border-gray-100">
                                        <p className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-2">Delivery</p>
                                        <p className="text-xs font-bold text-gray-900">7–14 days (international)</p>
                                    </div>
                                    <div className="bg-gray-50 p-4 sm:p-6 rounded-2xl border border-gray-100">
                                        <p className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-2">Returns</p>
                                        <p className="text-xs font-bold text-gray-900">14-day returns on unused items</p>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Reviews */}
                <section className="mt-10 sm:mt-16 pt-6 sm:pt-12 border-t border-gray-100" aria-label="Customer reviews">
                    <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-4 sm:mb-6">Customer reviews</h2>
                    <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] gap-6 lg:gap-8 items-start">
                        <div className="space-y-4 order-2 lg:order-1">
                            {reviews.data.length === 0 ? (
                                <p className="text-sm text-gray-500">No published reviews yet. Be the first to share your experience.</p>
                            ) : (
                                reviews.data.map((r) => (
                                    <article key={r.id} className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                                            <span className="flex items-center gap-0.5">
                                                {[1, 2, 3, 4, 5].map((i) => (
                                                    <Star key={i} className={`h-4 w-4 ${i <= r.rating ? 'text-yellow-400 fill-current' : 'text-gray-200'}`} />
                                                ))}
                                            </span>
                                            <span className="text-xs font-semibold text-gray-700">{r.display_name}</span>
                                            <span className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString()}</span>
                                        </div>
                                        {r.review_text && <p className="text-sm text-gray-700 leading-relaxed">{r.review_text}</p>}
                                        {r.review_images && r.review_images.length > 0 && (
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {r.review_images.map((src, i) => (
                                                    <div key={i} className="relative h-16 w-16 rounded-lg overflow-hidden border border-gray-200 bg-white">
                                                        <Image src={getMediaUrl(src)} alt="" fill className="object-cover" sizes="64px" unoptimized={src.startsWith('http')} />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </article>
                                ))
                            )}
                            {reviews.meta.total > reviews.data.length && (
                                <p className="text-sm text-gray-500">Showing {reviews.data.length} of {reviews.meta.total} reviews.</p>
                            )}
                        </div>
                        {product.id != null && (
                            <div className="order-1 lg:order-2 lg:sticky lg:top-24">
                                <ProductReviewForm productId={Number(product.id)} productSlug={slug} />
                            </div>
                        )}
                    </div>
                </section>

                {/* Related products */}
                {product && relatedProducts.length > 0 && (
                    <div className="mt-12 sm:mt-16 md:mt-24 border-t border-gray-100 pt-8 sm:pt-12 md:pt-16">
                        <div className="flex items-center justify-between mb-4 sm:mb-6 md:mb-8">
                            <h2 className="text-lg sm:text-xl md:text-2xl font-bold sm:font-extrabold text-gray-900 tracking-tight">Related products</h2>
                            {catName && <span className="text-xs font-medium text-gray-500">{catName}</span>}
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
                            {relatedProducts.map((relatedProduct, idx) => (
                                <ProductCard key={relatedProduct.slug ?? relatedProduct.id ?? idx} product={relatedProduct as any} />
                            ))}
                        </div>
                    </div>
                )}
            </ShopContent>

            <ProductImageLightbox
                open={lightboxOpen}
                onClose={() => setLightboxOpen(false)}
                images={canExpandGallery ? galleryImages : images}
                title={product.name}
                initialIndex={selectedImage}
                onIndexChange={setSelectedImage}
                onBuy={handleExpressBuy}
                buying={buying}
                buyDisabled={isOwnConsignment || stockToShow <= 0}
                buyLabel={isOwnConsignment ? 'Your listing' : stockToShow <= 0 ? 'Out of stock' : 'Buy'}
            />
            </div>
        </ShopLayout>
    );
}
