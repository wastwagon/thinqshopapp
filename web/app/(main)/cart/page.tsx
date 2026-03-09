'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trash2, Plus, Minus, ShoppingCart } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import PriceDisplay from '@/components/ui/PriceDisplay';
import ShopLayout from '@/components/layout/ShopLayout';

export default function CartPage() {
    const { cart, updateQuantity, removeFromCart, cartTotal } = useCart();
    const router = useRouter();

    const handleCheckout = () => {
        if (cart.length > 0) router.push('/checkout');
    };

    return (
        <ShopLayout>
            <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 pb-24">
                <div className="mb-8">
                    <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 tracking-tight">Shopping Bag</h1>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mt-1">Your selection</p>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <ul role="list" className="divide-y divide-gray-100">
                        {cart.length === 0 && (
                            <li className="py-20 text-center">
                                <div className="inline-flex w-16 h-16 bg-gray-50 border border-gray-100 rounded-2xl items-center justify-center mb-6">
                                    <ShoppingCart className="h-6 w-6 text-gray-300" />
                                </div>
                                <p className="text-gray-500 font-medium text-sm">Your bag is empty</p>
                                <p className="text-gray-400 text-xs mt-2">Add items to get started</p>
                                <Link
                                    href="/shop"
                                    className="inline-flex mt-6 min-h-[44px] px-6 items-center justify-center rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800"
                                >
                                    Shop now
                                </Link>
                            </li>
                        )}
                        {cart.map((item) => {
                            const mainImage = item.product.gallery_images?.[0] || (Array.isArray(item.product.images) ? item.product.images[0] : item.product.images) || '/placeholder.svg';
                            const productSlug = (item.product as { slug?: string }).slug || item.product.id;
                            return (
                                <li key={item.id} className="flex py-6 gap-4 px-4 sm:px-6 group">
                                    <Link href={`/products/${productSlug}`} className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-gray-50 border border-gray-100 relative">
                                        <img
                                            src={String(mainImage)}
                                            alt={item.product.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </Link>
                                    <div className="flex flex-1 flex-col min-w-0">
                                        <div className="flex justify-between gap-2">
                                            <h2 className="text-sm font-semibold text-gray-900 line-clamp-2">
                                                <Link href={`/products/${productSlug}`} className="hover:text-blue-600 transition-colors">
                                                    {item.product.name}
                                                </Link>
                                            </h2>
                                            <p className="text-sm font-bold text-gray-900 whitespace-nowrap">
                                                <PriceDisplay amountGhs={parseFloat(String(item.product.price).replace(/[^0-9.]/g, '')) * item.quantity} />
                                            </p>
                                        </div>
                                        {(item as { variant?: { variant_type: string; variant_value: string } }).variant && (
                                            <p className="text-xs text-gray-600 mt-0.5">
                                                {(item as { variant: { variant_type: string; variant_value: string } }).variant.variant_type.replace(/_/g, ' ')}: {(item as { variant: { variant_value: string } }).variant.variant_value}
                                            </p>
                                        )}
                                        <p className="text-xs text-gray-400 mt-1">
                                            <PriceDisplay amountGhs={parseFloat(String(item.product.price).replace(/[^0-9.]/g, '')) * item.quantity} /> total
                                            <span className="text-gray-400"> · <PriceDisplay amountGhs={parseFloat(String(item.product.price).replace(/[^0-9.]/g, ''))} /> each</span>
                                        </p>
                                        <div className="flex flex-1 items-end justify-between mt-3 flex-wrap gap-2">
                                            <div className="flex items-center gap-0 p-1 bg-gray-50 border border-gray-200 rounded-lg">
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                    className="min-w-[44px] min-h-[44px] w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-600 disabled:opacity-30 transition-all"
                                                    disabled={item.quantity <= 1}
                                                    aria-label="Decrease quantity"
                                                >
                                                    <Minus className="h-3 w-3" aria-hidden />
                                                </button>
                                                <span className="w-8 text-center text-xs font-semibold text-gray-900" aria-hidden>{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                    className="min-w-[44px] min-h-[44px] w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-600 transition-all"
                                                    aria-label="Increase quantity"
                                                >
                                                    <Plus className="h-3 w-3" aria-hidden />
                                                </button>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeFromCart(item.id)}
                                                className="min-h-[44px] flex items-center text-xs font-semibold text-gray-400 hover:text-red-500 uppercase tracking-wider transition-all gap-2 px-2"
                                                aria-label={`Remove ${item.product.name} from cart`}
                                            >
                                                <Trash2 className="h-3 w-3" aria-hidden /> Remove
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </div>

                {cart.length > 0 && (
                    <div className="mt-6 bg-gray-50/80 rounded-2xl border border-gray-100 p-6">
                        <div className="space-y-2 mb-6">
                            <div className="flex justify-between items-center">
                                <p className="text-sm font-semibold text-gray-600">Subtotal</p>
                                <p className="text-xl font-bold text-gray-900"><PriceDisplay amountGhs={cartTotal} /></p>
                            </div>
                            <p className="text-xs text-gray-400">Tax and shipping calculated at checkout</p>
                        </div>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={handleCheckout}
                                disabled={cart.length === 0}
                                className="w-full min-h-[44px] bg-gray-900 text-white h-12 rounded-xl font-semibold text-sm hover:bg-gray-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                Checkout
                            </button>
                            <Link
                                href="/shop"
                                className="w-full min-h-[44px] h-12 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-all flex items-center justify-center"
                            >
                                Continue Shopping
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </ShopLayout>
    );
}
