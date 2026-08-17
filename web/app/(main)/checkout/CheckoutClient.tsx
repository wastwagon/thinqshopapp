'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import AddressBook from '@/components/ui/AddressBook';
import GuestShippingForm, { type GuestShippingFormData } from '@/components/shop/GuestShippingForm';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import { CreditCard, Truck, CheckCircle, Wallet, Shield } from 'lucide-react';
import ShopLayout from '@/components/layout/ShopLayout';
import PageHeader from '@/components/ui/PageHeader';
import ShopContent from '@/components/shop/ShopContent';
import CheckoutProgress from '@/components/shop/CheckoutProgress';
import ShopTrustRow from '@/components/shop/ShopTrustRow';
import { ShopLoadingState } from '@/components/shop/ShopSuccessShell';
import PriceDisplay from '@/components/ui/PriceDisplay';
import { trackBeginCheckout, trackPurchase } from '@/lib/analytics';
import { cartItemPricing } from '@/lib/product-utils';
import { getMediaUrl } from '@/lib/media';
import LiveRegion from '@/components/ui/LiveRegion';
import { roundGhs } from '@/lib/money';
import Button from '@/components/ui/Button';

const PaystackTrigger = dynamic(
    () => import('@/components/payments/PaystackTrigger').then((m) => m.default),
    { ssr: false }
);

function cartAsCheckoutItems(cart: { product_id: number; quantity: number; variant_id?: number | null }[]) {
    return cart.map((item) => ({
        productId: item.product_id,
        quantity: item.quantity,
        ...(item.variant_id != null ? { variantId: item.variant_id } : {}),
    }));
}

