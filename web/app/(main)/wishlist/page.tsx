'use client';

import Link from 'next/link';
import { Heart, ArrowLeft, Trash2 } from 'lucide-react';
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
                    title="Wishlist"
                    subtitle="Items you've saved for later"
                    breadcrumbs={[{ label: 'Wishlist' }]}
                />
                <div className="flex justify-end mb-8">
                    <Link
                        href="/shop"
                        className="group flex items-center gap-2 min-h-[44px] text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
                        Back to shop
                    </Link>
                </div>

                {wishlist.length === 0 ? (
                    <div className="flat-card py-16 px-6 text-center">
                        <div className="inline-flex w-14 h-14 bg-gray-50 border border-gray-200/90 rounded-xl items-center justify-center mb-4">
                            <Heart className="h-7 w-7 text-gray-300" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-2">Your wishlist is empty</h2>
                        <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
                            Save products you like to revisit them later.
                        </p>
                        <Link
                            href="/shop"
                            className="inline-flex min-h-[44px] px-6 items-center justify-center rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand/90 transition-colors"
                        >
                            Explore shop
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                        {wishlist.map((product) => (
                            <div key={product.id} className="relative group">
                                <ProductCard product={product as any} />
                                <button
                                    type="button"
                                    onClick={() => removeFromWishlist(product.id)}
                                    className="absolute top-3 right-3 min-w-[44px] min-h-[44px] w-9 h-9 bg-white border border-gray-200/90 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors z-10 md:opacity-0 md:group-hover:opacity-100"
                                    aria-label="Remove from wishlist"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {wishlist.length > 0 && (
                    <p className="mt-10 text-center text-xs text-gray-400">
                        {wishlist.length} item{wishlist.length !== 1 ? 's' : ''} · saved on this device
                    </p>
                )}
            </div>
        </ShopLayout>
    );
}
