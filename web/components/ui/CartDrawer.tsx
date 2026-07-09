'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Trash2, Plus, Minus, ShoppingCart } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import PriceDisplay from '@/components/ui/PriceDisplay';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cartItemUnitGhs } from '@/lib/product-utils';
import { getMediaUrl } from '@/lib/media';

export default function CartDrawer() {
    const { cart, isCartOpen, toggleCart, updateQuantity, removeFromCart, cartTotal } = useCart();
    const router = useRouter();

    const handleCheckout = () => {
        toggleCart();
        router.push('/checkout');
    }

    return (
        <Transition.Root show={isCartOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={toggleCart}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-in-out duration-500"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in-out duration-500"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/25 transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-hidden">
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="pointer-events-none fixed inset-0 flex items-end justify-center md:items-stretch md:justify-end md:pl-10">
                            <Transition.Child
                                as={Fragment}
                                enter="transform transition ease-out duration-300 md:duration-500"
                                enterFrom="translate-y-full md:translate-y-0 md:translate-x-full"
                                enterTo="translate-y-0 md:translate-x-0"
                                leave="transform transition ease-in duration-250 md:duration-500"
                                leaveFrom="translate-y-0 md:translate-x-0"
                                leaveTo="translate-y-full md:translate-x-full"
                            >
                                <Dialog.Panel className="pointer-events-auto w-full max-w-md md:h-full max-h-[min(92vh,720px)] md:max-h-none rounded-t-2xl md:rounded-none overflow-hidden">
                                    <div className="flex h-full max-h-[inherit] flex-col overflow-hidden bg-white border-t border-gray-200/90 md:border-t-0 md:border-l relative">
                                        <div className="mx-auto mt-2 mb-1 h-1 w-10 shrink-0 rounded-full bg-gray-300 md:hidden" aria-hidden />
                                        <div className="flex-1 overflow-y-auto overscroll-y-contain scrollbar-thin px-6 py-6 md:py-8 relative z-10 min-h-0">
                                            <div className="flex items-start justify-between mb-8">
                                                <div>
                                                    <Dialog.Title className="text-xl font-bold text-gray-900 tracking-tight">Shopping Bag</Dialog.Title>
                                                    <p className="text-sm text-gray-500 mt-0.5">Your selection</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    className="min-w-[44px] min-h-[44px] w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all"
                                                    onClick={toggleCart}
                                                    aria-label="Close cart"
                                                >
                                                    <X className="h-5 w-5" aria-hidden />
                                                </button>
                                            </div>

                                            <div className="mt-6">
                                                <div className="flow-root">
                                                    <ul role="list" className="-my-6 divide-y divide-gray-100">
                                                        {cart.length === 0 && (
                                                            <li className="py-20 text-center">
                                                                <div className="inline-flex w-16 h-16 bg-gray-50 border border-gray-100 rounded-2xl items-center justify-center mb-6">
                                                                    <ShoppingCart className="h-6 w-6 text-gray-300" />
                                                                </div>
                                                                <p className="text-gray-500 font-medium text-sm">Your bag is empty</p>
                                                                <p className="text-gray-400 text-xs mt-2">Add items to get started</p>
                                                            </li>
                                                        )}
                                                        {cart.map((item) => {
                                                            const rawImg = item.product.gallery_images?.[0] || (Array.isArray(item.product.images) ? item.product.images[0] : item.product.images) || '';
                                                            const mainImage = rawImg ? getMediaUrl(String(rawImg)) : '/placeholder.svg';
                                                            return (
                                                                <li key={item.id} className="flex py-6 gap-4 group">
                                                                    <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-gray-50 border border-gray-100 relative">
                                                                        <img
                                                                            src={mainImage}
                                                                            alt={item.product.name}
                                                                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                                        />
                                                                    </div>

                                                                    <div className="flex flex-1 flex-col min-w-0">
                                                                        <div>
                                                                            <div className="flex justify-between gap-2">
                                                                                <h3 className="line-clamp-2 text-sm font-semibold text-gray-900">
                                                                                    <Link href={`/products/${(item.product as { slug?: string }).slug || item.product.id}`} onClick={toggleCart} className="hover:text-blue-600 transition-colors">{item.product.name}</Link>
                                                                                </h3>
                                                                                <p className="text-sm font-bold text-gray-900 whitespace-nowrap">
                                                                                    <PriceDisplay amountGhs={cartItemUnitGhs(item) * item.quantity} />
                                                                                </p>
                                                                            </div>
                                                                            {(item as { variant?: { variant_type: string; variant_value: string } }).variant && (
                                                                                <p className="text-xs text-gray-600 mt-0.5 capitalize">
                                                                                    {(item as { variant: { variant_type: string; variant_value: string } }).variant.variant_type.replace(/_/g, ' ')}: {(item as { variant: { variant_value: string } }).variant.variant_value}
                                                                                </p>
                                                                            )}
                                                                            <p className="text-xs text-gray-400 mt-1">
                                                                                <PriceDisplay amountGhs={cartItemUnitGhs(item)} /> each
                                                                            </p>
                                                                        </div>
                                                                        <div className="flex flex-1 items-end justify-between mt-3">
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
                                                                                className="min-h-[44px] flex items-center text-xs font-medium text-gray-400 hover:text-red-500 transition-colors gap-2 px-2"
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
                                            </div>
                                        </div>

                                        <div className="border-t border-gray-100 px-6 py-8 relative z-10 bg-gray-50/80">
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
                                                    className="w-full min-h-[44px] bg-blue-600 text-white h-12 rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
                                                >
                                                    Checkout
                                                </button>
                                                <button
                                                    type="button"
                                                    className="w-full min-h-[44px] h-12 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-all flex items-center justify-center"
                                                    onClick={toggleCart}
                                                >
                                                    Continue Shopping
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
}
