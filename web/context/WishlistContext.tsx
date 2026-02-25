'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface WishlistProduct {
    id: number;
    name: string;
    price: string | number;
    slug?: string;
    images?: string[];
    gallery_images?: string[];
    category?: string | { name: string };
}

interface WishlistContextType {
    wishlist: WishlistProduct[];
    isInWishlist: (productId: number) => boolean;
    addToWishlist: (product: WishlistProduct) => void;
    removeFromWishlist: (productId: number) => void;
    toggleWishlist: (product: WishlistProduct) => void;
}

const STORAGE_KEY = 'thinqshop_wishlist';

const WishlistContext = createContext<WishlistContextType | null>(null);

export const WishlistProvider = ({ children }: { children: React.ReactNode }) => {
    const [wishlist, setWishlist] = useState<WishlistProduct[]>([]);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                setWishlist(Array.isArray(parsed) ? parsed : []);
            }
        } catch (_) {
            setWishlist([]);
        }
    }, [mounted]);

    useEffect(() => {
        if (!mounted) return;
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(wishlist));
        } catch (_) {}
    }, [mounted, wishlist]);

    const isInWishlist = (productId: number) => wishlist.some((p) => p.id === productId);

    const addToWishlist = (product: WishlistProduct) => {
        setWishlist((prev) => {
            if (prev.some((p) => p.id === product.id)) return prev;
            toast.success('Added to wishlist');
            return [...prev, product];
        });
    };

    const removeFromWishlist = (productId: number) => {
        setWishlist((prev) => {
            const next = prev.filter((p) => p.id !== productId);
            if (next.length < prev.length) toast.success('Removed from wishlist');
            return next;
        });
    };

    const toggleWishlist = (product: WishlistProduct) => {
        if (isInWishlist(product.id)) {
            removeFromWishlist(product.id);
        } else {
            addToWishlist(product);
        }
    };

    return (
        <WishlistContext.Provider value={{ wishlist, isInWishlist, addToWishlist, removeFromWishlist, toggleWishlist }}>
            {children}
        </WishlistContext.Provider>
    );
};

export const useWishlist = () => {
    const ctx = useContext(WishlistContext);
    if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
    return ctx;
};
