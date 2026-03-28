'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Calculator, ArrowLeft, Search, User, Ship, Plane, Package } from 'lucide-react';
import {
    type ShippingMode,
    type DimensionUnit,
    type InvoiceRate,
    type FreightRateRow,
    type UnifiedQuote,
    DEFAULT_INVOICE_CURRENCY,
    INVOICE_CURRENCY_OPTIONS,
    freightInvoiceCurrency,
    freightSymbol,
    buildUnifiedQuotes,
    toCBM,
    invoiceLineAmountFromQuote,
    needsFxConversion,
    formatFxHint,
} from '@/lib/shippingQuote';
import type { AdminUserSearchRow } from '@/types/admin';

function displayUserName(u: AdminUserSearchRow) {
    const p = u?.profile;
    if (p?.first_name || p?.last_name) return `${p.first_name || ''} ${p.last_name || ''}`.trim();
    return u?.email ?? '—';
}

export default function ShippingCalculatorPage() {
    const router = useRouter();
    const today = new Date().toISOString().slice(0, 10);
    const [rates, setRates] = useState<InvoiceRate[]>([]);
    const [freightRates, setFreightRates] = useState<FreightRateRow[]>([]);
    const [shopCategories, setShopCategories] = useState<{ id: number; name: string; slug?: string }[]>([]);
    const [categoryId, setCategoryId] = useState<string>('');
    const [submitting, setSubmitting] = useState(false);
    const [customerSearch, setCustomerSearch] = useState('');
    const [customerSearchResults, setCustomerSearchResults] = useState<AdminUserSearchRow[]>([]);
    const [customerSearchOpen, setCustomerSearchOpen] = useState(false);
    const [customerSearching, setCustomerSearching] = useState(false);
    const customerSearchRef = useRef<HTMLDivElement>(null);

    // Customer (unchanged)
    const [form, setForm] = useState({
        customer_name: '',
        customer_email: '',
        customer_phone: '',
        customer_address: '',
        issue_date: today,
        due_date: today,
        currency: 'GHS',
        notes: '',
        discount_amount: '',
        discount_percent: '',
        tax_rate: '',
    });

    // Shipping calculator state
    const [mode, setMode] = useState<ShippingMode>('air');
    const [itemTypeRateId, setItemTypeRateId] = useState<string>('');
    const [weightKg, setWeightKg] = useState<string>('20');
    const [quantity, setQuantity] = useState<string>('1');
    const [length, setLength] = useState<string>('100');
    const [width, setWidth] = useState<string>('100');
    const [height, setHeight] = useState<string>('100');
    const [dimensionUnit, setDimensionUnit] = useState<DimensionUnit>('cm');
    /** Amount in the quote’s native currency (GHS for invoice rates; USD/RMB/EUR for freight). */
    const [nativeQuoteTotal, setNativeQuoteTotal] = useState<number | null>(null);
    const [nativeQuoteCurrency, setNativeQuoteCurrency] = useState<string | null>(null);
    /** How many units of invoice currency per 1 unit of native currency (required when they differ). */
    const [fxInvoicePerNative, setFxInvoicePerNative] = useState<string>('');
    const [calculationText, setCalculationText] = useState<string>('');
    const [estDelivery, setEstDelivery] = useState<string>('');

    useEffect(() => {
        api.get('/invoice-rates', { params: { is_active: 'true' } })
            .then(({ data }) => setRates(Array.isArray(data) ? data : []))
            .catch(() => setRates([]));
        api.get('/logistics/freight-rates')
            .then(({ data }) => setFreightRates(Array.isArray(data) ? data : []))
            .catch(() => setFreightRates([]));
        api.get('/products/categories')
            .then(({ data }) => setShopCategories(Array.isArray(data) ? data : []))
            .catch(() => setShopCategories([]));
    }, []);

    useEffect(() => {
        if (!customerSearch.trim()) {
            setCustomerSearchResults([]);
            setCustomerSearchOpen(false);
            return;
        }
        const t = setTimeout(() => {
            setCustomerSearching(true);
            api.get('/users/admin/list', { params: { search: customerSearch.trim(), limit: 20 } })
                .then(({ data }) => {
                    setCustomerSearchResults((data?.data ?? []) as AdminUserSearchRow[]);
                    setCustomerSearchOpen(true);
                })
                .catch(() => setCustomerSearchResults([]))
                .finally(() => setCustomerSearching(false));
        }, 300);
        return () => clearTimeout(t);
    }, [customerSearch]);

    useEffect(() => {
        const onDocClick = (e: MouseEvent) => {
            if (customerSearchRef.current && !customerSearchRef.current.contains(e.target as Node)) setCustomerSearchOpen(false);
        };
        document.addEventListener('click', onDocClick);
        return () => document.removeEventListener('click', onDocClick);
    }, []);

    const selectCustomer = (u: AdminUserSearchRow) => {
        const name = displayUserName(u);
        setForm((f) => ({
            ...f,
            customer_name: name || '',
            customer_email: u?.email ?? '',
            customer_phone: u?.phone ?? '',
        }));
        setCustomerSearch('');
        setCustomerSearchOpen(false);
        setCustomerSearchResults([]);
    };

    const unifiedRatesForMode = useMemo(
        () => buildUnifiedQuotes(mode, rates, freightRates),
        [mode, rates, freightRates],
    );

    useEffect(() => {
        if (unifiedRatesForMode.length === 0) {
            setItemTypeRateId('');
            return;
        }
        setItemTypeRateId((prev) =>
            prev && unifiedRatesForMode.some((x) => x.key === prev) ? prev : unifiedRatesForMode[0].key,
        );
    }, [mode, unifiedRatesForMode]);

    const selectedUnified = useMemo(
        () => unifiedRatesForMode.find((u) => u.key === itemTypeRateId) ?? null,
        [unifiedRatesForMode, itemTypeRateId],
    );

    useEffect(() => {
        if (!selectedUnified) {
            setForm((f) => ({ ...f, currency: DEFAULT_INVOICE_CURRENCY }));
            return;
        }
        if (selectedUnified.source === 'freight' && selectedUnified.freight) {
            const c = freightInvoiceCurrency(selectedUnified.freight);
            setForm((f) => ({ ...f, currency: c }));
        } else {
            setForm((f) => ({ ...f, currency: DEFAULT_INVOICE_CURRENCY }));
        }
    }, [selectedUnified?.key]);

    const invoiceLineResult = useMemo(
        () => invoiceLineAmountFromQuote(nativeQuoteTotal, nativeQuoteCurrency, form.currency, fxInvoicePerNative),
        [nativeQuoteTotal, nativeQuoteCurrency, form.currency, fxInvoicePerNative],
    );
    const invoiceLineAmount = invoiceLineResult.amount;

    const showFxRow = useMemo(
        () =>
            nativeQuoteTotal != null &&
            nativeQuoteCurrency != null &&
            needsFxConversion(nativeQuoteCurrency, form.currency),
        [nativeQuoteTotal, nativeQuoteCurrency, form.currency],
    );

    const formatUnifiedLabel = (u: UnifiedQuote): string => {
        if (u.source === 'invoice' && u.invoice) {
            const r = u.invoice;
            return `${r.name} — ${r.unit} @ ${DEFAULT_INVOICE_CURRENCY} ${Number(r.rate_per_unit).toFixed(2)} (invoice rate)`;
        }
        if (u.source === 'freight' && u.freight) {
            const r = u.freight;
            const sym = freightSymbol(r);
            const cur = freightInvoiceCurrency(r);
            return `${r.name} — ${r.type} @ ${sym}${Number(r.price).toFixed(2)} ${cur} (shipping rate)`;
        }
        return '';
    };

    const resolveLineUnit = (u: UnifiedQuote | null): string => {
        if (!u) return 'pcs';
        if (u.source === 'invoice' && u.invoice) return u.invoice.unit || 'pcs';
        if (u.source === 'freight' && u.freight) {
            const t = u.freight.type;
            if (t === 'KG') return 'kg';
            if (t === 'CBM') return 'CBM';
            return 'unit';
        }
        return 'pcs';
    };

    const handleCalculate = () => {
        const u = selectedUnified;
        if (!u) {
            toast.error('Select an item type (rate) first');
            return;
        }
        const qty = Math.max(1, Number(quantity) || 1);

        if (u.source === 'invoice' && u.invoice) {
            const selectedRate = u.invoice;
            const rate = Number(selectedRate.rate_per_unit) || 0;
            const unit = (selectedRate.unit || '').toLowerCase();

            if (mode === 'sea' && unit === 'cbm') {
                const l = Number(length) || 0,
                    w = Number(width) || 0,
                    h = Number(height) || 0;
                const cbm = toCBM(l, w, h, dimensionUnit);
                const total = cbm * rate * qty;
                setNativeQuoteTotal(total);
                setNativeQuoteCurrency(DEFAULT_INVOICE_CURRENCY);
                setCalculationText(`${cbm.toFixed(3)} CBM × ${DEFAULT_INVOICE_CURRENCY} ${rate.toFixed(2)}/CBM × ${qty} (${selectedRate.name})`);
                setEstDelivery('35–40 days');
            } else if (mode === 'air' && unit === 'kg') {
                const wkg = Number(weightKg) || 0;
                const total = wkg * rate * qty;
                setNativeQuoteTotal(total);
                setNativeQuoteCurrency(DEFAULT_INVOICE_CURRENCY);
                setCalculationText(`${wkg.toFixed(2)} kg × ${DEFAULT_INVOICE_CURRENCY} ${rate.toFixed(2)}/kg × ${qty} (${selectedRate.name})`);
                setEstDelivery('3–10 days');
            } else {
                toast.error(mode === 'air' ? 'Use an Air rate with unit kg.' : 'Use a Sea rate with unit CBM.');
            }
            return;
        }

        if (u.source === 'freight' && u.freight) {
            const fr = u.freight;
            const price = Number(fr.price) || 0;
            const sym = freightSymbol(fr);
            const cur = freightInvoiceCurrency(fr);

            if (mode === 'air' && fr.method === 'air_freight') {
                if (fr.type === 'KG') {
                    const wkg = Number(weightKg) || 0;
                    const total = wkg * price * qty;
                    setNativeQuoteTotal(total);
                    setNativeQuoteCurrency(cur);
                    setCalculationText(
                        `${wkg.toFixed(2)} kg × ${sym}${price.toFixed(2)}/kg (${cur}) × ${qty} (${fr.name})`,
                    );
                    setEstDelivery(fr.duration || '3–10 days');
                } else if (fr.type === 'UNIT') {
                    const total = price * qty;
                    setNativeQuoteTotal(total);
                    setNativeQuoteCurrency(cur);
                    setCalculationText(`${qty} × ${sym}${price.toFixed(2)} ${cur} each (${fr.name})`);
                    setEstDelivery(fr.duration || '3–10 days');
                } else {
                    toast.error('Unsupported air freight type for this calculator.');
                }
                return;
            }

            if (mode === 'sea' && fr.method === 'sea_freight' && fr.type === 'CBM') {
                const l = Number(length) || 0,
                    w = Number(width) || 0,
                    h = Number(height) || 0;
                const cbm = toCBM(l, w, h, dimensionUnit);
                const total = cbm * price * qty;
                setNativeQuoteTotal(total);
                setNativeQuoteCurrency(cur);
                setCalculationText(
                    `${cbm.toFixed(3)} CBM × ${sym}${price.toFixed(2)}/CBM (${cur}) × ${qty} (${fr.name})`,
                );
                setEstDelivery(fr.duration || '35–40 days');
                return;
            }
        }

        toast.error('Could not calculate with this rate.');
    };

    const handleReset = () => {
        setWeightKg('20');
        setQuantity('1');
        setLength('100');
        setWidth('100');
        setHeight('100');
        setDimensionUnit('cm');
        setNativeQuoteTotal(null);
        setNativeQuoteCurrency(null);
        setFxInvoicePerNative('');
        setCalculationText('');
        setEstDelivery('');
        setItemTypeRateId('');
    };

    const discountAmt = Number(form.discount_amount) || 0;
    const subtotal = invoiceLineAmount ?? 0;
    const discountPct = Number(form.discount_percent) || 0;
    const discountTotal = discountAmt + (subtotal * discountPct) / 100;
    const afterDiscount = subtotal - discountTotal;
    const taxRate = Number(form.tax_rate) || 0;
    const taxAmount = (afterDiscount * taxRate) / 100;
    const total = afterDiscount + taxAmount;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.customer_name.trim() || !form.customer_email.trim()) {
            toast.error('Customer name and email are required');
            return;
        }
        if (nativeQuoteTotal == null || nativeQuoteTotal < 0) {
            toast.error('Calculate a shipping quote first');
            return;
        }
        if (invoiceLineAmount == null) {
            toast.error(invoiceLineResult.error || 'Set invoice currency and exchange rate to match your quote.');
            return;
        }
        setSubmitting(true);
        try {
            const lineDescription =
                calculationText ||
                `Shipping (${mode}) — ${form.currency} ${invoiceLineAmount.toFixed(2)}`;
            const cat = shopCategories.find((c) => String(c.id) === categoryId);
            let notesCombined = form.notes.trim();
            if (cat) {
                notesCombined = notesCombined
                    ? `${notesCombined}\n\nCategory: ${cat.name}`
                    : `Category: ${cat.name}`;
            }
            if (
                nativeQuoteCurrency &&
                needsFxConversion(nativeQuoteCurrency, form.currency) &&
                invoiceLineResult.amount != null
            ) {
                const fx = fxInvoicePerNative.trim();
                const audit = `FX: quoted ${nativeQuoteTotal.toFixed(2)} ${nativeQuoteCurrency}; 1 ${nativeQuoteCurrency} = ${fx} ${form.currency}; invoice line ${invoiceLineAmount.toFixed(2)} ${form.currency}.`;
                notesCombined = notesCombined ? `${notesCombined}\n\n${audit}` : audit;
            }
            const payload = {
                customer_name: form.customer_name.trim(),
                customer_email: form.customer_email.trim(),
                customer_phone: form.customer_phone.trim() || undefined,
                customer_address: form.customer_address.trim() || undefined,
                issue_date: form.issue_date,
                due_date: form.due_date,
                currency: form.currency,
                notes: notesCombined || undefined,
                discount_amount: discountAmt,
                discount_percent: form.discount_percent ? discountPct : undefined,
                tax_rate: form.tax_rate ? taxRate : undefined,
                items: [
                    {
                        description: lineDescription,
                        quantity: 1,
                        unit: resolveLineUnit(selectedUnified),
                        unit_price: invoiceLineAmount,
                    },
                ],
            };
            const { data } = await api.post('/invoices', payload);
            toast.success('Invoice created from quote');
            router.push(`/admin/invoices/${data.id}`);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to create invoice');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <DashboardLayout isAdmin={true}>
            <div className="pb-6 md:pb-8 max-w-4xl mx-auto px-3 sm:px-4">
                <div className="mb-6 flex items-center gap-4">
                    <Link
                        href="/admin/invoices"
                        className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:text-gray-900 hover:border-gray-300 hover:bg-gray-50/80 transition-colors"
                        aria-label="Back to invoices"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-sm">
                            <Calculator className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Shipping Fee Estimator</h1>
                            <p className="text-xs text-gray-500 mt-0.5">Get instant estimates for sea and air freight.</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Customer section */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-50 bg-gray-50/30">
                            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Customer</h2>
                        </div>
                        <div className="p-4 space-y-4 sm:p-6">
                        <div className="relative" ref={customerSearchRef}>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Search & select existing user</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={customerSearch}
                                    onChange={(e) => setCustomerSearch(e.target.value)}
                                    onFocus={() => customerSearchResults.length > 0 && setCustomerSearchOpen(true)}
                                    placeholder="Type email or phone to search users..."
                                    className="w-full min-h-[44px] h-10 pl-9 pr-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                                {customerSearching && (
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">Searching...</span>
                                )}
                            </div>
                            {customerSearchOpen && customerSearchResults.length > 0 && (
                                <ul className="absolute z-20 mt-1 w-full max-h-48 overflow-auto rounded-xl border border-gray-200 bg-white shadow-lg py-1">
                                    {customerSearchResults.map((u) => (
                                        <li key={u.id}>
                                            <button
                                                type="button"
                                                onClick={() => selectCustomer(u)}
                                                className="w-full min-h-[44px] px-3 py-2.5 text-left flex items-center gap-2 hover:bg-gray-50 active:bg-gray-100 text-sm touch-manipulation"
                                            >
                                                <User className="h-4 w-4 text-gray-400 shrink-0" />
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-medium text-gray-900 truncate">{displayUserName(u)}</p>
                                                    <p className="text-xs text-gray-500 truncate">{u.email} {u.phone ? ` · ${u.phone}` : ''}</p>
                                                </div>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <p className="text-xs text-gray-500">Or enter customer details manually below.</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Name *</label>
                                <input
                                    value={form.customer_name}
                                    onChange={(e) => setForm((f) => ({ ...f, customer_name: e.target.value }))}
                                    className="w-full min-h-[44px] h-10 px-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Email *</label>
                                <input
                                    type="email"
                                    value={form.customer_email}
                                    onChange={(e) => setForm((f) => ({ ...f, customer_email: e.target.value }))}
                                    className="w-full min-h-[44px] h-10 px-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Phone</label>
                                <input
                                    value={form.customer_phone}
                                    onChange={(e) => setForm((f) => ({ ...f, customer_phone: e.target.value }))}
                                    className="w-full min-h-[44px] h-10 px-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow"
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Address</label>
                                <input
                                    value={form.customer_address}
                                    onChange={(e) => setForm((f) => ({ ...f, customer_address: e.target.value }))}
                                    className="w-full min-h-[44px] h-10 px-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Issue date</label>
                                <input
                                    type="date"
                                    value={form.issue_date}
                                    onChange={(e) => setForm((f) => ({ ...f, issue_date: e.target.value }))}
                                    className="w-full min-h-[44px] h-10 px-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Due date</label>
                                <input
                                    type="date"
                                    value={form.due_date}
                                    onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
                                    className="w-full min-h-[44px] h-10 px-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow"
                                />
                            </div>
                        </div>
                        </div>
                    </div>

                    {/* Shipping Fee Estimator */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-50 bg-gray-50/30">
                            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Package details & quote</h2>
                        </div>
                        <div className="p-4 space-y-5 sm:p-6">
                            {/* Mode: Sea / Air */}
                            <div className="flex gap-2 p-1 rounded-xl bg-gray-100/80">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setMode('sea');
                                        setItemTypeRateId('');
                                        setNativeQuoteTotal(null);
                                        setNativeQuoteCurrency(null);
                                        setFxInvoicePerNative('');
                                        setCalculationText('');
                                    }}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${
                                        mode === 'sea'
                                            ? 'bg-white text-orange-600 shadow-sm border border-orange-200'
                                            : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    <Ship className="h-4 w-4 shrink-0" /> Sea
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setMode('air');
                                        setItemTypeRateId('');
                                        setNativeQuoteTotal(null);
                                        setNativeQuoteCurrency(null);
                                        setFxInvoicePerNative('');
                                        setCalculationText('');
                                    }}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${
                                        mode === 'air'
                                            ? 'bg-white text-orange-600 shadow-sm border border-orange-200'
                                            : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    <Plane className="h-4 w-4 shrink-0" /> Air
                                </button>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Product category (optional)</label>
                                <select
                                    value={categoryId}
                                    onChange={(e) => setCategoryId(e.target.value)}
                                    className="w-full min-h-[44px] h-10 px-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white transition-shadow"
                                >
                                    <option value="">Select category…</option>
                                    {shopCategories.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-[11px] text-gray-400 mt-1">Used for notes on the invoice; does not change the math.</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Invoice currency</label>
                                    <select
                                        data-testid="invoice-currency"
                                        value={form.currency}
                                        onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                                        className="w-full min-h-[44px] h-10 px-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white transition-shadow"
                                    >
                                        {INVOICE_CURRENCY_OPTIONS.map((c) => (
                                            <option key={c} value={c}>
                                                {c}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-[11px] text-gray-400 mt-1">
                                        Defaults from the selected rate; change if you bill in another currency.
                                    </p>
                                </div>
                                {showFxRow && nativeQuoteCurrency && (
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">
                                            {formatFxHint(nativeQuoteCurrency, form.currency)}
                                        </label>
                                        <input
                                            data-testid="fx-rate"
                                            type="text"
                                            inputMode="decimal"
                                            value={fxInvoicePerNative}
                                            onChange={(e) => setFxInvoicePerNative(e.target.value)}
                                            placeholder="e.g. 15.5"
                                            className="w-full min-h-[44px] h-10 px-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                            aria-label={formatFxHint(nativeQuoteCurrency, form.currency)}
                                        />
                                        {invoiceLineResult.error && (
                                            <p className="text-xs text-red-600 mt-1">{invoiceLineResult.error}</p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* By Air: Item type + Weight (kg) + Quantity — no dimensions */}
                            {mode === 'air' && (
                                <>
                                    <div className="space-y-3">
                                        <label className="block text-xs font-semibold text-gray-500">Item type</label>
                                        <select
                                            value={itemTypeRateId}
                                            onChange={(e) => {
                                                setItemTypeRateId(e.target.value);
                                                setNativeQuoteTotal(null);
                                                setNativeQuoteCurrency(null);
                                                setFxInvoicePerNative('');
                                            }}
                                            className="w-full min-h-[44px] h-10 px-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white transition-shadow"
                                        >
                                            <option value="">Select item type…</option>
                                            {unifiedRatesForMode.map((u) => (
                                                <option key={u.key} value={u.key}>
                                                    {formatUnifiedLabel(u)}
                                                </option>
                                            ))}
                                        </select>
                                        {unifiedRatesForMode.length === 0 && (
                                            <p className="text-xs text-orange-600">
                                                No air rates yet. Add rows under{' '}
                                                <Link href="/admin/shipping-rates" className="underline font-medium">
                                                    Shipping Rates
                                                </Link>{' '}
                                                (KG or UNIT) or{' '}
                                                <Link href="/admin/invoice-rates" className="underline font-medium">
                                                    Invoice rates
                                                </Link>{' '}
                                                (mode air, unit kg).
                                            </p>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 mb-1">Weight (kg)</label>
                                            <input
                                                type="number"
                                                min={0}
                                                step={0.1}
                                                value={weightKg}
                                                onChange={(e) => setWeightKg(e.target.value)}
                                                className="w-full min-h-[44px] h-10 px-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 mb-1">Quantity</label>
                                            <input
                                                type="number"
                                                min={1}
                                                step={1}
                                                value={quantity}
                                                onChange={(e) => setQuantity(e.target.value)}
                                                className="w-full min-h-[44px] h-10 px-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow"
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* By Sea: Package dimensions (L, W, H, unit cm/m/mm) + Quantity — no item type dropdown for “type”, dimensions drive CBM */}
                            {mode === 'sea' && (
                                <>
                                    <div className="space-y-3">
                                        <label className="block text-xs font-semibold text-gray-500">Item type (rate per CBM)</label>
                                        <select
                                            value={itemTypeRateId}
                                            onChange={(e) => {
                                                setItemTypeRateId(e.target.value);
                                                setNativeQuoteTotal(null);
                                                setNativeQuoteCurrency(null);
                                                setFxInvoicePerNative('');
                                            }}
                                            className="w-full min-h-[44px] h-10 px-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white transition-shadow"
                                        >
                                            <option value="">Select rate…</option>
                                            {unifiedRatesForMode.map((u) => (
                                                <option key={u.key} value={u.key}>
                                                    {formatUnifiedLabel(u)}
                                                </option>
                                            ))}
                                        </select>
                                        {unifiedRatesForMode.length === 0 && (
                                            <p className="text-xs text-orange-600">
                                                No sea rates yet. Add CBM rows under{' '}
                                                <Link href="/admin/shipping-rates" className="underline font-medium">
                                                    Shipping Rates
                                                </Link>{' '}
                                                or{' '}
                                                <Link href="/admin/invoice-rates" className="underline font-medium">
                                                    Invoice rates
                                                </Link>{' '}
                                                (mode sea, unit CBM).
                                            </p>
                                        )}
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-gray-100">
                                        <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1.5">
                                            <Package className="h-3.5 w-3.5" /> Package dimensions
                                        </p>
                                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                                            <div>
                                                <label className="block text-[11px] text-gray-400 mb-0.5">Length</label>
                                                <input
                                                    type="number"
                                                    min={0}
                                                    step={0.1}
                                                    value={length}
                                                    onChange={(e) => setLength(e.target.value)}
                                                    className="w-full min-h-[44px] h-9 px-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] text-gray-400 mb-0.5">Width</label>
                                                <input
                                                    type="number"
                                                    min={0}
                                                    step={0.1}
                                                    value={width}
                                                    onChange={(e) => setWidth(e.target.value)}
                                                    className="w-full min-h-[44px] h-9 px-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] text-gray-400 mb-0.5">Height</label>
                                                <input
                                                    type="number"
                                                    min={0}
                                                    step={0.1}
                                                    value={height}
                                                    onChange={(e) => setHeight(e.target.value)}
                                                    className="w-full min-h-[44px] h-9 px-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                                />
                                            </div>
                                        </div>
                                        <div className="mt-2">
                                            <label className="block text-[11px] text-gray-400 mb-0.5">Unit</label>
                                            <select
                                                value={dimensionUnit}
                                                onChange={(e) => setDimensionUnit(e.target.value as DimensionUnit)}
                                                className="w-full h-9 px-2 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                            >
                                                <option value="cm">Centimeters (cm)</option>
                                                <option value="m">Meters (m)</option>
                                                <option value="mm">Millimeters (mm)</option>
                                            </select>
                                        </div>
                                        <div className="mt-3">
                                            <label className="block text-xs font-semibold text-gray-500 mb-1">Quantity</label>
                                            <input
                                                type="number"
                                                min={1}
                                                step={1}
                                                value={quantity}
                                                onChange={(e) => setQuantity(e.target.value)}
                                                className="w-full h-10 px-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 max-w-[120px]"
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Calculate & Reset */}
                            <div className="flex flex-wrap gap-3 mt-5">
                                <button
                                    type="button"
                                    data-testid="calculate-btn"
                                    onClick={handleCalculate}
                                    className="min-h-[44px] px-6 bg-orange-500 text-white rounded-xl font-semibold text-sm hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 shadow-sm transition-all"
                                >
                                    Calculate
                                </button>
                                <button
                                    type="button"
                                    onClick={handleReset}
                                    className="min-h-[44px] px-6 border border-gray-200 rounded-xl font-semibold text-sm text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                                >
                                    Reset
                                </button>
                            </div>

                            {/* Result */}
                            {(calculationText || nativeQuoteTotal != null) && (
                                <div
                                    className="mt-5 p-5 rounded-2xl bg-gradient-to-br from-orange-50 to-orange-50/80 border border-orange-100 space-y-2"
                                    data-testid="quote-result"
                                >
                                    {calculationText && (
                                        <p className="text-sm text-gray-700">
                                            <span className="font-semibold text-gray-900">Calculation:</span> {calculationText}
                                        </p>
                                    )}
                                    {estDelivery && (
                                        <p className="text-sm text-gray-600">
                                            <span className="font-semibold text-gray-800">Est. delivery:</span> {estDelivery}
                                        </p>
                                    )}
                                    {nativeQuoteTotal != null && nativeQuoteCurrency && (
                                        <p className="text-sm text-gray-700" data-testid="native-total">
                                            <span className="font-semibold text-gray-900">Quoted (native):</span>{' '}
                                            {nativeQuoteCurrency} {nativeQuoteTotal.toFixed(2)}
                                        </p>
                                    )}
                                    {nativeQuoteTotal != null && (
                                        <p className="text-xl font-bold text-orange-600 pt-2 border-t border-orange-100/80 mt-2">
                                            {invoiceLineAmount != null ? (
                                                <>
                                                    Invoice line: {form.currency} {invoiceLineAmount.toFixed(2)}
                                                </>
                                            ) : (
                                                <span className="text-base font-normal text-gray-600">
                                                    Enter the exchange rate above to express this quote in {form.currency}.
                                                </span>
                                            )}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Discount, tax, notes */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-gray-100">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Discount amount</label>
                                <input
                                    type="number"
                                    min={0}
                                    step={0.01}
                                    value={form.discount_amount}
                                    onChange={(e) => setForm((f) => ({ ...f, discount_amount: e.target.value }))}
                                    className="w-full h-9 px-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Discount %</label>
                                <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    step={0.5}
                                    value={form.discount_percent}
                                    onChange={(e) => setForm((f) => ({ ...f, discount_percent: e.target.value }))}
                                    className="w-full h-9 px-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Tax %</label>
                                <input
                                    type="number"
                                    min={0}
                                    step={0.5}
                                    value={form.tax_rate}
                                    onChange={(e) => setForm((f) => ({ ...f, tax_rate: e.target.value }))}
                                    className="w-full h-9 px-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                            </div>
                        </div>
                        <div className="rounded-2xl bg-gray-50 border border-gray-100 p-5 space-y-1.5">
                            <p className="text-sm text-gray-600">
                                <span className="font-semibold text-gray-800">Subtotal (quote):</span> {form.currency}{' '}
                                {(invoiceLineAmount ?? 0).toFixed(2)}
                            </p>
                            {discountTotal > 0 && <p className="text-sm text-gray-600"><span className="font-semibold text-gray-800">Discount:</span> −{form.currency} {discountTotal.toFixed(2)}</p>}
                            {taxAmount > 0 && <p className="text-sm text-gray-600"><span className="font-semibold text-gray-800">Tax:</span> +{form.currency} {taxAmount.toFixed(2)}</p>}
                            <p className="text-lg font-bold text-gray-900 pt-2 mt-2 border-t border-gray-200">Total: {form.currency} {total.toFixed(2)}</p>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Notes</label>
                            <textarea
                                value={form.notes}
                                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-y"
                            />
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3 pt-1">
                        <button
                            type="submit"
                            disabled={submitting || nativeQuoteTotal == null || invoiceLineAmount == null}
                            data-testid="create-invoice"
                            className="min-h-[44px] px-6 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none shadow-sm transition-all"
                        >
                            {submitting ? 'Saving…' : 'Create invoice from quote'}
                        </button>
                        <Link href="/admin/invoices" className="min-h-[44px] px-6 border border-gray-200 rounded-xl font-semibold text-sm text-gray-700 hover:bg-gray-50 hover:border-gray-300 flex items-center justify-center transition-colors">
                            Cancel
                        </Link>
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
}
