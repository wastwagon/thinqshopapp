'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trash2, ShoppingCart } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import PriceDisplay from '@/components/ui/PriceDisplay';
import ShopLayout from '@/components/layout/ShopLayout';
import PageHeader from '@/components/ui/PageHeader';
import ShopContent from '@/components/shop/ShopContent';
import ShopTrustRow from '@/components/shop/ShopTrustRow';
import { cartItemUnitGhs } from '@/lib/product-utils';
import { getMediaUrl } from '@/lib/media';
import LiveRegion from '@/components/ui/LiveRegion';
import EmptyState from '@/components/ui/EmptyState';
import Button, { buttonVariants } from '@/components/ui/Button';
import QuantityStepper from '@/components/ui/QuantityStepper';

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
                                <li className="p-4 sm:p-6">
                                    <EmptyState
                                        icon={ShoppingCart}
                                        title="Your bag is empty"
                                        description="Add items to get started"
                                        actionLabel="Shop now"
                                        actionHref="/shop"
                                        className="border-0 shadow-none"
                                    />
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
                                                <QuantityStepper
                                                    value={item.quantity}
                                                    onChange={(next) => updateQuantity(item.id, next)}
                                                />
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
                                <Button
                                    onClick={handleCheckout}
                                    disabled={cart.length === 0}
                                    variant="primary"
                                    size="lg"
                                    className="w-full"
                                >
                                    Checkout
                                </Button>
                                <Link
                                    href="/shop"
                                    className={buttonVariants({ variant: 'secondary', size: 'lg', className: 'w-full' })}
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
                            <Button
                                type="button"
                                onClick={handleCheckout}
                                variant="primary"
                                size="lg"
                                className="w-full min-h-[48px]"
                            >
                                Checkout
                            </Button>
                        </div>
                    )}
                </ShopContent>
            </div>
        </ShopLayout>
    );
}