export default function CheckoutClient() {
    const { cart, cartTotal, clearCart, loading: cartLoading } = useCart();
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const [step, setStep] = useState(1);
    const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
    const [guestShipping, setGuestShipping] = useState<GuestShippingFormData | null>(null);
    const [paymentMethod, setPaymentMethod] = useState('paystack');
    const [isProcessing, setIsProcessing] = useState(false);
    const [walletBalance, setWalletBalance] = useState<number | null>(null);
    const [paystackOrder, setPaystackOrder] = useState<{
        orderId: number;
        reference: string;
        amount_pesewas: number;
        total_ghs: number;
        guestToken?: string;
    } | null>(null);
    const [publicSettings, setPublicSettings] = useState<Record<string, string>>({});
    const [checkoutQuote, setCheckoutQuote] = useState<{ subtotal: number; shipping_fee: number; total: number } | null>(null);
    const [quoteLoading, setQuoteLoading] = useState(false);
    const orderPlacedRef = useRef(false);

    useEffect(() => {
        if (cart.length > 0) trackBeginCheckout(cartTotal, cart.length);
    }, []);

    useEffect(() => {
        if (authLoading || cartLoading) return;
        if (cart.length === 0 && !orderPlacedRef.current) {
            router.replace('/cart');
        }
    }, [authLoading, cartLoading, cart.length, router]);

    useEffect(() => {
        if (user) setPaymentMethod('wallet');
        else setPaymentMethod('paystack');
    }, [user]);

    useEffect(() => {
        api.get('/content/settings/public').then((res) => setPublicSettings(res.data || {})).catch(() => {});
    }, []);

    useEffect(() => {
        if (!user) {
            setWalletBalance(null);
            return;
        }
        api.get('/finance/wallet').then((res) => setWalletBalance(Number(res.data.balance_ghs ?? 0))).catch(() => {});
    }, [user]);

    useEffect(() => {
        if (cart.length === 0) {
            setCheckoutQuote(null);
            return;
        }
        if (user && !selectedAddressId) {
            setCheckoutQuote(null);
            return;
        }
        setQuoteLoading(true);
        const payload = user
            ? { shipping_address_id: selectedAddressId }
            : { items: cartAsCheckoutItems(cart) };
        api.post('/orders/quote/checkout', payload)
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
    }, [selectedAddressId, user, cart, cartTotal]);

    const handleAddressSelect = (address: { id: number }) => {
        setSelectedAddressId(address.id);
    };

    const handleGuestShipping = (data: GuestShippingFormData) => {
        setGuestShipping(data);
        setStep(2);
    };

    const shippingReady = user ? !!selectedAddressId : !!guestShipping;

    const handlePlaceOrder = async () => {
        if (user && !selectedAddressId) {
            toast.error('Please select a shipping address');
            return;
        }
        if (!user && !guestShipping) {
            toast.error('Please enter your shipping details');
            return;
        }
        const payableTotal = checkoutQuote?.total ?? cartTotal;
        if (paymentMethod === 'wallet' && walletBalance !== null && walletBalance < payableTotal) {
            toast.error('Insufficient wallet balance. Top up or use another payment method.');
            return;
        }

        setIsProcessing(true);
        try {
            const body = user
                ? {
                      total: payableTotal,
                      payment_method: paymentMethod === 'paystack' ? 'card' : paymentMethod,
                      shipping_address_id: selectedAddressId,
                  }
                : {
                      total: payableTotal,
                      payment_method: 'card',
                      guest_email: guestShipping!.guest_email,
                      shipping_address: {
                          full_name: guestShipping!.full_name,
                          phone: guestShipping!.phone,
                          street: guestShipping!.street,
                          city: guestShipping!.city,
                          region: guestShipping!.region,
                          landmark: guestShipping!.landmark,
                      },
                      items: cartAsCheckoutItems(cart),
                  };
            const { data } = await api.post('/orders', body);

            if (paymentMethod === 'paystack') {
                if (data.paystack_reference && data.amount_pesewas != null) {
                    setPaystackOrder({
                        orderId: data.id,
                        reference: data.paystack_reference,
                        amount_pesewas: data.amount_pesewas,
                        total_ghs: Number(data.total ?? payableTotal),
                        guestToken: data.guest_token,
                    });
                } else {
                    toast.error('Payment setup failed. Try again.');
                }
            } else {
                const orderId = data?.id ?? data?.order_number;
                trackPurchase(String(orderId), payableTotal, 'GHS');
                orderPlacedRef.current = true;
                const tokenQs = data.guest_token ? `&token=${encodeURIComponent(data.guest_token)}` : '';
                router.replace(`/checkout/success?order=${orderId}${tokenQs}`);
                clearCart();
            }
        } catch (error: unknown) {
            const ax = error as { response?: { data?: { message?: string } } };
            toast.error(ax.response?.data?.message || 'Failed to place order');
        } finally {
            if (paymentMethod !== 'paystack') setIsProcessing(false);
        }
    };

    const handlePaystackSuccess = async (ref: { reference: string }) => {
        if (!paystackOrder) return;
        try {
            await api.post(`/orders/${paystackOrder.orderId}/confirm-payment`, {
                paystack_reference: ref.reference,
                ...(paystackOrder.guestToken ? { guest_token: paystackOrder.guestToken } : {}),
            });
            trackPurchase(String(paystackOrder.orderId), paystackOrder.total_ghs, 'GHS');
            orderPlacedRef.current = true;
            const tokenQs = paystackOrder.guestToken
                ? `&token=${encodeURIComponent(paystackOrder.guestToken)}`
                : '';
            router.replace(`/checkout/success?order=${paystackOrder.orderId}${tokenQs}`);
            clearCart();
        } catch (err: unknown) {
            const ax = err as { response?: { data?: { message?: string } } };
            toast.error(ax.response?.data?.message || 'Payment confirmation failed');
        } finally {
            setPaystackOrder(null);
            setIsProcessing(false);
        }
    };

    const handlePaystackClose = () => {
        setPaystackOrder(null);
        setIsProcessing(false);
        toast.error('Payment cancelled.');
    };

    const payableTotal = checkoutQuote?.total ?? cartTotal;
    const liveTotalMessage =
        quoteLoading
            ? 'Calculating shipping and total.'
            : checkoutQuote
              ? `Order total updated. ${roundGhs(payableTotal).toFixed(2)} Ghana cedis.`
              : '';

    if (authLoading || cartLoading || cart.length === 0) {
        return (
            <ShopLayout>
                <ShopLoadingState message="Loading checkout…" />
            </ShopLayout>
        );
    }

    const paystackEmail = user?.email || guestShipping?.guest_email;
    const paymentOptions = user
        ? [
              { id: 'wallet', label: walletBalance !== null ? `Wallet Balance (₵${walletBalance.toFixed(2)})` : 'Wallet Balance', Icon: Wallet },
              { id: 'paystack', label: 'Secure payment on Paystack', Icon: Shield },
          ]
        : [{ id: 'paystack', label: 'Secure payment on Paystack', Icon: Shield }];

    return (
        <ShopLayout>
            {paystackOrder && (
                <PaystackTrigger
                    config={{ reference: paystackOrder.reference, amount: paystackOrder.amount_pesewas }}
                    userEmail={paystackEmail}
                    onSuccess={handlePaystackSuccess}
                    onClose={handlePaystackClose}
                />
            )}
            <div className="bg-white min-h-full pb-8">
            <ShopContent wide className="py-6 lg:py-8">
                <PageHeader
                    title="Checkout"
                    subtitle={user ? 'Complete your purchase' : 'Checkout as guest — sign in is optional'}
                    breadcrumbs={[{ label: 'Cart', href: '/cart' }, { label: 'Checkout' }]}
                />
                {!user && (
                    <p className="mb-4 text-sm text-gray-600">
                        Checking out as a guest.{' '}
                        <Link href="/login?from=/checkout" className="font-medium text-blue-600 hover:underline">
                            Sign in
                        </Link>{' '}
                        for saved addresses and wallet.
                    </p>
                )}
                <CheckoutProgress step={step as 1 | 2} />
                <ShopTrustRow compact />
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
                            className={`rounded-2xl bg-white border p-6 transition-all shadow-[0_4px_24px_-12px_rgba(0,0,0,0.06)] ${step === 1 ? 'border-blue-200 ring-1 ring-blue-100' : 'border-gray-100 opacity-70'}`}
                            aria-labelledby="checkout-shipping-heading"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 id="checkout-shipping-heading" className="text-sm font-semibold text-gray-700 flex items-center" aria-current={step === 1 ? 'step' : undefined}>
                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center mr-3 ${step === 1 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                        <Truck className="h-3.5 w-3.5" />
                                    </div>
                                    Shipping Address
                                </h2>
                                {step > 1 && (
                                    <button onClick={() => setStep(1)} className="text-xs font-medium text-blue-600 hover:underline">Edit</button>
                                )}
                            </div>

                            {user ? (
                                <AddressBook onSelect={handleAddressSelect} selectedId={selectedAddressId || undefined} />
                            ) : step === 1 ? (
                                <GuestShippingForm defaultValues={guestShipping ?? undefined} onSubmit={handleGuestShipping} />
                            ) : guestShipping ? (
                                <p className="text-sm text-gray-600">
                                    {guestShipping.full_name} · {guestShipping.phone}
                                    <br />
                                    {guestShipping.street}, {guestShipping.city}, {guestShipping.region}
                                    <br />
                                    {guestShipping.guest_email}
                                </p>
                            ) : null}

                            {user && selectedAddressId && step === 1 && (
                                <div className="mt-6 flex justify-end">
                                    <Button
                                        onClick={() => setStep(2)}
                                        variant="primary"
                                        rightIcon={<CheckCircle className="h-4 w-4" />}
                                    >
                                        Proceed to Payment
                                    </Button>
                                </div>
                            )}
                        </section>

                        {/* Step 2: Payment Method */}
                        <section
                            className={`rounded-2xl bg-white border p-6 transition-all shadow-[0_4px_24px_-12px_rgba(0,0,0,0.06)] ${step === 2 ? 'border-blue-200 ring-1 ring-blue-100' : 'border-gray-100'} ${step < 2 ? 'opacity-40 pointer-events-none' : ''}`}
                            aria-labelledby="checkout-payment-heading"
                        >
                            <h2 id="checkout-payment-heading" className="text-sm font-semibold text-gray-700 flex items-center mb-6" aria-current={step === 2 ? 'step' : undefined}>
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center mr-3 ${step === 2 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                    <CreditCard className="h-3.5 w-3.5" />
                                </div>
                                Payment Method
                            </h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6" role="radiogroup" aria-label="Payment method">
                                {paymentOptions.map((method) => (
                                    <label key={method.id} htmlFor={`payment-${method.id}`} className={`flex items-center justify-between p-4 rounded-xl border-2 transition-colors cursor-pointer group min-h-[44px] touch-manipulation ${paymentMethod === method.id ? 'bg-blue-50 border-blue-500' : 'bg-gray-50 border-gray-200/90 hover:border-gray-300'}`}>
                                        <div className="flex items-center gap-3">
                                            <input
                                                id={`payment-${method.id}`}
                                                name="payment_method"
                                                type="radio"
                                                checked={paymentMethod === method.id}
                                                onChange={() => setPaymentMethod(method.id)}
                                                className="sr-only"
                                            />
                                            <method.Icon className="h-5 w-5 text-gray-500 shrink-0" aria-hidden />
                                            <span className={`text-sm font-medium ${paymentMethod === method.id ? 'text-blue-700' : 'text-gray-600 group-hover:text-gray-900'}`}>{method.label}</span>
                                        </div>
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${paymentMethod === method.id ? 'border-blue-600 bg-blue-600' : 'border-gray-300'}`}>
                                            {paymentMethod === method.id && <CheckCircle className="h-3 w-3 text-white" />}
                                        </div>
                                    </label>
                                ))}
                            </div>

                            {step === 2 && (
                                <>
                                    <Button
                                        onClick={handlePlaceOrder}
                                        disabled={isProcessing || quoteLoading || !shippingReady}
                                        variant="primary"
                                        size="lg"
                                        className="w-full"
                                        loading={isProcessing || quoteLoading}
                                    >
                                        {isProcessing ? 'Processing…' : quoteLoading ? 'Calculating...' : <>Pay <PriceDisplay amountGhs={checkoutQuote?.total ?? cartTotal} forceGhs /></>}
                                    </Button>
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
                            <div className="rounded-2xl bg-gradient-to-br from-blue-950 via-[#02274f] to-blue-900 p-6 text-white shadow-[0_12px_40px_-12px_rgba(2,39,79,0.45)]" aria-labelledby="order-summary-heading">
                                <h3 id="order-summary-heading" className="text-xs font-medium text-blue-100/90 mb-4">Order Summary</h3>
                                <ul role="list" className="divide-y divide-white/10 mb-6">
                                    {cart.map((item) => {
                                        const rawImg =
                                            item.product.gallery_images?.[0] ||
                                            (Array.isArray(item.product.images) ? item.product.images[0] : item.product.images) ||
                                            '';
                                        const mainImage = rawImg ? getMediaUrl(String(rawImg)) : '/placeholder.svg';
                                        const pricing = cartItemPricing(item);
                                        return (
                                            <li key={item.id} className="flex py-4 gap-4 group">
                                                <div className="h-20 w-20 rounded-xl bg-white/10 flex-shrink-0 relative overflow-hidden border border-white/15">
                                                    <img
                                                        src={mainImage}
                                                        alt={item.product.name}
                                                        className="w-full h-full object-contain p-2"
                                                    />
                                                </div>
                                                <div className="flex-1 flex flex-col justify-center">
                                                    <h4 className="text-sm font-semibold text-white mb-1 line-clamp-2">{item.product.name}</h4>
                                                    {(item as { variant?: { variant_type: string; variant_value: string } }).variant && (
                                                        <p className="text-xs text-blue-100/70 mb-0.5">
                                                            {(item as { variant: { variant_type: string; variant_value: string } }).variant.variant_type.replace(/_/g, ' ')}: {(item as { variant: { variant_value: string } }).variant.variant_value}
                                                        </p>
                                                    )}
                                                    <div className="flex items-center justify-between mt-1">
                                                        <p className="text-xs text-blue-100/60">Qty {item.quantity}</p>
                                                        <p className="text-sm font-bold text-white"><PriceDisplay amountGhs={pricing.lineTotal} forceGhs /></p>
                                                    </div>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>

                                <div className="space-y-3 border-t border-white/15 pt-6">
                                    <div className="flex items-center justify-between">
                                        <dt className="text-sm text-blue-100/80">Subtotal</dt>
                                        <dd className="text-sm font-semibold text-white"><PriceDisplay amountGhs={checkoutQuote?.subtotal ?? cartTotal} forceGhs /></dd>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <dt className="text-sm text-blue-100/80">Shipping</dt>
                                        <dd className="text-sm font-semibold text-white">
                                            <PriceDisplay amountGhs={checkoutQuote?.shipping_fee ?? 0} forceGhs />
                                        </dd>
                                    </div>
                                    <div className="flex items-center justify-between border-t border-white/15 pt-4 mt-2">
                                        <dt className="text-sm font-semibold text-white">Total</dt>
                                        <dd className="text-right">
                                            <span className="text-xl font-bold text-white"><PriceDisplay amountGhs={checkoutQuote?.total ?? cartTotal} forceGhs /></span>
                                            <p className="text-xs text-blue-100/70 mt-0.5 font-medium">Amount charged in GHS</p>
                                        </dd>
                                    </div>
                                </div>

                                <div className="mt-6 p-3 bg-white/10 rounded-xl border border-white/15 flex items-center gap-3">
                                    <CheckCircle className="h-5 w-5 text-emerald-300 shrink-0" />
                                    <p className="text-xs text-blue-100/90">Secure checkout · Paystack protected</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </ShopContent>
            </div>
        </ShopLayout>
    );
}
