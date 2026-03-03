'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { Truck, CheckCircle, Plus, Copy, Camera, History as HistoryIcon, RefreshCw, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import BarcodeScanner from '@/components/ui/BarcodeScanner';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

interface Shipment {
    id: number;
    tracking_number: string;
    status: string;
    total_price: number;
    created_at: string;
}

interface Zone {
    id: number;
    zone_name: string;
    base_price: string;
}

interface Warehouse {
    id: number;
    name: string;
    code: string;
    address: string;
    city: string;
    country: string;
    phone: string;
    recipient_name: string;
}

interface FreightRate {
    id: number;
    rate_id: string;
    method: string;
    name: string;
    price: string | number;
    type: string;
    duration: string | null;
    currency?: string | null;
    is_active: boolean;
    sort_order: number;
}

function rateSymbol(r: FreightRate): string {
    return r.currency === 'RMB' || ['air_phone', 'air_laptop'].includes(r.rate_id) ? '¥' : '$';
}

export default function LogisticsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [zones, setZones] = useState<Zone[]>([]);

    // Booking Form State
    const [selectedPickupId, setSelectedPickupId] = useState<number | null>(null);
    const [weight, setWeight] = useState<number>(1);
    const [dimensions, setDimensions] = useState({ length: '', width: '', height: '' });
    const [contentsDescription, setContentsDescription] = useState('');
    const [zoneId, setZoneId] = useState<string>('');
    const [serviceType, setServiceType] = useState<'air_freight' | 'sea_freight'>('air_freight');
    const [pickupDate, setPickupDate] = useState('');
    const [pickupTimeSlot, setPickupTimeSlot] = useState('morning');
    const [notes, setNotes] = useState('');
    const [priceDetails, setPriceDetails] = useState<{ base: number, weightInfo: number, service: number, total: number } | null>(null);
    const [estimatedPrice, setEstimatedPrice] = useState<number>(0);
    const [isCalculating, setIsCalculating] = useState(false);
    const [isBooking, setIsBooking] = useState(false);
    const [loading, setLoading] = useState(false);
    const [shipments, setShipments] = useState<Shipment[]>([]);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);

    // Ship for me only (no local courier)
    const [bookingType] = useState<'freight'>('freight');
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | null>(null);
    const [selectedDestinationWarehouseId, setSelectedDestinationWarehouseId] = useState<number | null>(null);
    const [carrierTracking, setCarrierTracking] = useState('');
    const [isCod, setIsCod] = useState(false);
    const [declaredItems, setDeclaredItems] = useState([{ description: '', value: '', quantity: '' }]);
    const [freightRates, setFreightRates] = useState<FreightRate[]>([]);
    const [selectedRateId, setSelectedRateId] = useState<string | null>(null);
    const [scannerOpen, setScannerOpen] = useState(false);

    // China warehouse: match by country or known code (CN-GZ-001)
    const chinaWarehouse = warehouses.find(w =>
        String(w.country || '').toLowerCase() === 'china' ||
        String(w.code || '').toUpperCase().startsWith('CN-')
    );
    // Only Lapaz for local pickup (no Kumasi)
    const lapazWarehouse = warehouses.find(w => w.country === 'Ghana' && (w.name.toLowerCase().includes('lapaz') || (w.code && String(w.code).toLowerCase().includes('lapaz'))));
    const ghanaWarehouses = lapazWarehouse ? [lapazWarehouse] : warehouses.filter(w => w.country === 'Ghana').slice(0, 1);

    // Estimated total from selected rate + weight / units
    const selectedRate = selectedRateId ? freightRates.find((r) => r.rate_id === selectedRateId) : null;
    const totalItemQuantity = declaredItems.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);
    const estimatedTotal =
        selectedRate && weight != null
            ? (() => {
                const price = Number(selectedRate.price);
                if (selectedRate.type === 'KG') return price * (weight || 0);
                if (selectedRate.type === 'UNIT') return price * Math.max(1, totalItemQuantity);
                if (selectedRate.type === 'CBM') return price * (weight || 0); // use weight as proxy if no CBM field
                return price * (weight || 0);
            })()
            : null;

    const fetchShipments = async () => {
        setHistoryLoading(true);
        try {
            const { data } = await api.get('/logistics/history');
            setShipments(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to load shipments', error);
        } finally {
            setHistoryLoading(false);
        }
    };

    useEffect(() => {
        fetchShipments();
    }, []);

    useEffect(() => {
        const fetchInitial = async () => {
            try {
                const [zonesRes, warehousesRes] = await Promise.all([
                    api.get('/logistics/zones'),
                    api.get('/logistics/warehouses')
                ]);
                const zones = Array.isArray(zonesRes.data) ? zonesRes.data : zonesRes.data?.data ?? [];
                const whList = Array.isArray(warehousesRes.data) ? warehousesRes.data : warehousesRes.data?.data ?? [];
                setZones(zones);
                setWarehouses(whList);

                const chinaWh = whList.find((w: any) =>
                    String(w.country || '').toLowerCase() === 'china' ||
                    String(w.code || '').toUpperCase().startsWith('CN-')
                );
                const ghanaWarehouse = whList.find((w: any) =>
                    String(w.country || '').toLowerCase() === 'ghana' &&
                    (String(w.name || '').toLowerCase().includes('lapaz') || String(w.code || '').toLowerCase().includes('lapaz'))
                );

                if (chinaWh) setSelectedWarehouseId(chinaWh.id);
                if (ghanaWarehouse) setSelectedDestinationWarehouseId(ghanaWarehouse.id);

                if (zones.length > 0) setZoneId(zones[0].id.toString());
            } catch (error) {
                console.error("Failed to load logistics data", error);
            }
        };
        fetchInitial();
    }, []);

    const [ratesError, setRatesError] = useState<string | null>(null);

    useEffect(() => {
        const fetchRates = async () => {
            const method = serviceType === 'sea_freight' ? 'sea_freight' : 'air_freight';
            setRatesError(null);
            try {
                const { data } = await api.get<FreightRate[]>('/logistics/freight-rates', { params: { method } });
                const list = Array.isArray(data) ? data : [];
                setFreightRates(list);
                setSelectedRateId(null);
                if (list.length === 0) setRatesError('No rates configured. Add them in Admin → Logistics Shipping Rates.');
            } catch (e) {
                setFreightRates([]);
                setSelectedRateId(null);
                setRatesError('Could not load rates. Check that the API is running and the database has shipping rates.');
            }
        };
        fetchRates();
    }, [serviceType]);
    const calculatePrice = async () => {
        if (!weight || !zoneId) return;
        setIsCalculating(true);
        try {
            const { data } = await api.post('/logistics/calculate-price', {
                zoneId: Number(zoneId),
                weight: Number(weight),
                serviceType
            });
            setEstimatedPrice(data.total);
            setPriceDetails(data);
        } catch (error) {
            console.error("Price calc error", error);
        } finally {
            setIsCalculating(false);
        }
    };

    const handleBooking = async () => {
        const originId = selectedWarehouseId ?? chinaWarehouse?.id;
        if (!originId) {
            toast.error("China warehouse not available. Please try again later.");
            return;
        }
        const destinationId = lapazWarehouse?.id ?? selectedDestinationWarehouseId;
        if (!destinationId) {
            toast.error("Destination warehouse (Lapaz) is not available.");
            return;
        }
        if (!selectedRateId) {
            toast.error("Please select a shipping rate");
            return;
        }
        if (!carrierTracking.trim()) {
            toast.error("Please enter the carrier tracking number from your supplier");
            return;
        }

        setIsBooking(true);
        try {
            const payload = {
                type: 'freight_forwarding',
                origin_warehouse_id: originId,
                destination_warehouse_id: destinationId,
                carrier_tracking_number: carrierTracking.trim(),
                shipping_method: serviceType,
                shipping_rate_id: selectedRateId || undefined,
                is_cod: isCod,
                weight: weight,
                items_declaration: declaredItems.map((i) => ({
                    description: i.description,
                    value: i.value,
                    quantity: Number(i.quantity) || 1,
                })),
                payment_method: 'wallet',
                notes: notes
            };

            const { data } = await api.post('/logistics/book', payload);
            // Reset fields
            setCarrierTracking('');
            setDeclaredItems([{ description: '', value: '', quantity: '' }]);
            router.push(`/dashboard/logistics/success?id=${data.id}`);
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Booking failed");
        } finally {
            setIsBooking(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="pb-20 md:pb-10">
            <div className="mb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <div className="flex items-center gap-3">
                    <Truck className="h-8 w-8 text-blue-600" />
                    <div>
                        <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 tracking-tight leading-tight">Logistics</h1>
                        <p className="text-xs text-blue-600 flex items-center gap-1.5 mt-0.5">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                            Shipping & freight
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setIsCreating(!isCreating)}
                    className={`min-h-[44px] h-9 px-4 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 shrink-0 ${isCreating ? 'bg-gray-100 text-gray-600' : 'bg-blue-600 text-white hover:bg-gray-900'}`}
                >
                    {isCreating ? 'Cancel' : <><Plus className="h-4 w-4" /> New shipment</>}
                </button>
            </div>

            {isCreating && (
            <div className="max-w-3xl">
                {/* Booking Wizard */}
                <div>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-100">
                            <h2 className="text-lg font-bold text-gray-900 tracking-tight">Create New Shipment</h2>
                            <p className="text-xs text-gray-500 mt-1">Ship from our China warehouse to Ghana. All fields on one page.</p>
                        </div>

                        <div className="p-6 space-y-6 md:max-h-[calc(100vh-14rem)] md:overflow-y-auto">
                            {/* China forwarding address — static template, user details injected */}
                            <section>
                                <h3 className="text-xs font-bold tracking-[0.2em]  text-gray-400 mb-3">Our Warehouse Address</h3>
                                <p className="text-xs font-medium text-gray-500  mb-3">Forwarding Warehouse (China) — Copy and send to your supplier</p>
                                <div className="rounded-xl border-2 border-gray-100 bg-gray-50/50 p-4 flex justify-between items-start gap-4">
                                    <div className="min-w-0 font-mono text-xs text-gray-800 whitespace-pre-wrap break-words">
                                        <p>ThinQ:18320709024</p>
                                        <p>广州市越秀区三元里大道499-523号四楼08号商铺({user?.first_name || 'Customer'})</p>
                                        <p className="mt-2 text-gray-600">Shipping Mark: ({user?.user_identifier || 'TQ-ID'}) +{(user?.phone || 'Phone').replace(/^\+/, '')}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const firstName = user?.first_name || 'Customer';
                                            const customerId = user?.user_identifier || 'TQ-ID';
                                            const phone = (user?.phone || 'Phone').replace(/^\+/, '');
                                            const copyText = `ThinQ:18320709024
广州市越秀区三元里大道499-523号四楼08号商铺(${firstName})

Shipping Mark: (${customerId}) +${phone}`;
                                            navigator.clipboard.writeText(copyText);
                                            toast.success("Address copied");
                                        }}
                                        className="shrink-0 min-h-[44px] h-9 px-3 rounded-lg bg-white border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 flex items-center"
                                    >
                                        Copy
                                    </button>
                                </div>
                            </section>

                            {/* Destination: Local Pick Up at Lapaz Warehouse */}
                            <section>
                                <h3 className="text-xs font-bold tracking-[0.2em]  text-gray-400 mb-3">Destination (Ghana)</h3>
                                {lapazWarehouse ? (
                                    <div
                                        className="rounded-xl border-2 border-gray-100 bg-gray-50/50 p-4 flex items-center justify-between gap-4"
                                    >
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">Local Pick Up at Lapaz Warehouse</p>
                                            <p className="text-xs text-gray-500 mt-0.5">{lapazWarehouse.address}</p>
                                        </div>
                                        <span className="text-xs font-black  text-gray-400">{lapazWarehouse.code}</span>
                                    </div>
                                ) : (
                                    <p className="text-xs text-gray-400">Loading…</p>
                                )}
                            </section>

                            {/* Shipping method + rate */}
                            <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-400  block mb-2">Shipping Method</label>
                                    <div className="flex gap-2">
                                        {(['air_freight', 'sea_freight'] as const).map((m) => (
                                            <button
                                                key={m}
                                                type="button"
                                                onClick={() => setServiceType(m)}
                                                className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold  border-2 transition-all ${serviceType === m ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-100 text-gray-600 hover:border-gray-200'}`}
                                            >
                                                {m === 'air_freight' ? 'Air Freight' : 'Sea Freight'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-400  block mb-2">Select Rate</label>
                                    <select
                                        value={selectedRateId ?? ''}
                                        onChange={(e) => setSelectedRateId(e.target.value || null)}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    >
                                        <option value="">— Select Rate —</option>
                                        {freightRates.map((r) => {
                                            const price = Number(r.price);
                                            const unit = r.type === 'KG' ? '/kg' : r.type === 'UNIT' ? '/unit' : '/CBM';
                                            const sym = rateSymbol(r);
                                            const label = r.duration ? `${r.name} (${r.duration}) - ${sym}${price.toFixed(0)}${unit}` : `${r.name} - ${sym}${price.toFixed(0)}${unit}`;
                                            return <option key={r.id} value={r.rate_id}>{label}</option>;
                                        })}
                                    </select>
                                    {ratesError && (
                                        <p className="text-xs text-amber-600 mt-1.5 font-medium">{ratesError}</p>
                                    )}
                                </div>
                            </section>

                            {/* Tracking + Weight + COD row */}
                            <section className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                <div className="md:col-span-6">
                                    <label className="text-xs font-medium text-gray-500  block mb-2">Tracking number</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={carrierTracking}
                                            onChange={(e) => setCarrierTracking(e.target.value)}
                                            placeholder="Carrier tracking ID"
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 pr-12"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setScannerOpen(true)}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] w-10 h-10 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-gray-500 hover:text-blue-600 hover:border-blue-200 transition-colors"
                                            title="Scan barcode from package"
                                        >
                                            <Camera className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-xs font-medium text-gray-500  block mb-2">Weight (kg)</label>
                                    <input
                                        type="number"
                                        value={weight}
                                        onChange={(e) => setWeight(Number(e.target.value))}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-gray-900"
                                        placeholder="0"
                                    />
                                </div>
                                <div className="md:col-span-4 flex items-end pb-1">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${isCod ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'}`}>
                                            {isCod && <CheckCircle className="h-3 w-3 text-white" />}
                                        </div>
                                        <input type="checkbox" checked={isCod} onChange={(e) => setIsCod(e.target.checked)} className="hidden" />
                                        <span className="text-xs font-medium text-gray-600 ">Cash on Delivery (COD)</span>
                                    </label>
                                </div>
                            </section>

                            {/* Items declaration */}
                            <section className="bg-gray-50/50 rounded-xl border border-gray-100 p-4">
                                <h3 className="text-xs font-bold text-gray-500  mb-3">Items Declaration</h3>
                                <div className="grid grid-cols-12 gap-2 mb-2 text-xs font-black text-gray-400 ">
                                    <div className="col-span-6">Description</div>
                                    <div className="col-span-2">QTY</div>
                                    <div className="col-span-3">Value (¥)</div>
                                </div>
                                <div className="space-y-2">
                                    {declaredItems.map((item, index) => (
                                        <div key={index} className="grid grid-cols-12 gap-2 items-center">
                                            <input
                                                type="text"
                                                placeholder="Unit description"
                                                value={item.description}
                                                onChange={(e) => {
                                                    const n = [...declaredItems];
                                                    n[index].description = e.target.value;
                                                    setDeclaredItems(n);
                                                }}
                                                className="col-span-6 px-3 py-2.5 bg-white border border-gray-100 rounded-lg text-xs font-medium"
                                            />
                                            <input
                                                type="number"
                                                placeholder="0"
                                                min={0}
                                                inputMode="numeric"
                                                value={item.quantity}
                                                onChange={(e) => {
                                                    const n = [...declaredItems];
                                                    const v = e.target.value;
                                                    n[index].quantity = v;
                                                    setDeclaredItems(n);
                                                }}
                                                className="col-span-2 px-3 py-2.5 bg-white border border-gray-100 rounded-lg text-xs font-bold"
                                            />
                                            <div className="col-span-3 flex gap-1">
                                                <input
                                                    type="text"
                                                    placeholder="¥"
                                                    value={item.value}
                                                    onChange={(e) => {
                                                        const n = [...declaredItems];
                                                        n[index].value = e.target.value;
                                                        setDeclaredItems(n);
                                                    }}
                                                    className="flex-1 px-3 py-2.5 bg-white border border-gray-100 rounded-lg text-xs font-bold"
                                                />
                                                {declaredItems.length > 1 && (
                                                    <button type="button" onClick={() => setDeclaredItems(declaredItems.filter((_, i) => i !== index))} className="min-w-[44px] min-h-[44px] w-10 h-10 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50" aria-label="Remove item">×</button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setDeclaredItems([...declaredItems, { description: '', value: '', quantity: '' }])}
                                    className="mt-2 flex items-center gap-1.5 text-xs font-bold text-blue-600 "
                                >
                                    <Plus className="h-3.5 w-3.5" /> Add item
                                </button>
                            </section>

                            {/* Estimated cost summary */}
                            {selectedRate && (
                                <section className="rounded-xl border-2 border-gray-100 bg-gray-50/50 p-4">
                                    <h3 className="text-xs font-bold text-gray-400  mb-3">Estimated shipping cost</h3>
                                    <div className="flex flex-wrap items-baseline justify-between gap-4">
                                        <div>
                                            <p className="text-2xl font-black text-gray-900 tracking-tight">
                                                {estimatedTotal != null ? `${rateSymbol(selectedRate)}${estimatedTotal.toFixed(0)}` : '—'}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {selectedRate.type === 'KG' && (
                                                    <>{selectedRate.name} × {weight} kg = {rateSymbol(selectedRate)}{Number(selectedRate.price).toFixed(0)}/kg</>
                                                )}
                                                {selectedRate.type === 'UNIT' && (
                                                    <>{selectedRate.name} × {Math.max(1, totalItemQuantity)} unit(s) = {rateSymbol(selectedRate)}{Number(selectedRate.price).toFixed(0)}/unit</>
                                                )}
                                                {selectedRate.type === 'CBM' && (
                                                    <>{selectedRate.name} × {weight} (weight proxy) = {rateSymbol(selectedRate)}{Number(selectedRate.price).toFixed(0)}/CBM</>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </section>
                            )}

                            {/* Ship Now */}
                            <div className="pt-2 pb-20 md:pb-4">
                                <button
                                    type="button"
                                    onClick={handleBooking}
                                    disabled={isBooking}
                                    className="w-full md:w-auto min-h-[44px] h-12 px-8 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-blue-600 transition-all disabled:opacity-50 flex items-center justify-center"
                                >
                                    {isBooking ? 'Submitting…' : 'Ship Now'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            )}

            {!isCreating && (
                <div className="space-y-3">
                    <h2 className="text-xs font-semibold text-gray-600 flex items-center gap-2">
                        <HistoryIcon className="h-4 w-4 text-blue-600" />
                        Shipments
                    </h2>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-4 py-4 md:px-8 md:py-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                            <h3 className="text-xs font-bold tracking-wider text-gray-400 flex items-center gap-2">
                                <Package className="h-4 w-4 text-blue-600" />
                                All shipments
                            </h3>
                            <button type="button" onClick={fetchShipments} className="min-w-[44px] min-h-[44px] w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-blue-600" aria-label="Refresh">
                                <RefreshCw className="h-3 w-3" />
                            </button>
                        </div>
                        {historyLoading ? (
                            <div className="p-12 text-center">
                                <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto" />
                            </div>
                        ) : shipments.length === 0 ? (
                            <div className="p-12 md:p-16 text-center">
                                <Package className="h-12 w-12 mx-auto mb-6 text-gray-200" />
                                <p className="text-sm text-gray-500 mb-4">No shipments yet</p>
                                <button
                                    onClick={() => setIsCreating(true)}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
                                >
                                    Create your first shipment
                                </button>
                            </div>
                        ) : (
                            <ul className="divide-y divide-gray-50 max-h-[70vh] overflow-y-auto">
                                {shipments.map((shipment) => (
                                    <li key={shipment.id} className="px-4 py-4 md:px-8 md:py-6 hover:bg-gray-50 transition-all group">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-1">
                                                <p className="text-sm font-bold text-gray-900 tracking-tight group-hover:text-blue-600 transition-colors">
                                                    {shipment.tracking_number || 'PENDING_ID'}
                                                </p>
                                                <div className="flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                                                    <p className="text-sm font-medium text-gray-500">
                                                        {new Date(shipment.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right flex flex-col items-end gap-2">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                                    shipment.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-blue-600'
                                                }`}>
                                                    {shipment.status?.replace(/_/g, ' ') || 'Pending'}
                                                </span>
                                                <p className="text-sm font-bold text-gray-900">₵{Number(shipment.total_price || 0).toFixed(2)}</p>
                                            </div>
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-gray-100">
                                            <div className="flex justify-between items-center relative px-2">
                                                <div className="absolute left-4 right-4 h-0.5 bg-gray-100 top-1/2 -translate-y-1/2" />
                                                {[
                                                    { label: 'Origin', color: 'bg-blue-600' },
                                                    { label: 'Transit', color: shipment.status !== 'booked' ? 'bg-blue-600' : 'bg-gray-200' },
                                                    { label: 'Customs', color: ['in_transit', 'out_for_delivery', 'delivered'].includes(shipment.status) ? 'bg-blue-600' : 'bg-gray-200' },
                                                    { label: 'Final Hub', color: shipment.status === 'delivered' ? 'bg-emerald-500' : 'bg-gray-200' }
                                                ].map((point, idx) => (
                                                    <div key={idx} className="relative z-10 flex flex-col items-center">
                                                        <div className={`w-2.5 h-2.5 rounded-full ${point.color} border-4 border-white shadow-sm`} />
                                                        <span className="text-xs font-medium text-gray-400 mt-2">{point.label}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="mt-4">
                                                <Link
                                                    href={`/dashboard/logistics/${shipment.id}`}
                                                    className="inline-flex items-center gap-2 text-xs font-semibold text-blue-600 hover:text-blue-800"
                                                >
                                                    View details
                                                </Link>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}
            </div>

            <BarcodeScanner
                open={scannerOpen}
                onClose={() => setScannerOpen(false)}
                onScan={(value) => {
                    setCarrierTracking(value);
                    setScannerOpen(false);
                }}
            />
        </DashboardLayout>
    );
}
