'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Star, Heart, Plus, Minus, Truck, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/axios';
import ShopLayout from '@/components/layout/ShopLayout';
import PageHeader from '@/components/ui/PageHeader';
import ProductCard from '@/components/ui/ProductCard';
import PriceDisplay from '@/components/ui/PriceDisplay';
import localProducts from '@/lib/data/scraped_products.json';
import { toSlug, parsePrice } from '@/lib/product-utils';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { trackViewItem } from '@/lib/analytics';

type ReviewRow = { id: number; rating: number; review_text: string | null; review_images?: string[]; display_name: string; created_at: string };
type PolicyRow = { type: string; short_text: string | null; full_text: string | null };

export default function ProductDetailsPage({ params }: { params: { slug: string } }) {
    const { slug } = params;
    const { addToCart } = useCart();
    const { isInWishlist, toggleWishlist } = useWishlist();
    const [product, setProduct] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [reviews, setReviews] = useState<{ data: ReviewRow[]; meta: { total: number; totalPages: number } }>({ data: [], meta: { total: 0, totalPages: 0 } });
    const [policies, setPolicies] = useState<PolicyRow[]>([]);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const { data } = await api.get(`/products/${slug}`);
                if (data) {
                    setProduct(data);
                    setLoading(false);
                    return;
                }
            } catch (_) {}
            const found = (localProducts as any[]).find((p) => toSlug(p.name) === slug);
            if (found) {
                const id = typeof found.id === 'number' ? found.id : (localProducts as any[]).indexOf(found) + 1;
                setProduct({ ...found, id, slug, images: found.gallery_images ?? found.images ?? [] });
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
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-gray-300 font-bold tracking-widest uppercase animate-pulse">Loading Product...</div>
            </div>
        </ShopLayout>
    );

    if (!product) return (
        <ShopLayout>
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-gray-900 font-bold tracking-widest uppercase">Product Not Found</div>
            </div>
        </ShopLayout>
    );

    const images = (product.images?.length ? product.images : product.gallery_images) || ['/placeholder.svg'];

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
    const unitPrice = qualifiesWholesale ? basePrice * (1 - discountPct / 100) : basePrice;
    const totalPrice = unitPrice * quantity;
    const moreNeeded = hasWholesale && quantity < minQty ? minQty - quantity : 0;

    return (
        <ShopLayout>
            <div className="max-w-7xl mx-auto px-6 py-12 bg-white">
                <PageHeader title={product.name} breadcrumbs={breadcrumbs} />
                <div className="lg:grid lg:grid-cols-2 lg:gap-x-16 lg:items-start">
                    {/* Image Gallery */}
                    <div className="flex flex-col-reverse">
                        <div className="hidden mt-8 w-full max-w-2xl mx-auto sm:block lg:max-w-none">
                            <div className="grid grid-cols-4 gap-6">
                                {images.map((img: string, idx: number) => (
                                    <button
                                        key={idx}
                                        className={`relative h-24 bg-gray-50 rounded-2xl flex items-center justify-center overflow-hidden border transition-all ${selectedImage === idx ? 'border-blue-600 ring-2 ring-blue-600/10' : 'border-gray-100 hover:border-gray-200'}`}
                                        onClick={() => setSelectedImage(idx)}
                                    >
                                        <Image src={img.startsWith('http') ? img : `/${img}`} alt="" fill className="object-contain p-2" sizes="96px" unoptimized={img.startsWith('http')} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="w-full aspect-square relative rounded-[2.5rem] overflow-hidden bg-gray-50 border border-gray-100">
                            <Image
                                src={images[selectedImage].startsWith('http') ? images[selectedImage] : `/${images[selectedImage]}`}
                                alt={product.name}
                                fill
                                className="object-contain p-8 transition-transform duration-700"
                                sizes="(max-width: 1024px) 100vw, 50vw"
                                unoptimized={images[selectedImage].startsWith('http')}
                            />
                        </div>
                    </div>

                    {/* Product Info */}
                    <div className="mt-10 px-4 sm:px-0 sm:mt-16 lg:mt-0">
                        <div className="mb-8">
                            {product.stock_quantity != null && (
                                <div className="flex flex-wrap gap-2 mb-4">
                                    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${product.stock_quantity > (product.low_stock_threshold ?? 10) ? 'bg-green-50 text-green-700 border border-green-100' : product.stock_quantity > 0 ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                                        {product.stock_quantity === 0 ? 'Out of stock' : product.stock_quantity <= (product.low_stock_threshold ?? 10) ? `Only ${product.stock_quantity} left` : 'In stock'}
                                    </span>
                                </div>
                            )}
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[11px] font-bold tracking-wider text-blue-600 uppercase mb-4">
                                Ships from abroad · 7–14 day delivery
                            </div>
                            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 leading-[1.3]">{product.name}</h1>
                        </div>

                        <div className="flex flex-wrap items-baseline gap-4 mb-8">
                            <p className="text-2xl font-bold text-gray-900 tracking-tight">
                                <PriceDisplay amountGhs={unitPrice} className="font-bold" /> <span className="text-sm font-normal text-gray-500">each</span>
                            </p>
                            {qualifiesWholesale && (
                                <span className="px-2 py-1 rounded-lg bg-green-100 text-green-700 text-xs font-bold">Wholesale {discountPct}% off</span>
                            )}
                            {product.compare_price != null && Number(product.compare_price) > unitPrice && (
                                <p className="text-base font-bold text-gray-400 line-through">₵{Number(product.compare_price).toFixed(2)}</p>
                            )}
                        </div>

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
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                    {product.rating_aggregate != null ? Number(product.rating_aggregate).toFixed(1) : '4.8'} / {product.review_count ?? reviews.meta.total ?? 0} Reviews
                                </span>
                            </div>

                            <div className="text-lg text-gray-600 leading-relaxed font-medium space-y-6" dangerouslySetInnerHTML={{ __html: product.description || '' }} />
                        </div>

                        <div className="space-y-3 mb-10">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1 p-1 bg-gray-50 border border-gray-200 rounded-xl">
                                    <button
                                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                                        className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600 transition-all"
                                    >
                                        <Minus className="h-4 w-4" />
                                    </button>
                                    <span className="w-12 text-center text-sm font-bold text-gray-900">{quantity}</span>
                                    <button
                                        onClick={() => setQuantity((q) => q + 1)}
                                        className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600 transition-all"
                                    >
                                        <Plus className="h-4 w-4" />
                                    </button>
                                </div>
                                <button
                                    className="flex-1 h-12 bg-gray-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-gray-200"
                                    onClick={() => addToCart(Number(product.id), quantity)}
                                >
                                    <ShoppingCart className="h-5 w-5" />
                                    Add to Cart · <PriceDisplay amountGhs={totalPrice} className="inline" />
                                </button>
                                <button
                                    onClick={() => toggleWishlist({ id: Number(product.id), name: product.name, price: product.price, slug: product.slug ?? slug, images: product.images, gallery_images: product.gallery_images, category: product.category })}
                                    className={`w-12 h-12 border rounded-xl flex items-center justify-center transition-all shrink-0 ${
                                        isInWishlist(Number(product.id))
                                            ? 'bg-red-50 border-red-200 text-red-500'
                                            : 'border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50'
                                    }`}
                                >
                                    <Heart className={`h-5 w-5 ${isInWishlist(Number(product.id)) ? 'fill-current' : ''}`} />
                                </button>
                            </div>
                            {hasWholesale && (
                                <div className={`text-sm font-medium px-4 py-3 rounded-xl ${qualifiesWholesale ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-amber-50 text-amber-800 border border-amber-200'}`}>
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
                                    <p className="text-[11px] font-bold text-gray-400 tracking-widest uppercase mb-2 flex items-center gap-1.5">
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
                                    <p className="text-[11px] font-bold text-gray-400 tracking-widest uppercase mb-2 flex items-center gap-1.5">
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
                                        <p className="text-[11px] font-bold text-gray-400 tracking-widest uppercase mb-2">Delivery</p>
                                        <p className="text-xs font-bold text-gray-900">7–14 days (international)</p>
                                    </div>
                                    <div className="bg-gray-50 p-4 sm:p-6 rounded-2xl border border-gray-100">
                                        <p className="text-[11px] font-bold text-gray-400 tracking-widest uppercase mb-2">Returns</p>
                                        <p className="text-xs font-bold text-gray-900">14-day returns on unused items</p>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Reviews block — mobile-first */}
                {(reviews.data.length > 0 || (product.review_count != null && product.review_count > 0)) && (
                    <section className="mt-12 sm:mt-16 pt-8 sm:pt-12 border-t border-gray-100" aria-label="Customer reviews">
                        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Customer reviews</h2>
                        <div className="space-y-4">
                            {reviews.data.map((r) => (
                                <div key={r.id} className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="flex items-center gap-0.5">
                                            {[1, 2, 3, 4, 5].map((i) => (
                                                <Star key={i} className={`h-4 w-4 ${i <= r.rating ? 'text-yellow-400 fill-current' : 'text-gray-200'}`} />
                                            ))}
                                        </span>
                                        <span className="text-xs font-semibold text-gray-700">{r.display_name}</span>
                                        <span className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString()}</span>
                                    </div>
                                    {r.review_text && <p className="text-sm text-gray-700 leading-relaxed">{r.review_text}</p>}
                                </div>
                            ))}
                        </div>
                        {reviews.meta.total > reviews.data.length && (
                            <p className="text-sm text-gray-500 mt-3">Showing {reviews.data.length} of {reviews.meta.total} reviews.</p>
                        )}
                    </section>
                )}

                {/* Related Products Section */}
                {product && (
                    <div className="mt-24 border-t border-gray-100 pt-16">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Related Assets</h2>
                            {catName && <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{catName}</span>}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {localProducts
                                .filter((p: any) => (typeof p.category === 'string' ? p.category : p.category?.name) === catName && p.name !== product.name)
                                .slice(0, 4)
                                .map((relatedProduct, idx) => (
                                    <ProductCard key={idx} product={relatedProduct as any} />
                                ))}
                        </div>
                    </div>
                )}
            </div>
        </ShopLayout>
    );
}
