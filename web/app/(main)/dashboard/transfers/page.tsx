'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { ArrowRight, Send, AlertCircle, Plus, CreditCard, Wallet, Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import dynamic from 'next/dynamic';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

const PaystackTrigger = dynamic(
    () => import('@/components/transfers/PaystackTrigger').then((m) => m.default),
    { ssr: false }
);

export default function TransferPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [rate, setRate] = useState<number>(0);
    const [transferDirection, setTransferDirection] = useState('send_to_china');
    const [purpose, setPurpose] = useState('Personal');
    const [amountGhs, setAmountGhs] = useState('');
    const [amountCny, setAmountCny] = useState(0);
    const [recipientType, setRecipientType] = useState('alipay');
    const [recipientName, setRecipientName] = useState('');
    const [recipientId, setRecipientId] = useState('');
    const [bankName, setBankName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'card'>('wallet');
    const [isSubmitting, setIsSubmitting] = useState(false);

    type QrEntry = { id: string; dataUrl: string; amount: string; recipientName: string };
    const [qrEntries, setQrEntries] = useState<QrEntry[]>([{ id: crypto.randomUUID(), dataUrl: '', amount: '', recipientName: '' }]);

    const [paystackConfig, setPaystackConfig] = useState<{ reference: string; amount: number; transferId: number } | null>(null);

    const addQrEntry = () => setQrEntries((prev) => [...prev, { id: crypto.randomUUID(), dataUrl: '', amount: '', recipientName: '' }]);
    const removeQrEntry = (id: string) => setQrEntries((prev) => (prev.length > 1 ? prev.filter((e) => e.id !== id) : prev));
    const setQrEntryImage = (id: string, dataUrl: string) =>
        setQrEntries((prev) => prev.map((e) => (e.id === id ? { ...e, dataUrl } : e)));
    const setQrEntryAmount = (id: string, amount: string) =>
        setQrEntries((prev) => prev.map((e) => (e.id === id ? { ...e, amount } : e)));
    const setQrEntryRecipientName = (id: string, recipientName: string) =>
        setQrEntries((prev) => prev.map((e) => (e.id === id ? { ...e, recipientName } : e)));

    const handleQrFileChange = (id: string, file: File | null) => {
        if (!file || !file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = () => setQrEntryImage(id, reader.result as string);
        reader.readAsDataURL(file);
    };

    useEffect(() => {
        const fetchRate = async () => {
            try {
                const { data } = await api.get('/finance/transfers/rate');
                setRate(data.rate_ghs_to_cny);
            } catch (error) {
                console.error("Failed to load transfer rate", error);
            }
        };
        fetchRate();
    }, []);

    useEffect(() => {
        const ghs = Number(amountGhs);
        if (!isNaN(ghs)) {
            setAmountCny(ghs * rate);
        } else {
            setAmountCny(0);
        }
    }, [amountGhs, rate]);

    const handlePaystackSuccess = async (ref: { reference: string }) => {
        if (!paystackConfig) return;
        try {
            await api.post(`/finance/transfers/${paystackConfig.transferId}/confirm-payment`, {
                paystack_reference: ref.reference
            });
            setPaystackConfig(null);
            setAmountGhs('');
            setRecipientName('');
            setRecipientId('');
            setQrEntries([{ id: crypto.randomUUID(), dataUrl: '', amount: '', recipientName: '' }]);
            router.push(`/dashboard/transfers/success?id=${paystackConfig.transferId}`);
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Payment confirmation failed.");
        } finally {
            setIsSubmitting(false);
        }
    };
    const handlePaystackClose = () => {
        setPaystackConfig(null);
        setIsSubmitting(false);
        toast.error("Payment cancelled.");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amountGhs || Number(amountGhs) <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }
        if (recipientType === 'bank_account' && (!bankName || !accountNumber)) {
            toast.error("Please enter bank details");
            return;
        }

        const mainAmount = Number(amountGhs);
        const filledQr = qrEntries.filter((e) => e.dataUrl.trim() && e.amount.trim() && e.recipientName.trim());

        if (recipientType !== 'bank_account') {
            if (filledQr.length === 0) {
                toast.error("Add at least one QR code with image, recipient name and amount.");
                return;
            }
            const partialRow = qrEntries.some((e) => {
                const hasSome = !!(e.dataUrl.trim() || e.amount.trim() || e.recipientName.trim());
                const hasAll = !!(e.dataUrl.trim() && e.amount.trim() && e.recipientName.trim());
                return hasSome && !hasAll;
            });
            if (partialRow) {
                toast.error("Each QR row must have image, recipient name and amount together.");
                return;
            }
            const sumQr = filledQr.reduce((s, e) => s + (Number(e.amount) || 0), 0);
            const targetAmount = amountCny;
            if (Math.abs(sumQr - targetAmount) > 0.01) {
                toast.error(`Total of QR amounts (¥${sumQr.toFixed(2)}) must equal converted amount (¥${targetAmount.toFixed(2)}). Recipients receive CNY.`);
                return;
            }
        }

        const qr_codes =
            recipientType !== 'bank_account' && filledQr.length > 0
                ? filledQr.map((e) => ({ image: e.dataUrl, amount_cny: Number(e.amount), recipient_name: e.recipientName.trim() }))
                : [];

        const firstQrRecipient = filledQr[0]?.recipientName?.trim() || '';

        const payload = {
            amount_ghs: mainAmount,
            transfer_direction: transferDirection,
            recipient_type: recipientType,
            recipient_details: {
                name: recipientType === 'bank_account' ? recipientName : firstQrRecipient,
                phone: recipientType === 'bank_account' ? recipientId : '',
                account_number: accountNumber,
                bank_name: bankName
            },
            payment_method: paymentMethod === 'wallet' ? 'wallet' : 'card',
            purpose: purpose,
            qr_codes
        };

        setIsSubmitting(true);
        try {
            const { data } = await api.post('/finance/transfers', payload);

            if (paymentMethod === 'wallet') {
                setAmountGhs('');
                setRecipientName('');
                setQrEntries([{ id: crypto.randomUUID(), dataUrl: '', amount: '', recipientName: '' }]);
                setRecipientId('');
                router.push(`/dashboard/transfers/success?id=${data.id}`);
            } else if (data.paystack_reference) {
                setPaystackConfig({
                    reference: data.paystack_reference,
                    amount: Math.round(Number(data.total_amount) * 100),
                    transferId: data.id
                });
                // PaystackTrigger will open popup when paystackConfig is set
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Transfer failed.");
        } finally {
            if (paymentMethod === 'wallet') setIsSubmitting(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="pb-20 md:pb-10">
            {paystackConfig && (
                <PaystackTrigger
                    config={paystackConfig}
                    onSuccess={handlePaystackSuccess}
                    onClose={handlePaystackClose}
                    userEmail={user?.email}
                />
            )}
            <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div className="flex items-center gap-3">
                    <Send className="h-8 w-8 text-blue-600" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight leading-tight">Transfers</h1>
                        <p className="text-xs text-blue-600 flex items-center gap-1.5 mt-0.5">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                            Rate: 1 GHS = {rate.toFixed(4)} CNY
                        </p>
                    </div>
                </div>
                <p className="text-gray-500 text-sm max-w-sm md:text-right">Send to Alipay, WeChat Pay, or Chinese bank accounts.</p>
            </div>

            <div className="max-w-2xl">
                {/* Transfer Form */}
                <div className="space-y-4">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 lg:p-5">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Direction Selection */}
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setTransferDirection('send_to_china')}
                                    className={`relative py-2.5 px-3 rounded-lg border-2 transition-all text-left ${transferDirection === 'send_to_china' ? 'border-blue-600 bg-blue-50' : 'border-gray-100 bg-gray-50 hover:border-gray-200'}`}
                                >
                                    <p className={`text-[10px] font-semibold  mb-0.5 ${transferDirection === 'send_to_china' ? 'text-blue-600' : 'text-gray-400'}`}>Send</p>
                                    <p className="text-xs font-bold text-gray-900">GHS → CNY</p>
                                    {transferDirection === 'send_to_china' && <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-blue-600 rounded-full" />}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTransferDirection('receive_from_china')}
                                    className={`relative py-2.5 px-3 rounded-lg border-2 transition-all text-left ${transferDirection === 'receive_from_china' ? 'border-blue-600 bg-blue-50' : 'border-gray-100 bg-gray-50 hover:border-gray-200'}`}
                                >
                                    <p className={`text-[10px] font-semibold  mb-0.5 ${transferDirection === 'receive_from_china' ? 'text-blue-600' : 'text-gray-400'}`}>Receive</p>
                                    <p className="text-xs font-bold text-gray-900">CNY → GHS</p>
                                    {transferDirection === 'receive_from_china' && <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-blue-600 rounded-full" />}
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-medium text-gray-500  ml-1 mb-1 block">Amount (GHS)</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <span className="text-gray-700 font-medium text-sm">₵</span>
                                        </div>
                                        <input
                                            type="number"
                                            value={amountGhs}
                                            onChange={(e) => setAmountGhs(e.target.value)}
                                            className="block w-full pl-7 pr-3 py-2.5 bg-gray-50 border border-gray-100 rounded-lg text-sm font-semibold text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-medium text-gray-500  ml-1 mb-1 block">Amount (CNY)</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <span className="text-gray-400 font-medium text-sm">¥</span>
                                        </div>
                                        <input
                                            type="text"
                                            value={amountCny.toFixed(2)}
                                            readOnly
                                            className="block w-full pl-7 pr-3 py-2.5 bg-gray-100 border border-gray-100 rounded-lg text-sm font-semibold text-gray-500 outline-none cursor-not-allowed"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-medium text-gray-500  ml-1 block">Payment</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod('wallet')}
                                        className={`flex items-center gap-2 py-2.5 px-3 rounded-lg border-2 transition-all text-left ${paymentMethod === 'wallet' ? 'border-blue-600 bg-blue-50' : 'border-gray-100 bg-gray-50 hover:border-gray-200'}`}
                                    >
                                        <Wallet className={`h-5 w-5 shrink-0 ${paymentMethod === 'wallet' ? 'text-blue-600' : 'text-gray-400'}`} />
                                        <div className="min-w-0">
                                            <p className={`text-xs font-semibold ${paymentMethod === 'wallet' ? 'text-blue-600' : 'text-gray-700'}`}>Wallet</p>
                                            <p className="text-[9px] text-gray-500 truncate">Use balance</p>
                                        </div>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod('card')}
                                        className={`flex items-center gap-2 py-2.5 px-3 rounded-lg border-2 transition-all text-left ${paymentMethod === 'card' ? 'border-blue-600 bg-blue-50' : 'border-gray-100 bg-gray-50 hover:border-gray-200'}`}
                                    >
                                        <CreditCard className={`h-5 w-5 shrink-0 ${paymentMethod === 'card' ? 'text-blue-600' : 'text-gray-400'}`} />
                                        <div className="min-w-0">
                                            <p className={`text-xs font-semibold ${paymentMethod === 'card' ? 'text-blue-600' : 'text-gray-700'}`}>Paystack</p>
                                            <p className="text-[9px] text-gray-500 truncate">Card / mobile money</p>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-medium text-gray-500  ml-1 block">Recipient type</label>
                                <div className="flex flex-wrap gap-1.5">
                                    {['alipay', 'wechat_pay', 'bank_account'].map((type) => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => setRecipientType(type)}
                                            className={`px-3 py-2 rounded-lg border-2 font-semibold text-[10px]  transition-all ${recipientType === type ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200'}`}
                                        >
                                            {type.replace('_', ' ')}
                                        </button>
                                    ))}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                                    {recipientType === 'bank_account' ? (
                                        <>
                                            <div>
                                                <label className="text-[10px] font-medium text-gray-500  ml-1 mb-1 block">Recipient name</label>
                                                <input
                                                    type="text"
                                                    value={recipientName}
                                                    onChange={(e) => setRecipientName(e.target.value)}
                                                    className="block w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-lg text-sm font-medium text-gray-900 focus:bg-white outline-none"
                                                    placeholder="Full legal name"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-medium text-gray-500  ml-1 mb-1 block">Bank name</label>
                                                <input
                                                    type="text"
                                                    value={bankName}
                                                    onChange={(e) => setBankName(e.target.value)}
                                                    className="block w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-lg text-sm font-medium text-gray-900 focus:bg-white outline-none"
                                                    placeholder="e.g. ICBC, Bank of China"
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="text-[10px] font-medium text-gray-500  ml-1 mb-1 block">Account number</label>
                                                <input
                                                    type="text"
                                                    value={accountNumber}
                                                    onChange={(e) => setAccountNumber(e.target.value)}
                                                    className="block w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-lg text-sm font-medium text-gray-900 focus:bg-white outline-none"
                                                    placeholder="UnionPay/card number"
                                                />
                                            </div>
                                        </>
                                    ) : (
                                        <div className="md:col-span-2 space-y-3">
                                            <div>
                                                <label className="text-[10px] font-medium text-gray-500  ml-1 mb-1 block">QR codes & amounts</label>
                                                <p className="text-[10px] text-gray-500 mb-2 ml-1">Add at least one QR: upload image, recipient name and amount (CNY). Total must equal converted amount above.</p>
                                                <div className="space-y-3">
                                                    {qrEntries.map((entry) => (
                                                        <div key={entry.id} className="flex flex-wrap items-start gap-2 p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                                                            <div className="flex items-center gap-2 shrink-0">
                                                                <label className="cursor-pointer flex items-center gap-1.5 px-2.5 py-2 bg-white border border-gray-200 rounded-lg text-[10px] font-medium text-gray-700 hover:bg-gray-50">
                                                                    <Upload className="h-3.5 w-3.5" /> Upload QR
                                                                    <input
                                                                        type="file"
                                                                        accept="image/*"
                                                                        className="sr-only"
                                                                        onChange={(e) => handleQrFileChange(entry.id, e.target.files?.[0] ?? null)}
                                                                    />
                                                                </label>
                                                                {entry.dataUrl && (
                                                                    <div className="w-10 h-10 rounded border border-gray-200 overflow-hidden bg-white shrink-0">
                                                                        <img src={entry.dataUrl} alt="QR" className="w-full h-full object-contain" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-[120px]">
                                                                <input
                                                                    type="text"
                                                                    value={entry.recipientName}
                                                                    onChange={(e) => setQrEntryRecipientName(entry.id, e.target.value)}
                                                                    placeholder="Recipient / supplier name"
                                                                    className="block w-full px-3 py-2 bg-white border border-gray-100 rounded-lg text-sm font-medium text-gray-900 focus:bg-white outline-none"
                                                                />
                                                            </div>
                                                            <div className="flex-1 min-w-[100px]">
                                                                <input
                                                                    type="number"
                                                                    step="0.01"
                                                                    min="0"
                                                                    value={entry.amount}
                                                                    onChange={(e) => setQrEntryAmount(entry.id, e.target.value)}
                                                                    placeholder="Amount (CNY)"
                                                                    className="block w-full px-3 py-2 bg-white border border-gray-100 rounded-lg text-sm font-medium text-gray-900 focus:bg-white outline-none"
                                                                />
                                                            </div>
                                                            {qrEntries.length > 1 && (
                                                                <button type="button" onClick={() => removeQrEntry(entry.id)} className="p-2 text-red-400 hover:text-red-600 shrink-0" aria-label="Remove">
                                                                    <X className="h-4 w-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}
                                                    <button type="button" onClick={addQrEntry} className="text-[10px] font-semibold text-blue-600 hover:text-gray-900 flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
                                                        <Plus className="h-3 w-3" /> Upload new code
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 flex items-start gap-2">
                                <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                                <div className="min-w-0">
                                    <p className="text-[10px] font-semibold text-amber-800  mb-0.5">Please verify</p>
                                    <p className="text-[11px] text-amber-700 leading-snug">
                                        Cross-border transfers cannot be reversed. Double-check recipient name and details.
                                    </p>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full h-11 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-gray-900 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? 'Processing...' : 'Send transfer'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
            </div>
        </DashboardLayout>
    );
}
