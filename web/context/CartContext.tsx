'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '@/lib/axios';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';
import { trackAddToCart } from '@/lib/analytics';
import { cartItemLineTotalGhs } from '@/lib/product-utils';
import { resolveProductLinePricing } from '@/lib/wholesale-pricing';
import {
    addOrIncrementGuestLine,
    mergeGuestCart,
    pickVariant,
    readGuestCart,
    setGuestLineQuantity,
    snapshotProduct,
    writeGuestCart,
    type GuestCartProduct,
    type GuestCartVariant,
} from '@/lib/guest-cart';

interface Product {
    id: number;
    name: string;
    price: number;
    images: string[];
    gallery_images?: string[];
    slug?: string;
    wholesale_min_quantity?: number | null;
    wholesale_discount_pct?: number | string | null;
    enforce_min_quantity?: boolean;
    is_consignment?: boolean;
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
    addToCart: (
        productId: number,
        quantity: number,
        variantId?: number,
        options?: { openDrawer?: boolean; successMessage?: string; product?: unknown },
    ) => Promise<boolean>;
    updateQuantity: (itemId: number, quantity: number) => Promise<void>;
    removeFromCart: (itemId: number) => Promise<void>;
    clearCart: () => Promise<void>;
    isCartOpen: boolean;
    toggleCart: () => void;
}

const CartContext = createContext<CartContextType | null>(null);

function guestStock(product: GuestCartProduct, variant: GuestCartVariant | null): number | null {
    if (product.is_consignment) {
        return product.stock_quantity ?? null;
    }
    if (variant?.stock_quantity != null) return Number(variant.stock_quantity);
    if (product.stock_quantity != null) return Number(product.stock_quantity);
    return null;
}

function assertGuestQty(
    product: GuestCartProduct,
    variant: GuestCartVariant | null,
    quantity: number,
): string | null {
    if (product.is_active === false) return 'This product is no longer available';
    const listPrice = Number(product.price) + Number(variant?.price_adjust ?? 0);
    const pricing = resolveProductLinePricing(product, {
        listPrice,
        quantity,
        stock: guestStock(product, variant),
    });
    return pricing.error;
}

async function loadProductSnapshot(
    productId: number,
    variantId: number | undefined,
    hint?: unknown,
): Promise<{ product: GuestCartProduct; variant: GuestCartVariant | null }> {
    const hinted = snapshotProduct(hint);
    const hintedVariant = pickVariant(hint, variantId);
    if (hinted && (variantId == null || hintedVariant || isRecordWithVariants(hint))) {
        return { product: hinted, variant: hintedVariant };
    }
    const { data } = await api.get(`/products/${productId}`);
    const product = snapshotProduct(data);
    if (!product) throw new Error('Product not found');
    return { product, variant: pickVariant(data, variantId) };
}

