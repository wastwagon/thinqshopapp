'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Trash2, Plus, Minus, ShoppingCart } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
                    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-hidden">
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                            <Transition.Child
                                as={Fragment}
                                enter="transform transition ease-in-out duration-500 sm:duration-700"
                                enterFrom="translate-x-full"
                                enterTo="translate-x-0"
                                leave="transform transition ease-in-out duration-500 sm:duration-700"
                                leaveFrom="translate-x-0"
                                leaveTo="translate-x-full"
                            >
                                <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                                    <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-2xl border-l border-gray-100 relative">
                                        <div className="flex-1 overflow-y-auto px-6 py-8 relative z-10">
                                            <div className="flex items-start justify-between mb-8">
                                                <div>
                                                    <Dialog.Title className="text-xl font-bold text-gray-900 tracking-tight">Shopping Bag</Dialog.Title>
                                                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mt-1">Your selection</p>
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
                                                            const mainImage = item.product.gallery_images?.[0] || (Array.isArray(item.product.images) ? item.product.images[0] : item.product.images) || '/placeholder.svg';
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
                                                                                <p className="text-sm font-bold text-gray-900 whitespace-nowrap">₵{(parseFloat(String(item.product.price).replace(/[^0-9.]/g, '')) * item.quantity).toFixed(2)}</p>
                                                                            </div>
                                                                            <p className="text-[10px] text-gray-400 mt-1">₵{parseFloat(String(item.product.price).replace(/[^0-9.]/g, '')).toFixed(2)} each</p>
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
                                                                                className="min-h-[44px] flex items-center text-[10px] font-semibold text-gray-400 hover:text-red-500 uppercase tracking-wider transition-all gap-2 px-2"
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
                                                    <p className="text-xl font-bold text-gray-900">₵{cartTotal.toFixed(2)}</p>
                                                </div>
                                                <p className="text-xs text-gray-400">Tax and shipping calculated at checkout</p>
                                            </div>

                                            <div className="flex flex-col gap-3">
                                                <button
                                                    onClick={handleCheckout}
                                                    disabled={cart.length === 0}
                                                    className="w-full bg-gray-900 text-white h-12 rounded-xl font-semibold text-sm hover:bg-gray-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                                >
                                                    Checkout
                                                </button>
                                                <button
                                                    type="button"
                                                    className="w-full h-12 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-all"
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
