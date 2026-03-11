'use client';

import React, { useState, useEffect, useRef } from 'react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Calculator, ArrowLeft, Search, User, Ship, Plane, Package } from 'lucide-react';

type ShippingMode = 'sea' | 'air';
type DimensionUnit = 'cm' | 'm' | 'mm';

interface InvoiceRate {
    id: number;
    name: string;
    unit: string;
    rate_per_unit: number;
    mode: string | null;
    is_active: boolean;
}

function displayUserName(u: any) {
    const p = u?.profile;
    if (p?.first_name || p?.last_name) return `${p.first_name || ''} ${p.last_name || ''}`.trim();
    return u?.email ?? '—';
}

/** Convert dimensions to cubic meters (CBM) */
function toCBM(length: number, width: number, height: number, unit: DimensionUnit): number {
    const l = length || 0, w = width || 0, h = height || 0;
    if (unit === 'cm') return (l * w * h) / 1_000_000;
    if (unit === 'm') return l * w * h;
    if (unit === 'mm') return (l * w * h) / 1_000_000_000;
    return (l * w * h) / 1_000_000;
}

export default function ShippingCalculatorPage() {
    const router = useRouter();
    const today = new Date().toISOString().slice(0, 10);
    const [rates, setRates] = useState<InvoiceRate[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [customerSearch, setCustomerSearch] = useState('');
    const [customerSearchResults, setCustomerSearchResults] = useState<any[]>([]);
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
    const [calculatedTotal, setCalculatedTotal] = useState<number | null>(null);
    const [calculationText, setCalculationText] = useState<string>('');
    const [estDelivery, setEstDelivery] = useState<string>('');

    useEffect(() => {
        api.get('/invoice-rates', { params: { is_active: 'true' } })
            .then(({ data }) => setRates(Array.isArray(data) ? data : []))
            .catch(() => setRates([]));
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
                    setCustomerSearchResults(data?.data ?? []);
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

    const selectCustomer = (u: any) => {
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

    // Air: only rates with mode=air (or no mode) and unit=kg. Sea: only mode=sea and unit=CBM.
    const ratesForMode = rates.filter((r) => {
        const m = (r.mode || '').toLowerCase();
        const u = (r.unit || '').toLowerCase();
        if (mode === 'air') return (m === 'air' || !m) && u === 'kg';
        return (m === 'sea' || !m) && u === 'cbm';
    });

    const selectedRate = itemTypeRateId ? rates.find((r) => r.id === Number(itemTypeRateId)) : null;

    const handleCalculate = () => {
        if (!selectedRate) {
            toast.error('Select an item type (rate) first');
            return;
        }
        const qty = Math.max(1, Number(quantity) || 1);
        const rate = Number(selectedRate.rate_per_unit) || 0;
        const unit = (selectedRate.unit || '').toLowerCase();

        if (mode === 'sea' && unit === 'cbm') {
            const l = Number(length) || 0, w = Number(width) || 0, h = Number(height) || 0;
            const cbm = toCBM(l, w, h, dimensionUnit);
            const total = cbm * rate * qty;
            setCalculatedTotal(total);
            setCalculationText(`${cbm.toFixed(3)} CBM × ${form.currency} ${rate.toFixed(2)}/CBM × ${qty} item`);
            setEstDelivery('35–40 days');
        } else if (mode === 'air' && unit === 'kg') {
            const w = Number(weightKg) || 0;
            const total = w * rate * qty;
            setCalculatedTotal(total);
            setCalculationText(`${w.toFixed(2)} kg × ${form.currency} ${rate.toFixed(2)}/kg × ${qty} item`);
            setEstDelivery('3–10 days');
        } else {
            toast.error(mode === 'air' ? 'Use an Air rate with unit kg.' : 'Use a Sea rate with unit CBM.');
        }
    };

    const handleReset = () => {
        setWeightKg('20');
        setQuantity('1');
        setLength('100');
        setWidth('100');
        setHeight('100');
        setDimensionUnit('cm');
        setCalculatedTotal(null);
        setCalculationText('');
        setEstDelivery('');
    };

    const discountAmt = Number(form.discount_amount) || 0;
    const subtotal = calculatedTotal ?? 0;
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
        if (calculatedTotal == null || calculatedTotal < 0) {
            toast.error('Calculate a shipping quote first');
            return;
        }
        setSubmitting(true);
        try {
            const lineDescription = calculationText || `Shipping (${mode}) — ${form.currency} ${calculatedTotal.toFixed(2)}`;
            const payload = {
                customer_name: form.customer_name.trim(),
                customer_email: form.customer_email.trim(),
                customer_phone: form.customer_phone.trim() || undefined,
                customer_address: form.customer_address.trim() || undefined,
                issue_date: form.issue_date,
                due_date: form.due_date,
                currency: form.currency,
                notes: form.notes.trim() || undefined,
                discount_amount: discountAmt,
                discount_percent: form.discount_percent ? discountPct : undefined,
                tax_rate: form.tax_rate ? taxRate : undefined,
                items: [
                    {
                        description: lineDescription,
                        quantity: 1,
                        unit: selectedRate?.unit || 'pcs',
                        unit_price: calculatedTotal,
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
                                    onClick={() => { setMode('sea'); setItemTypeRateId(''); setCalculatedTotal(null); setCalculationText(''); }}
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
                                    onClick={() => { setMode('air'); setItemTypeRateId(''); setCalculatedTotal(null); setCalculationText(''); }}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${
                                        mode === 'air'
                                            ? 'bg-white text-orange-600 shadow-sm border border-orange-200'
                                            : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    <Plane className="h-4 w-4 shrink-0" /> Air
                                </button>
                            </div>

                            {/* By Air: Item type + Weight (kg) + Quantity — no dimensions */}
                            {mode === 'air' && (
                                <>
                                    <div className="space-y-3">
                                        <label className="block text-xs font-semibold text-gray-500">Item type</label>
                                        <select
                                            value={itemTypeRateId}
                                            onChange={(e) => { setItemTypeRateId(e.target.value); setCalculatedTotal(null); }}
                                            className="w-full min-h-[44px] h-10 px-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white transition-shadow"
                                        >
                                            <option value="">Select item type…</option>
                                            {ratesForMode.map((r) => (
                                                <option key={r.id} value={r.id}>{r.name} — {r.unit} @ {form.currency} {Number(r.rate_per_unit).toFixed(2)}</option>
                                            ))}
                                        </select>
                                        {ratesForMode.length === 0 && (
                                            <p className="text-xs text-amber-600">No air rates. Add invoice rates with mode &quot;air&quot; in Invoice rates.</p>
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
                                            onChange={(e) => { setItemTypeRateId(e.target.value); setCalculatedTotal(null); }}
                                            className="w-full min-h-[44px] h-10 px-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white transition-shadow"
                                        >
                                            <option value="">Select rate…</option>
                                            {ratesForMode.map((r) => (
                                                <option key={r.id} value={r.id}>{r.name} — {r.unit} @ {form.currency} {Number(r.rate_per_unit).toFixed(2)}</option>
                                            ))}
                                        </select>
                                        {ratesForMode.length === 0 && (
                                            <p className="text-xs text-amber-600">No sea rates. Add invoice rates with mode &quot;sea&quot; and unit CBM in Invoice rates.</p>
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
                            {(calculationText || calculatedTotal != null) && (
                                <div className="mt-5 p-5 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50/80 border border-orange-100 space-y-2">
                                    {calculationText && <p className="text-sm text-gray-700"><span className="font-semibold text-gray-900">Calculation:</span> {calculationText}</p>}
                                    {estDelivery && <p className="text-sm text-gray-600"><span className="font-semibold text-gray-800">Est. delivery:</span> {estDelivery}</p>}
                                    {calculatedTotal != null && (
                                        <p className="text-xl font-bold text-orange-600 pt-2 border-t border-orange-100/80 mt-2">Total cost: {form.currency} {calculatedTotal.toFixed(2)}</p>
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
                            <p className="text-sm text-gray-600"><span className="font-semibold text-gray-800">Subtotal (quote):</span> {form.currency} {(calculatedTotal ?? 0).toFixed(2)}</p>
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
                            disabled={submitting || calculatedTotal == null}
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
