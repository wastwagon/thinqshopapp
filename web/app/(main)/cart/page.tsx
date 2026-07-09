'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trash2, Plus, Minus, ShoppingCart } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import PriceDisplay from '@/components/ui/PriceDisplay';
import ShopLayout from '@/components/layout/ShopLayout';
import PageHeader from '@/components/ui/PageHeader';
import ShopContent from '@/components/shop/ShopContent';
import ShopTrustRow from '@/components/shop/ShopTrustRow';
import { cartItemUnitGhs } from '@/lib/product-utils';
import { getMediaUrl } from '@/lib/media';
import LiveRegion from '@/components/ui/LiveRegion';

export default function CartPage() {
    const { cart, updateQuantity, removeFromCart, cartTotal } = useCart();
    const router = useRouter();

    const handleCheckout = () => {
        if (cart.length > 0) router.push('/checkout');
    };

    return (
        <ShopLayout>
            <div className="bg-white min-h-full pb-8">
                <ShopContent className="py-8 pb-36 md:pb-8">
                    <PageHeader
                        title="Shopping bag"
                        subtitle="Review items before checkout"
                        accent="blue"
                    />
                    <ShopTrustRow compact />
                    <LiveRegion
                        message={cart.length > 0 ? `Bag: ${cart.length} item${cart.length === 1 ? '' : 's'}.` : ''}
                    />

                    <div className="mt-5 rounded-2xl bg-white border border-gray-100 shadow-[0_4px_24px_-12px_rgba(0,0,0,0.08)] overflow-hidden">
                        <ul role="list" className="divide-y divide-gray-100">
                            {cart.length === 0 && (
                                <li className="py-16 text-center px-4">
                                    <div className="inline-flex w-14 h-14 bg-blue-50 border border-blue-100 rounded-2xl items-center justify-center mb-4">
                                        <ShoppingCart className="h-6 w-6 text-blue-500" />
                                    </div>
                                    <p className="text-gray-600 font-medium text-sm">Your bag is empty</p>
                                    <p className="text-gray-400 text-xs mt-1">Add items to get started</p>
                                    <Link
                                        href="/shop"
                                        className="inline-flex mt-5 min-h-[44px] px-6 items-center justify-center rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
                                    >
                                        Shop now
                                    </Link>
                                </li>
                            )}
                            {cart.map((item) => {
                                const rawImg =
                                    item.product.gallery_images?.[0] ||
                                    (Array.isArray(item.product.images) ? item.product.images[0] : item.product.images) ||
                                    '';
                                const mainImage = rawImg ? getMediaUrl(String(rawImg)) : '/placeholder.svg';
                                const productSlug = (item.product as { slug?: string }).slug || item.product.id;
                                return (
                                    <li key={item.id} className="flex py-5 gap-4 px-4 sm:px-5">
                                        <Link
                                            href={`/products/${productSlug}`}
                                            className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-gray-50 border border-gray-200/90 relative"
                                        >
                                            <img
                                                src={String(mainImage)}
                                                alt={item.product.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </Link>
                                        <div className="flex flex-1 flex-col min-w-0">
                                            <div className="flex justify-between gap-2">
                                                <h2 className="text-sm font-semibold text-gray-900 line-clamp-2">
                                                    <Link
                                                        href={`/products/${productSlug}`}
                                                        className="hover:text-blue-600 transition-colors"
                                                    >
                                                        {item.product.name}
                                                    </Link>
                                                </h2>
                                                <p className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                                                    <PriceDisplay amountGhs={cartItemUnitGhs(item) * item.quantity} />
                                                </p>
                                            </div>
                                            {(item as { variant?: { variant_type: string; variant_value: string } }).variant && (
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    {(item as { variant: { variant_type: string; variant_value: string } }).variant.variant_type.replace(/_/g, ' ')}:{' '}
                                                    {(item as { variant: { variant_value: string } }).variant.variant_value}
                                                </p>
                                            )}
                                            <p className="text-xs text-gray-400 mt-1">
                                                <PriceDisplay amountGhs={cartItemUnitGhs(item)} /> each
                                            </p>
                                            <div className="flex flex-1 items-end justify-between mt-3 flex-wrap gap-2">
                                                <div className="flex items-center p-0.5 bg-gray-50 border border-gray-200/90 rounded-lg">
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                        className="min-w-[44px] min-h-[44px] w-9 h-9 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-600 disabled:opacity-30"
                                                        disabled={item.quantity <= 1}
                                                        aria-label="Decrease quantity"
                                                    >
                                                        <Minus className="h-3.5 w-3.5" aria-hidden />
                                                    </button>
                                                    <span className="w-8 text-center text-xs font-semibold text-gray-900">{item.quantity}</span>
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                        className="min-w-[44px] min-h-[44px] w-9 h-9 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-600"
                                                        aria-label="Increase quantity"
                                                    >
                                                        <Plus className="h-3.5 w-3.5" aria-hidden />
                                                    </button>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeFromCart(item.id)}
                                                    className="min-h-[44px] flex items-center text-xs font-medium text-gray-400 hover:text-red-600 transition-colors gap-1.5 px-2"
                                                    aria-label={`Remove ${item.product.name} from cart`}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>

                    {cart.length > 0 && (
                        <div className="mt-5 rounded-2xl bg-white border border-gray-100 shadow-[0_4px_24px_-12px_rgba(0,0,0,0.08)] p-5 hidden md:block">
                            <div className="flex justify-between items-center mb-1">
                                <p className="text-sm font-medium text-gray-600">Subtotal</p>
                                <p className="text-xl font-semibold text-gray-900">
                                    <PriceDisplay amountGhs={cartTotal} />
                                </p>
                            </div>
                            <p className="text-xs text-gray-400 mb-5">Tax and shipping calculated at checkout</p>
                            <div className="flex flex-col gap-2.5">
                                <button
                                    onClick={handleCheckout}
                                    disabled={cart.length === 0}
                                    className="w-full min-h-[44px] bg-blue-600 text-white h-12 rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors disabled:opacity-40 flex items-center justify-center"
                                >
                                    Checkout
                                </button>
                                <Link
                                    href="/shop"
                                    className="w-full min-h-[44px] h-12 rounded-xl border border-gray-200/90 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors flex items-center justify-center"
                                >
                                    Continue shopping
                                </Link>
                            </div>
                        </div>
                    )}

                    {cart.length > 0 && (
                        <div
                            className="fixed left-0 right-0 z-[90] md:hidden border-t border-gray-200/90 bg-white/95 backdrop-blur-md px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] bottom-[calc(3.25rem+env(safe-area-inset-bottom,0px))]"
                            role="region"
                            aria-label="Checkout actions"
                        >
                            <div className="flex items-center justify-between gap-3 mb-2.5">
                                <p className="text-xs text-gray-500">Subtotal</p>
                                <p className="text-lg font-semibold text-gray-900">
                                    <PriceDisplay amountGhs={cartTotal} />
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={handleCheckout}
                                className="w-full min-h-[48px] bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors touch-manipulation"
                            >
                                Checkout
                            </button>
                        </div>
                    )}
                </ShopContent>
            </div>
        </ShopLayout>
    );
}
