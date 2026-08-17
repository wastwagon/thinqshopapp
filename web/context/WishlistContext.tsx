'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '@/lib/axios';
import { useAuth } from './AuthContext';
import {
    addGuestWishlistItem,
    mapServerWishlist,
    mergeGuestWishlist,
    readGuestWishlist,
    removeGuestWishlistItem,
    writeGuestWishlist,
    type WishlistProduct,
} from '@/lib/guest-wishlist';

interface WishlistContextType {
    wishlist: WishlistProduct[];
    loading: boolean;
    syncedToAccount: boolean;
    isInWishlist: (productId: number) => boolean;
    addToWishlist: (product: WishlistProduct) => void;
    removeFromWishlist: (productId: number) => void;
    toggleWishlist: (product: WishlistProduct) => void;
}

const WishlistContext = createContext<WishlistContextType | null>(null);

export type { WishlistProduct };

export const WishlistProvider = ({ children }: { children: React.ReactNode }) => {
    const [wishlist, setWishlist] = useState<WishlistProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const { user, loading: authLoading } = useAuth();

    useEffect(() => {
        if (authLoading) return;
        let cancelled = false;

        const run = async () => {
            setLoading(true);
            try {
                if (!user) {
                    if (!cancelled) setWishlist(readGuestWishlist());
                    return;
                }
                const result = await mergeGuestWishlist(async (items) => {
                    const { data } = await api.post('/wishlist/merge', {
                        productIds: items.map((item) => item.id),
                    });
                    if (!cancelled) setWishlist(mapServerWishlist(data?.items ?? data));
                    const failed = Number(data?.failed || 0);
                    return { posted: Math.max(0, items.length - failed), failed };
                });
                if (!cancelled && result.failed > 0) {
                    toast.error(
                        result.failed === 1
                            ? 'One saved item could not be added to your wishlist'
                            : `${result.failed} saved items could not be added to your wishlist`,
                    );
                }
                if (!cancelled && result.posted === 0 && result.failed === 0) {
                    const { data } = await api.get('/wishlist');
                    setWishlist(mapServerWishlist(data));
                }
            } catch {
                if (!cancelled) {
                    if (!user) setWishlist(readGuestWishlist());
                    else toast.error('Could not load your wishlist');
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        run();
        return () => {
            cancelled = true;
        };
    }, [user, authLoading]);

    const isInWishlist = (productId: number) => wishlist.some((p) => p.id === productId);

    const addToWishlist = (product: WishlistProduct) => {
        const id = Number(product.id);
        if (!Number.isInteger(id) || id <= 0) return;
        if (isInWishlist(id)) return;
        const nextProduct = { ...product, id };
        setWishlist((prev) => {
            const next = addGuestWishlistItem(prev, nextProduct);
            if (!user) writeGuestWishlist(next);
            return next;
        });
        toast.success('Added to wishlist');
        if (user) {
            api.post('/wishlist', { productId: id }).catch(() => {
                toast.error('Could not save wishlist');
                setWishlist((prev) => removeGuestWishlistItem(prev, id));
            });
        }
    };

    const removeFromWishlist = (productId: number) => {
        const existing = wishlist.find((item) => item.id === productId);
        if (!existing) return;
        setWishlist((prev) => {
            const next = removeGuestWishlistItem(prev, productId);
            if (!user) writeGuestWishlist(next);
            return next;
        });
        toast.success('Removed from wishlist');
        if (user) {
            api.delete(`/wishlist/${productId}`).catch(() => {
                toast.error('Could not update wishlist');
                setWishlist((prev) => addGuestWishlistItem(prev, existing));
            });
        }
    };

    const toggleWishlist = (product: WishlistProduct) => {
        if (isInWishlist(product.id)) {
            removeFromWishlist(product.id);
        } else {
            addToWishlist(product);
        }
    };

    return (
        <WishlistContext.Provider
            value={{
                wishlist,
                loading,
                syncedToAccount: Boolean(user),
                isInWishlist,
                addToWishlist,
                removeFromWishlist,
                toggleWishlist,
            }}
        >
            {children}
        </WishlistContext.Provider>
    );
};

export const useWishlist = () => {
    const ctx = useContext(WishlistContext);
    if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
    return ctx;
};