function isRecordWithVariants(value: unknown): boolean {
    return !!value && typeof value === 'object' && Array.isArray((value as { variants?: unknown }).variants);
}

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const { user, loading: authLoading } = useAuth();

    useEffect(() => {
        if (authLoading) return;
        let cancelled = false;

        const run = async () => {
            setLoading(true);
            try {
                if (!user) {
                    if (!cancelled) setCart(readGuestCart());
                    return;
                }
                const result = await mergeGuestCart(async (items) => {
                    const { data } = await api.post('/cart/merge', {
                        items: items.map((item) => ({
                            productId: item.product_id,
                            quantity: item.quantity,
                            ...(item.variant_id != null ? { variantId: item.variant_id } : {}),
                        })),
                    });
                    if (!cancelled && Array.isArray(data?.cart)) setCart(data.cart);
                    const failed = Number(data?.failed || 0);
                    return { posted: Math.max(0, items.length - failed), failed };
                });
                if (!cancelled && result.failed > 0) {
                    toast.error(
                        result.failed === 1
                            ? 'One saved item could not be added to your cart'
                            : `${result.failed} saved items could not be added to your cart`,
                    );
                }
                if (!cancelled && result.posted === 0 && result.failed === 0) {
                    const { data } = await api.get('/cart');
                    setCart(data);
                }
            } catch {
                if (!cancelled) {
                    if (!user) setCart(readGuestCart());
                    else toast.error('Could not load your cart');
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

    const addToCart = async (
        productId: number,
        quantity: number,
        variantId?: number,
        options?: { openDrawer?: boolean; successMessage?: string; product?: unknown },
    ): Promise<boolean> => {
        const openDrawer = options?.openDrawer !== false;
        if (!user) {
            try {
                const { product, variant } = await loadProductSnapshot(
                    productId,
                    variantId,
                    options?.product,
                );
                const current = readGuestCart();
                const existing = current.find(
                    (item) =>
                        item.product_id === product.id && (item.variant_id ?? null) === (variantId ?? null),
                );
                const nextQty = (existing?.quantity ?? 0) + quantity;
                const error = assertGuestQty(product, variant, nextQty);
                if (error) {
                    toast.error(error);
                    return false;
                }
                const next = addOrIncrementGuestLine(current, {
                    product,
                    quantity,
                    variantId,
                    variant,
                });
                writeGuestCart(next);
                setCart(next);
                trackAddToCart(String(productId), quantity);
                toast.success(options?.successMessage ?? 'Added to cart');
                if (openDrawer) setIsCartOpen(true);
                return true;
            } catch (error: unknown) {
                const ax = error as { response?: { data?: { message?: string } } };
                toast.error(ax.response?.data?.message || 'Failed to add to cart');
                return false;
            }
        }
        try {
            await api.post('/cart', { productId, quantity, ...(variantId != null ? { variantId } : {}) });
            trackAddToCart(String(productId), quantity);
            toast.success(options?.successMessage ?? 'Added to cart');
            const { data } = await api.get('/cart');
            setCart(data);
            if (openDrawer) setIsCartOpen(true);
            return true;
        } catch (error: unknown) {
            const ax = error as { response?: { data?: { message?: string } } };
            toast.error(ax.response?.data?.message || 'Failed to add to cart');
            return false;
        }
    };

    const updateQuantity = async (itemId: number, quantity: number) => {
        if (!user) {
            const current = readGuestCart();
            const item = current.find((row) => row.id === itemId);
            if (!item) return;
            const error = quantity > 0 ? assertGuestQty(item.product, item.variant ?? null, quantity) : null;
            if (error) {
                toast.error(error);
                return;
            }
            const next = setGuestLineQuantity(current, itemId, quantity);
            writeGuestCart(next);
            setCart(next);
            return;
        }
        try {
            await api.patch(`/cart/${itemId}`, { quantity });
            const { data } = await api.get('/cart');
            setCart(data);
        } catch (error: unknown) {
            const ax = error as { response?: { data?: { message?: string } } };
            toast.error(ax.response?.data?.message || 'Failed to update cart');
        }
    };

    const removeFromCart = async (itemId: number) => {
        if (!user) {
            const next = readGuestCart().filter((item) => item.id !== itemId);
            writeGuestCart(next);
            setCart(next);
            return;
        }
        try {
            await api.delete(`/cart/${itemId}`);
            const { data } = await api.get('/cart');
            setCart(data);
        } catch {
            toast.error('Failed to remove item');
        }
    };

    const clearCart = async () => {
        if (!user) {
            writeGuestCart([]);
            setCart([]);
            return;
        }
        try {
            await api.delete('/cart');
            setCart([]);
        } catch {
            // Ignore clear errors
        }
    };

    const toggleCart = () => setIsCartOpen(!isCartOpen);

    const itemCount = cart.reduce((total, item) => total + item.quantity, 0);
    const cartTotal = cart.reduce((total, item) => total + cartItemLineTotalGhs(item), 0);

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
