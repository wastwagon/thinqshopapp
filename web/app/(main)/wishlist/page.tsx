'use client';

import Link from 'next/link';
import { Heart, Trash2 } from 'lucide-react';
import ShopLayout from '@/components/layout/ShopLayout';
import PageHeader from '@/components/ui/PageHeader';
import ShopPageShell from '@/components/shop/ShopContent';
import ShopTrustRow from '@/components/shop/ShopTrustRow';
import { useWishlist } from '@/context/WishlistContext';
import ProductCard from '@/components/ui/ProductCard';

export default function WishlistPage() {
    const { wishlist, removeFromWishlist } = useWishlist();

    return (
        <ShopLayout>
            <div className="bg-white min-h-full pb-8">
                <ShopPageShell wide className="py-8 sm:py-12">
                    <PageHeader
                        title="Wishlist"
                        subtitle="Items you've saved for later"
                        accent="amber"
                        breadcrumbs={[{ label: 'Wishlist' }]}
                    />
                    <ShopTrustRow compact />

                    {wishlist.length === 0 ? (
                        <div className="mt-5 rounded-2xl bg-white border border-gray-100 shadow-[0_4px_24px_-12px_rgba(0,0,0,0.08)] py-16 px-6 text-center">
                            <div className="inline-flex w-14 h-14 bg-orange-50 border border-orange-100 rounded-2xl items-center justify-center mb-4">
                                <Heart className="h-7 w-7 text-orange-400" />
                            </div>
                            <h2 className="text-lg font-bold text-gray-900 mb-2">Your wishlist is empty</h2>
                            <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
                                Save products you like to revisit them later.
                            </p>
                            <Link
                                href="/shop"
                                className="inline-flex min-h-[44px] px-6 items-center justify-center rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 transition-colors"
                            >
                                Explore shop
                            </Link>
                        </div>
                    ) : (
                        <div className="mt-5 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                            {wishlist.map((product) => (
                                <div key={product.id} className="relative group">
                                    <ProductCard product={product as any} />
                                    <button
                                        type="button"
                                        onClick={() => removeFromWishlist(product.id)}
                                        className="absolute top-3 right-3 min-w-[44px] min-h-[44px] w-9 h-9 bg-white border border-gray-200/90 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors z-10 md:opacity-0 md:group-hover:opacity-100 shadow-sm"
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
                </ShopPageShell>
            </div>
        </ShopLayout>
    );
}
