'use client';

import { Heart, Trash2 } from 'lucide-react';
import ShopLayout from '@/components/layout/ShopLayout';
import PageHeader from '@/components/ui/PageHeader';
import ShopPageShell from '@/components/shop/ShopContent';
import ShopTrustRow from '@/components/shop/ShopTrustRow';
import { useWishlist } from '@/context/WishlistContext';
import ProductCard from '@/components/ui/ProductCard';
import EmptyState from '@/components/ui/EmptyState';
import { ShopLoadingState } from '@/components/shop/ShopSuccessShell';

export default function WishlistPage() {
    const { wishlist, removeFromWishlist, loading, syncedToAccount } = useWishlist();

    if (loading) {
        return (
            <ShopLayout>
                <ShopLoadingState message="Loading wishlist…" />
            </ShopLayout>
        );
    }

    return (
        <ShopLayout>
            <div className="bg-white min-h-full pb-8">
                <ShopPageShell wide className="py-8 sm:py-12">
                    <PageHeader
                        title="Wishlist"
                        subtitle="Items you've saved for later"
                        accent="blue"
                        breadcrumbs={[{ label: 'Wishlist' }]}
                    />
                    <ShopTrustRow compact />

                    {wishlist.length === 0 ? (
                        <div className="mt-5">
                            <EmptyState
                                icon={Heart}
                                title="Your wishlist is empty"
                                description="Save products you like to revisit them later."
                                actionLabel="Explore shop"
                                actionHref="/shop"
                            />
                        </div>
                    ) : (
                        <div className="mt-5 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                            {wishlist.map((product) => (
                                <div key={product.id} className="relative group">
                                    <ProductCard product={{ ...product, category: product.category ?? 'Uncategorized' }} />
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
                            {wishlist.length} item{wishlist.length !== 1 ? 's' : ''} ·{' '}
                            {syncedToAccount ? 'saved to your account' : 'saved on this device'}
                        </p>
                    )}
                </ShopPageShell>
            </div>
        </ShopLayout>
    );
}
