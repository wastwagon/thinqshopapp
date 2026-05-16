'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import AddressBook from '@/components/ui/AddressBook';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import { CreditCard, Truck, CheckCircle } from 'lucide-react';
import ShopLayout from '@/components/layout/ShopLayout';
import PageHeader from '@/components/ui/PageHeader';
import PriceDisplay from '@/components/ui/PriceDisplay';
import { trackBeginCheckout, trackPurchase } from '@/lib/analytics';
import { cartItemUnitGhs } from '@/lib/product-utils';
import LiveRegion from '@/components/ui/LiveRegion';

const CheckoutPaystackTrigger = dynamic(
    () => import('@/components/checkout/CheckoutPaystackTrigger').then((m) => m.default),
    { ssr: false }
);

export default function CheckoutClient() {
    const { cart, cartTotal, clearCart, loading: cartLoading } = useCart();
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const [step, setStep] = useState(1);
    const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
    const [paymentMethod, setPaymentMethod] = useState('wallet');
    const [isProcessing, setIsProcessing] = useState(false);
    const [walletBalance, setWalletBalance] = useState<number | null>(null);
    const [paystackOrder, setPaystackOrder] = useState<{ orderId: number; reference: string; amount_pesewas: number; total_ghs: number } | null>(null);
    const [publicSettings, setPublicSettings] = useState<Record<string, string>>({});
    const [checkoutQuote, setCheckoutQuote] = useState<{ subtotal: number; shipping_fee: number; total: number } | null>(null);
    const [quoteLoading, setQuoteLoading] = useState(false);

    useEffect(() => {
        if (cart.length > 0) trackBeginCheckout(cartTotal, cart.length);
    }, []);

    useEffect(() => {
        if (authLoading || cartLoading) return;
        if (!user) {
            router.replace('/login?from=/checkout');
            return;
        }
        if (cart.length === 0) {
            router.replace('/cart');
        }
    }, [authLoading, cartLoading, user, cart.length, router]);

    useEffect(() => {
        api.get('/content/settings/public').then((res) => setPublicSettings(res.data || {})).catch(() => {});
    }, []);

    useEffect(() => {
        if (!user) return;
        api.get('/finance/wallet').then((res) => setWalletBalance(Number(res.data.balance_ghs ?? 0))).catch(() => {});
    }, [user]);

    useEffect(() => {
        if (!selectedAddressId || cart.length === 0) {
            setCheckoutQuote(null);
            return;
        }
        setQuoteLoading(true);
        api.get('/orders/quote/checkout', { params: { shipping_address_id: selectedAddressId } })
            .then((res) => {
                setCheckoutQuote({
                    subtotal: Number(res.data?.subtotal ?? cartTotal),
                    shipping_fee: Number(res.data?.shipping_fee ?? 0),
                    total: Number(res.data?.total ?? cartTotal),
                });
            })
            .catch(() => {
                setCheckoutQuote({ subtotal: cartTotal, shipping_fee: 0, total: cartTotal });
            })
            .finally(() => setQuoteLoading(false));
    }, [selectedAddressId, cart.length, cartTotal]);

    const handleAddressSelect = (address: any) => {
        setSelectedAddressId(address.id);
    };

    const handlePlaceOrder = async () => {
        if (!selectedAddressId) {
            toast.error("Please select a shipping address");
            return;
        }
        const payableTotal = checkoutQuote?.total ?? cartTotal;
        if (paymentMethod === 'wallet' && walletBalance !== null && walletBalance < payableTotal) {
            toast.error("Insufficient wallet balance. Top up or use another payment method.");
            return;
        }

        setIsProcessing(true);
        try {
            const { data } = await api.post('/orders', {
                total: payableTotal,
                payment_method: paymentMethod === 'paystack' ? 'card' : paymentMethod,
                shipping_address_id: selectedAddressId,
            });

            if (paymentMethod === 'paystack') {
                if (data.paystack_reference && data.amount_pesewas != null) {
                    setPaystackOrder({
                        orderId: data.id,
                        reference: data.paystack_reference,
                        amount_pesewas: data.amount_pesewas,
                        total_ghs: Number(data.total ?? payableTotal),
                    });
                } else {
                    toast.error("Payment setup failed. Try again.");
                }
            } else {
                const orderId = data?.id ?? data?.order_number;
                trackPurchase(String(orderId), payableTotal, 'GHS');
                toast.success("Order placed successfully!");
                clearCart();
                router.push(`/checkout/success?order=${orderId}`);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to place order");
        } finally {
            if (paymentMethod !== 'paystack') setIsProcessing(false);
        }
    };

    const handlePaystackSuccess = async (ref: { reference: string }) => {
        if (!paystackOrder) return;
        try {
            await api.post(`/orders/${paystackOrder.orderId}/confirm-payment`, {
                paystack_reference: ref.reference,
            });
            trackPurchase(String(paystackOrder.orderId), paystackOrder.total_ghs, 'GHS');
            toast.success("Order placed successfully!");
            clearCart();
            router.push(`/checkout/success?order=${paystackOrder.orderId}`);
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Payment confirmation failed");
        } finally {
            setPaystackOrder(null);
            setIsProcessing(false);
        }
    };

    const handlePaystackClose = () => {
        setPaystackOrder(null);
        setIsProcessing(false);
        toast.error("Payment cancelled.");
    };

    const payableTotal = checkoutQuote?.total ?? cartTotal;
    const liveTotalMessage =
        quoteLoading
            ? 'Calculating shipping and total.'
            : checkoutQuote
              ? `Order total updated. ${payableTotal.toFixed(2)} Ghana cedis.`
              : '';

    if (authLoading || cartLoading || !user || cart.length === 0) {
        return (
            <ShopLayout>
                <div className="max-w-7xl mx-auto px-4 py-16 text-center text-sm text-gray-500" role="status">
                    Loading checkout…
                </div>
            </ShopLayout>
        );
    }

    return (
        <ShopLayout>
            {paystackOrder && (
                <CheckoutPaystackTrigger
                    config={paystackOrder}
                    userEmail={user?.email}
                    onSuccess={handlePaystackSuccess}
                    onClose={handlePaystackClose}
                />
            )}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 lg:py-8">
                <PageHeader
                    title="Checkout"
                    subtitle="Complete your purchase"
                    breadcrumbs={[{ label: 'Cart', href: '/cart' }, { label: 'Checkout' }]}
                />
                <LiveRegion message={liveTotalMessage} />

                <ol className="sr-only" aria-label="Checkout steps">
                    <li aria-current={step === 1 ? 'step' : undefined}>Shipping address</li>
                    <li aria-current={step === 2 ? 'step' : undefined}>Payment</li>
                </ol>

                <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-start">
                    {/* Left Column: Flow */}
                    <div className="lg:col-span-7 space-y-6">
                        {/* Step 1: Shipping Address */}
                        <section
                            className={`flat-card p-6 transition-colors ${step === 1 ? 'border-brand/40 ring-1 ring-brand/10' : 'opacity-70'}`}
                            aria-labelledby="checkout-shipping-heading"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 id="checkout-shipping-heading" className="text-sm font-semibold text-gray-700 flex items-center" aria-current={step === 1 ? 'step' : undefined}>
                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center mr-3 ${step === 1 ? 'bg-brand text-white' : 'bg-gray-100 text-gray-400'}`}>
                                        <Truck className="h-3.5 w-3.5" />
                                    </div>
                                    Shipping Address
                                </h2>
                                {step > 1 && (
                                    <button onClick={() => setStep(1)} className="text-xs font-medium text-brand hover:underline">Edit</button>
                                )}
                            </div>

                            <AddressBook onSelect={handleAddressSelect} selectedId={selectedAddressId || undefined} />

                            {selectedAddressId && step === 1 && (
                                <div className="mt-6 flex justify-end">
                                    <button
                                        onClick={() => setStep(2)}
                                        className="bg-brand text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-brand/90 transition-colors flex items-center gap-2"
                                    >
                                        Proceed to Payment
                                        <CheckCircle className="h-4 w-4" />
                                    </button>
                                </div>
                            )}
                        </section>

                        {/* Step 2: Payment Method */}
                        <section
                            className={`flat-card p-6 transition-colors ${step === 2 ? 'border-brand/40 ring-1 ring-brand/10' : ''} ${step < 2 ? 'opacity-40 pointer-events-none' : ''}`}
                            aria-labelledby="checkout-payment-heading"
                        >
                            <h2 id="checkout-payment-heading" className="text-sm font-semibold text-gray-700 flex items-center mb-6" aria-current={step === 2 ? 'step' : undefined}>
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center mr-3 ${step === 2 ? 'bg-brand text-white' : 'bg-gray-100 text-gray-400'}`}>
                                    <CreditCard className="h-3.5 w-3.5" />
                                </div>
                                Payment Method
                            </h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6" role="radiogroup" aria-label="Payment method">
                                {[
                                    { id: 'wallet', label: walletBalance !== null ? `Wallet Balance (₵${walletBalance.toFixed(2)})` : 'Wallet Balance', icon: '💰' },
                                    { id: 'paystack', label: 'Secure payment on Paystack', icon: '🔒' }
                                ].map((method) => (
                                    <label key={method.id} htmlFor={`payment-${method.id}`} className={`flex items-center justify-between p-4 rounded-xl border-2 transition-colors cursor-pointer group min-h-[44px] touch-manipulation ${paymentMethod === method.id ? 'bg-brand/5 border-brand' : 'bg-gray-50 border-gray-200/90 hover:border-gray-300'}`}>
                                        <div className="flex items-center gap-3">
                                            <input
                                                id={`payment-${method.id}`}
                                                name="payment_method"
                                                type="radio"
                                                checked={paymentMethod === method.id}
                                                onChange={() => setPaymentMethod(method.id)}
                                                className="sr-only"
                                            />
                                            <span className="text-lg" aria-hidden>{method.icon}</span>
                                            <span className={`text-sm font-medium ${paymentMethod === method.id ? 'text-brand' : 'text-gray-600 group-hover:text-gray-900'}`}>{method.label}</span>
                                        </div>
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${paymentMethod === method.id ? 'border-brand bg-brand' : 'border-gray-300'}`}>
                                            {paymentMethod === method.id && <CheckCircle className="h-3 w-3 text-white" />}
                                        </div>
                                    </label>
                                ))}
                            </div>

                            {step === 2 && (
                                <>
                                    <button
                                        onClick={handlePlaceOrder}
                                        disabled={isProcessing || quoteLoading}
                                        className="w-full min-h-[44px] bg-brand text-white rounded-xl font-semibold text-sm hover:bg-brand/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 touch-manipulation"
                                    >
                                        {isProcessing ? 'Processing…' : quoteLoading ? 'Calculating...' : <>Pay <PriceDisplay amountGhs={checkoutQuote?.total ?? cartTotal} forceGhs /></>}
                                    </button>
                                    <p className="mt-2 text-center text-xs text-gray-500">
                                        {publicSettings.free_shipping_threshold_ghs && Number(publicSettings.free_shipping_threshold_ghs) > 0 ? (
                                            <>Free delivery on orders over ₵{publicSettings.free_shipping_threshold_ghs}</>
                                        ) : null}
                                    </p>
                                </>
                            )}
                        </section>
                    </div>

                    {/* Right Column: Order Summary */}
                    <div className="mt-8 lg:mt-0 lg:col-span-5">
                        <div className="sticky top-24">
                            <h3 id="order-summary-heading" className="text-sm font-semibold text-gray-700 mb-4">Order Summary</h3>
                            <div className="flat-card p-6" aria-labelledby="order-summary-heading">
                                <ul role="list" className="divide-y divide-gray-50 mb-6">
                                    {cart.map((item) => {
                                        const mainImage = item.product.gallery_images?.[0] || (Array.isArray(item.product.images) ? item.product.images[0] : item.product.images) || '/placeholder.svg';
                                        return (
                                            <li key={item.id} className="flex py-4 gap-4 group">
                                                <div className="h-20 w-20 rounded-xl bg-gray-50 flex-shrink-0 relative overflow-hidden border border-gray-200/90">
                                                    <img
                                                        src={mainImage}
                                                        alt={item.product.name}
                                                        className="w-full h-full object-contain p-2"
                                                    />
                                                </div>
                                                <div className="flex-1 flex flex-col justify-center">
                                                    <h4 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2">{item.product.name}</h4>
                                                    {(item as { variant?: { variant_type: string; variant_value: string } }).variant && (
                                                        <p className="text-xs text-gray-600 mb-0.5">
                                                            {(item as { variant: { variant_type: string; variant_value: string } }).variant.variant_type.replace(/_/g, ' ')}: {(item as { variant: { variant_value: string } }).variant.variant_value}
                                                        </p>
                                                    )}
                                                    <div className="flex items-center justify-between mt-1">
                                                        <p className="text-xs text-gray-500">Qty {item.quantity}</p>
                                                        <p className="text-sm font-bold text-gray-900"><PriceDisplay amountGhs={cartItemUnitGhs(item) * item.quantity} forceGhs /></p>
                                                    </div>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>

                                <div className="space-y-3 border-t border-gray-100 pt-6">
                                    <div className="flex items-center justify-between">
                                        <dt className="text-sm text-gray-600">Subtotal</dt>
                                        <dd className="text-sm font-semibold text-gray-900"><PriceDisplay amountGhs={checkoutQuote?.subtotal ?? cartTotal} forceGhs /></dd>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <dt className="text-sm text-gray-600">Shipping</dt>
                                        <dd className="text-sm font-semibold text-gray-900">
                                            <PriceDisplay amountGhs={checkoutQuote?.shipping_fee ?? 0} forceGhs />
                                        </dd>
                                    </div>
                                    <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-2">
                                        <dt className="text-sm font-semibold text-gray-900">Total</dt>
                                        <dd className="text-right">
                                            <span className="text-xl font-bold text-gray-900"><PriceDisplay amountGhs={checkoutQuote?.total ?? cartTotal} forceGhs /></span>
                                            <p className="text-xs text-gray-500 mt-0.5 font-medium">Amount charged in GHS</p>
                                        </dd>
                                    </div>
                                </div>

                                <div className="mt-6 p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-3">
                                    <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                                    <p className="text-xs text-gray-600">Secure checkout</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ShopLayout>
    );
}
