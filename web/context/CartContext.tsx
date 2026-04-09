'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '@/lib/axios';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';
import { trackAddToCart } from '@/lib/analytics';
import { cartItemUnitGhs } from '@/lib/product-utils';

interface Product {
    id: number;
    name: string;
    price: number;
    images: string[];
    gallery_images?: string[];
}

interface CartItem {
    id: number;
    product_id: number;
    quantity: number;
    variant_id?: number | null;
    product: Product;
    variant?: { variant_type: string; variant_value: string; price_adjust?: number | string } | null;
}

interface CartContextType {
    cart: CartItem[];
    itemCount: number;
    cartTotal: number;
    loading: boolean;
    addToCart: (productId: number, quantity: number, variantId?: number) => Promise<void>;
    updateQuantity: (itemId: number, quantity: number) => Promise<void>;
    removeFromCart: (itemId: number) => Promise<void>;
    clearCart: () => Promise<void>;
    isCartOpen: boolean;
    toggleCart: () => void;
}

const CartContext = createContext<CartContextType | null>(null);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const { user } = useAuth();

    const fetchCart = async () => {
        if (!user) {
            setCart([]);
            return;
        }
        setLoading(true);
        try {
            const { data } = await api.get('/cart');
            setCart(data);
        } catch {
            // Cart will stay empty; user can retry
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCart();
    }, [user]);

    const addToCart = async (productId: number, quantity: number, variantId?: number) => {
        if (!user) {
            toast.error("Please login to add items to cart");
            return;
        }
        try {
            await api.post('/cart', { productId, quantity, ...(variantId != null ? { variantId } : {}) });
            trackAddToCart(String(productId), quantity);
            toast.success('Added to cart');
            fetchCart();
            if (typeof window !== 'undefined' && window.innerWidth >= 768) setIsCartOpen(true);
        } catch (error) {
            toast.error('Failed to add to cart');
        }
    };

    const updateQuantity = async (itemId: number, quantity: number) => {
        try {
            await api.patch(`/cart/${itemId}`, { quantity });
            fetchCart();
        } catch (error) {
            toast.error('Failed to update cart');
        }
    };

    const removeFromCart = async (itemId: number) => {
        try {
            await api.delete(`/cart/${itemId}`);
            fetchCart();
        } catch (error) {
            toast.error('Failed to remove item');
        }
    };

    const clearCart = async () => {
        try {
            await api.delete('/cart');
            setCart([]);
        } catch {
            // Ignore clear errors
        }
    }

    const toggleCart = () => setIsCartOpen(!isCartOpen);

    const itemCount = cart.reduce((total, item) => total + item.quantity, 0);
    const cartTotal = cart.reduce((total, item) => total + item.quantity * cartItemUnitGhs(item), 0);

    return (
        <CartContext.Provider value={{
            cart,
            itemCount,
            cartTotal,
            loading,
            addToCart,
            updateQuantity,
            removeFromCart,
            clearCart,
            isCartOpen,
            toggleCart
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) throw new Error("useCart must be used within CartProvider");
    return context;
};
