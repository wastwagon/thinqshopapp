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
import { trackBeginCheckout, trackPurchase } from '@/lib/analytics';

const CheckoutPaystackTrigger = dynamic(
    () => import('@/components/checkout/CheckoutPaystackTrigger').then((m) => m.default),
    { ssr: false }
);

export default function CheckoutClient() {
    const { cart, cartTotal, clearCart } = useCart();
    const { user } = useAuth();
    const router = useRouter();

    const [step, setStep] = useState(1);
    const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
    const [paymentMethod, setPaymentMethod] = useState('card');
    const [isProcessing, setIsProcessing] = useState(false);
    const [walletBalance, setWalletBalance] = useState<number | null>(null);
    const [paystackOrder, setPaystackOrder] = useState<{ orderId: number; reference: string; amount_pesewas: number } | null>(null);
    const [publicSettings, setPublicSettings] = useState<Record<string, string>>({});

    useEffect(() => {
        if (cart.length > 0) trackBeginCheckout(cartTotal, cart.length);
    }, []);

    useEffect(() => {
        api.get('/content/settings/public').then((res) => setPublicSettings(res.data || {})).catch(() => {});
    }, []);

    useEffect(() => {
        if (!user) return;
        api.get('/finance/wallet').then((res) => setWalletBalance(Number(res.data.balance_ghs ?? 0))).catch(() => {});
    }, [user]);

    const handleAddressSelect = (address: any) => {
        setSelectedAddressId(address.id);
    };

    const handlePlaceOrder = async () => {
        if (!selectedAddressId) {
            toast.error("Please select a shipping address");
            return;
        }
        if (paymentMethod === 'wallet' && walletBalance !== null && walletBalance < cartTotal) {
            toast.error("Insufficient wallet balance. Top up or use another payment method.");
            return;
        }

        setIsProcessing(true);
        try {
            const { data } = await api.post('/orders', {
                total: cartTotal,
                payment_method: paymentMethod,
                shipping_address_id: selectedAddressId,
            });

            if (paymentMethod === 'card' || paymentMethod === 'mobile_money') {
                if (data.paystack_reference && data.amount_pesewas != null) {
                    setPaystackOrder({
                        orderId: data.id,
                        reference: data.paystack_reference,
                        amount_pesewas: data.amount_pesewas,
                    });
                } else {
                    toast.error("Payment setup failed. Try again.");
                }
            } else {
                const orderId = data?.id ?? data?.order_number;
                trackPurchase(String(orderId), cartTotal, 'GHS');
                toast.success("Order placed successfully!");
                clearCart();
                router.push(`/checkout/success?order=${orderId}`);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to place order");
        } finally {
            if (paymentMethod !== 'card' && paymentMethod !== 'mobile_money') setIsProcessing(false);
        }
    };

    const handlePaystackSuccess = async (ref: { reference: string }) => {
        if (!paystackOrder) return;
        try {
            await api.post(`/orders/${paystackOrder.orderId}/confirm-payment`, {
                paystack_reference: ref.reference,
            });
            trackPurchase(String(paystackOrder.orderId), cartTotal, 'GHS');
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
            <div className="max-w-7xl mx-auto px-6 py-12 lg:py-20">
                <header className="mb-12">
                    <h1 className="text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">Secure Checkout</h1>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-100 rounded-full">
                            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                            <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest leading-none">Verified Merchant Flow</p>
                        </div>
                    </div>
                </header>

                <div className="lg:grid lg:grid-cols-12 lg:gap-16 items-start">
                    {/* Left Column: Flow */}
                    <div className="lg:col-span-7 space-y-10">
                        {/* Step 1: Shipping Address */}
                        <section className={`bg-white rounded-[2.5rem] p-8 lg:p-10 border transition-all duration-500 ${step === 1 ? 'border-blue-200 shadow-2xl shadow-blue-100/20 ring-4 ring-blue-50/50' : 'border-gray-100 opacity-60'}`}>
                            <div className="flex justify-between items-center mb-10">
                                <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-gray-400 flex items-center">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-4 ${step === 1 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                        <Truck className="h-4 w-4" />
                                    </div>
                                    01. Shipping Destination
                                </h2>
                                {step > 1 && (
                                    <button onClick={() => setStep(1)} className="text-[10px] font-bold text-blue-600 uppercase tracking-widest hover:underline">Edit</button>
                                )}
                            </div>

                            <AddressBook onSelect={handleAddressSelect} selectedId={selectedAddressId || undefined} />

                            {selectedAddressId && step === 1 && (
                                <div className="mt-12 flex justify-end">
                                    <button
                                        onClick={() => setStep(2)}
                                        className="bg-gray-900 text-white px-10 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-gray-200 flex items-center gap-3"
                                    >
                                        Proceed to Payment
                                        <CheckCircle className="h-4 w-4" />
                                    </button>
                                </div>
                            )}
                        </section>

                        {/* Step 2: Payment Method */}
                        <section className={`bg-white rounded-[2.5rem] p-8 lg:p-10 border transition-all duration-500 ${step === 2 ? 'border-blue-200 shadow-2xl shadow-blue-100/20 ring-4 ring-blue-50/50' : 'border-gray-100'} ${step < 2 ? 'opacity-40 pointer-events-none grayscale' : ''}`}>
                            <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-gray-400 flex items-center mb-10">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-4 ${step === 2 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                    <CreditCard className="h-4 w-4" />
                                </div>
                                02. Transaction Method
                            </h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
                                {[
                                    { id: 'card', label: 'Credit / Debit Card', icon: '💳' },
                                    { id: 'mobile_money', label: 'Mobile Money', icon: '📱' },
                                    { id: 'wallet', label: walletBalance !== null ? `ThinQ Wallet (₵${walletBalance.toFixed(2)})` : 'ThinQ Wallet', icon: '💰' },
                                    { id: 'cod', label: 'Cash on Transit', icon: '🚚' }
                                ].map((method) => (
                                    <label key={method.id} className={`flex items-center justify-between p-6 rounded-2xl border-2 transition-all cursor-pointer group ${paymentMethod === method.id ? 'bg-blue-50 border-blue-600 shadow-lg shadow-blue-100/50' : 'bg-gray-50 border-gray-100 hover:border-gray-200'}`}>
                                        <div className="flex items-center gap-4">
                                            <input
                                                id={method.id}
                                                name="payment_method"
                                                type="radio"
                                                checked={paymentMethod === method.id}
                                                onChange={() => setPaymentMethod(method.id)}
                                                className="hidden"
                                            />
                                            <span className="text-xl">{method.icon}</span>
                                            <span className={`text-xs font-bold uppercase tracking-wider ${paymentMethod === method.id ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-900'}`}>{method.label}</span>
                                        </div>
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${paymentMethod === method.id ? 'border-blue-600 bg-blue-600' : 'border-gray-300'}`}>
                                            {paymentMethod === method.id && <CheckCircle className="h-3 w-3 text-white" />}
                                        </div>
                                    </label>
                                ))}
                            </div>

                            {step === 2 && (
                                <>
                                    <button
                                        onClick={handlePlaceOrder}
                                        disabled={isProcessing}
                                        className="w-full min-h-[48px] sm:h-14 bg-blue-600 text-white rounded-2xl font-extrabold text-sm uppercase tracking-wider hover:bg-gray-900 transition-all disabled:opacity-50 flex items-center justify-center gap-4 shadow-2xl shadow-blue-200 touch-manipulation"
                                    >
                                        {isProcessing ? 'Processing…' : `Pay ₵${cartTotal.toFixed(2)}`}
                                    </button>
                                    <p className="mt-3 text-center text-xs text-gray-500">
                                        Secure payment with Paystack
                                        {publicSettings.free_shipping_threshold_ghs && Number(publicSettings.free_shipping_threshold_ghs) > 0 && (
                                            <> · Free delivery on orders over ₵{publicSettings.free_shipping_threshold_ghs}</>
                                        )}
                                    </p>
                                </>
                            )}
                        </section>
                    </div>

                    {/* Right Column: Order Summary */}
                    <div className="mt-16 lg:mt-0 lg:col-span-5">
                        <div className="sticky top-32">
                            <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-gray-400 mb-8 ml-4">Order Composition</h3>
                            <div className="bg-white rounded-[2.5rem] p-8 lg:p-10 border border-gray-100 shadow-xl shadow-gray-200/50">
                                <ul role="list" className="divide-y divide-gray-50 mb-10">
                                    {cart.map((item) => {
                                        const mainImage = item.product.gallery_images?.[0] || (Array.isArray(item.product.images) ? item.product.images[0] : item.product.images) || '/placeholder.svg';
                                        return (
                                            <li key={item.id} className="flex py-6 gap-6 group">
                                                <div className="h-24 w-24 rounded-2xl bg-gray-50 flex-shrink-0 relative overflow-hidden border border-gray-100 group-hover:scale-105 transition-transform duration-500">
                                                    <img
                                                        src={mainImage}
                                                        alt={item.product.name}
                                                        className="w-full h-full object-contain p-4"
                                                    />
                                                </div>
                                                <div className="flex-1 flex flex-col justify-center">
                                                    <h4 className="text-sm font-bold text-gray-900 mb-1 line-clamp-2">{item.product.name}</h4>
                                                    <div className="flex items-center justify-between mt-2">
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Qty {item.quantity}</p>
                                                        <p className="text-sm font-extrabold text-gray-900 tracking-tight">₵{Number(item.product.price).toFixed(2)}</p>
                                                    </div>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>

                                <div className="space-y-4 border-t border-gray-50 pt-10">
                                    <div className="flex items-center justify-between">
                                        <dt className="text-xs font-bold text-gray-400 uppercase tracking-widest">Merchandise Vol.</dt>
                                        <dd className="text-sm font-extrabold text-gray-900">₵{cartTotal.toFixed(2)}</dd>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <dt className="text-xs font-bold text-gray-400 uppercase tracking-widest">Procurement Fee</dt>
                                        <dd className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest">Calculated Next</dd>
                                    </div>
                                    <div className="flex items-center justify-between border-t border-gray-100 pt-8 mt-4">
                                        <dt className="text-sm font-extrabold text-gray-900 uppercase tracking-[0.1em]">Estimated Total</dt>
                                        <dd className="text-3xl font-black text-gray-900 tracking-tighter">₵{cartTotal.toFixed(2)}</dd>
                                    </div>
                                </div>

                                <div className="mt-10 p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-gray-200 shadow-sm">
                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                    </div>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-relaxed">
                                        End-to-end encrypted <br /> checkout sequence.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ShopLayout>
    );
}
