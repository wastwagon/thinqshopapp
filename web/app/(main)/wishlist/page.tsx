'use client';

import React from 'react';
import Link from 'next/link';
import { Heart, ArrowLeft, Zap, Trash2 } from 'lucide-react';
import ShopLayout from '@/components/layout/ShopLayout';
import PageHeader from '@/components/ui/PageHeader';
import { useWishlist } from '@/context/WishlistContext';
import ProductCard from '@/components/ui/ProductCard';

export default function WishlistPage() {
    const { wishlist, removeFromWishlist } = useWishlist();

    return (
        <ShopLayout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
                <PageHeader
                    title="Your Wishlist"
                    subtitle="Items you've saved for later"
                    breadcrumbs={[{ label: 'Wishlist' }]}
                />
                <div className="flex justify-end -mt-8 mb-12">
                    <Link href="/shop" className="group flex items-center gap-2 min-h-[44px] text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
                        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
                        Back to Shop
                    </Link>
                </div>

                {wishlist.length === 0 ? (
                    <div className="bg-gray-50 rounded-2xl border border-gray-100 p-16 text-center relative overflow-hidden">
                        <div className="inline-flex w-20 h-20 bg-gray-100 border border-gray-200 rounded-2xl items-center justify-center mb-6">
                            <Heart className="h-10 w-10 text-gray-300" />
                        </div>

                        <h2 className="text-xl font-bold text-gray-900 mb-3 tracking-tight">Your wishlist is empty</h2>
                        <p className="text-gray-500 text-sm mb-10 max-w-sm mx-auto leading-relaxed">
                            Save products you like to revisit them later.
                        </p>

                        <Link
                            href="/shop"
                            className="inline-flex bg-gray-900 text-white h-14 px-10 rounded-xl font-bold text-sm hover:bg-gray-800 transition-all shadow-lg items-center justify-center gap-3"
                        >
                            <Zap className="h-4 w-4" />
                            Explore Shop
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {wishlist.map((product) => (
                            <div key={product.id} className="relative group">
                                <ProductCard product={product as any} />
                                <button
                                    type="button"
                                    onClick={() => removeFromWishlist(product.id)}
                                    className="absolute top-4 right-4 min-w-[44px] min-h-[44px] w-10 h-10 bg-white/90 backdrop-blur border border-gray-200 rounded-xl flex items-center justify-center text-red-500 hover:bg-red-50 transition-all z-10 opacity-100 md:opacity-0 md:group-hover:opacity-100"
                                    aria-label="Remove from wishlist"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="mt-20 pt-12 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-8">
                    <p className="text-xs text-gray-400">Saved items are stored locally</p>
                    <div className="flex items-center gap-2">
                        <Heart className="h-4 w-4 text-gray-400" />
                        <span className="text-xs text-gray-400">{wishlist.length} item{wishlist.length !== 1 ? 's' : ''} in wishlist</span>
                    </div>
                </div>
            </div>
        </ShopLayout>
    );
}
