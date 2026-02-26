'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { Truck, Info, CheckCircle, Plus, Copy, Camera } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

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
    is_active: boolean;
    sort_order: number;
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

    // Ship for me only (no local courier)
    const [bookingType] = useState<'freight'>('freight');
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | null>(null);
    const [selectedDestinationWarehouseId, setSelectedDestinationWarehouseId] = useState<number | null>(null);
    const [carrierTracking, setCarrierTracking] = useState('');
    const [isCod, setIsCod] = useState(false);
    const [declaredItems, setDeclaredItems] = useState([{ description: '', value: '', quantity: 1 }]);
    const [freightRates, setFreightRates] = useState<FreightRate[]>([]);
    const [selectedRateId, setSelectedRateId] = useState<string | null>(null);

    const chinaWarehouses = warehouses.filter(w => w.country === 'China');
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

    useEffect(() => {
        const fetchInitial = async () => {
            try {
                const [zonesRes, warehousesRes] = await Promise.all([
                    api.get('/logistics/zones'),
                    api.get('/logistics/warehouses')
                ]);
                setZones(zonesRes.data);
                setWarehouses(warehousesRes.data);

                const initialChina = warehousesRes.data.find((w: any) => w.country === 'China');
                const initialGhana = warehousesRes.data.find((w: any) => w.country === 'Ghana' && (String(w.name || '').toLowerCase().includes('lapaz') || String(w.code || '').toLowerCase().includes('lapaz')));

                if (initialChina) setSelectedWarehouseId(initialChina.id);
                if (initialGhana) setSelectedDestinationWarehouseId(initialGhana.id);

                if (zonesRes.data.length > 0) setZoneId(zonesRes.data[0].id.toString());
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
        if (!selectedWarehouseId) {
            toast.error("Select a forwarding warehouse (China)");
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
                origin_warehouse_id: selectedWarehouseId,
                destination_warehouse_id: destinationId,
                carrier_tracking_number: carrierTracking.trim(),
                shipping_method: serviceType,
                shipping_rate_id: selectedRateId || undefined,
                is_cod: isCod,
                weight: weight,
                items_declaration: declaredItems,
                payment_method: 'wallet',
                notes: notes
            };

            const { data } = await api.post('/logistics/book', payload);
            // Reset fields
            setCarrierTracking('');
            setDeclaredItems([{ description: '', value: '', quantity: 1 }]);
            router.push(`/dashboard/logistics/success?id=${data.id}`);
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Booking failed");
        } finally {
            setIsBooking(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div className="flex items-center gap-3">
                    <Truck className="h-8 w-8 text-blue-600" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight leading-tight">Logistics</h1>
                        <p className="text-xs text-blue-600 flex items-center gap-1.5 mt-0.5">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                            Shipping & freight
                        </p>
                    </div>
                </div>
                <p className="text-gray-500 text-sm max-w-sm md:text-right">Local delivery and freight from China to Ghana.</p>
            </div>

            <div className="max-w-3xl">
                {/* Booking Wizard */}
                <div>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-100">
                            <h2 className="text-lg font-bold text-gray-900 tracking-tight">Create New Shipment</h2>
                            <p className="text-xs text-gray-500 mt-1">Ship from our China warehouse to Ghana. All fields on one page.</p>
                        </div>

                        <div className="p-6 space-y-6 md:max-h-[calc(100vh-14rem)] md:overflow-y-auto">
                            {/* Single China forwarding address (no duplication) */}
                            <section>
                                <h3 className="text-[10px] font-bold tracking-[0.2em]  text-gray-400 mb-3">Our Warehouse Address</h3>
                                <p className="text-[10px] font-medium text-gray-500  mb-3">Forwarding Warehouse (China)</p>
                                {(() => {
                                    const w = chinaWarehouses.length > 0 ? chinaWarehouses[0] : null;
                                    if (!w) return <p className="text-xs text-amber-600">No China warehouse configured. Run database seed or add one in Admin.</p>;
                                    return (
                                        <div className="rounded-xl border-2 border-gray-100 bg-gray-50/50 p-4 flex justify-between items-start gap-4">
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-black  text-gray-400">{w.code}</p>
                                                <p className="text-sm font-bold text-gray-900">{w.name}</p>
                                                <p className="text-xs text-gray-500 mt-1">{w.address}</p>
                                                <p className="text-[10px] text-gray-400 mt-1">Receiver: ThinQ ({user?.user_identifier || 'TQ-ID'}) · {w.phone}</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const tqId = user?.user_identifier || 'TQ-ID-PENDING';
                                                    const shippingMark = `(${user?.first_name || 'USER'})+${user?.phone || 'PHONE-PENDING'}`;
                                                    const copyText = `${w.name}\nPhone: ${w.phone}\nAddress: ${w.address}\nUser ID: ${tqId}\nShipping Mark: ${shippingMark}\nReceiver: ThinQ (${tqId})`;
                                                    navigator.clipboard.writeText(copyText);
                                                    toast.success("Address copied");
                                                }}
                                                className="shrink-0 h-8 px-3 rounded-lg bg-white border border-gray-200 text-[10px] font-bold  text-gray-600 hover:bg-gray-50"
                                            >
                                                Copy
                                            </button>
                                        </div>
                                    );
                                })()}
                            </section>

                            {/* Destination: Local Pick Up at Lapaz Warehouse */}
                            <section>
                                <h3 className="text-[10px] font-bold tracking-[0.2em]  text-gray-400 mb-3">Destination (Ghana)</h3>
                                {lapazWarehouse ? (
                                    <div
                                        className="rounded-xl border-2 border-gray-100 bg-gray-50/50 p-4 flex items-center justify-between gap-4"
                                    >
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">Local Pick Up at Lapaz Warehouse</p>
                                            <p className="text-xs text-gray-500 mt-0.5">{lapazWarehouse.address}</p>
                                        </div>
                                        <span className="text-[10px] font-black  text-gray-400">{lapazWarehouse.code}</span>
                                    </div>
                                ) : (
                                    <p className="text-xs text-gray-400">Loading…</p>
                                )}
                            </section>

                            {/* Shipping method + rate */}
                            <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400  block mb-2">Shipping Method</label>
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
                                    <label className="text-[10px] font-bold text-gray-400  block mb-2">Select Rate</label>
                                    <select
                                        value={selectedRateId ?? ''}
                                        onChange={(e) => setSelectedRateId(e.target.value || null)}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    >
                                        <option value="">— Select Rate —</option>
                                        {freightRates.map((r) => {
                                            const price = Number(r.price);
                                            const unit = r.type === 'KG' ? '/KG' : r.type === 'UNIT' ? '/UNIT' : '/CBM';
                                            const label = r.duration ? `${r.name} (${r.duration}) - $${price.toFixed(2)}${unit}` : `${r.name} - $${price.toFixed(2)}${unit}`;
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
                                    <label className="text-[10px] font-medium text-gray-500  block mb-2">Tracking number</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={carrierTracking}
                                            onChange={(e) => setCarrierTracking(e.target.value)}
                                            placeholder="Carrier tracking ID"
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 pr-12"
                                        />
                                        <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-gray-400" title="Scan Barcode">
                                            <Camera className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-[10px] font-medium text-gray-500  block mb-2">Weight (kg)</label>
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
                                <h3 className="text-[10px] font-bold text-gray-500  mb-3">Items Declaration</h3>
                                <div className="grid grid-cols-12 gap-2 mb-2 text-[9px] font-black text-gray-400 ">
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
                                                placeholder="QTY"
                                                value={item.quantity}
                                                onChange={(e) => {
                                                    const n = [...declaredItems];
                                                    n[index].quantity = Number(e.target.value);
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
                                                    <button type="button" onClick={() => setDeclaredItems(declaredItems.filter((_, i) => i !== index))} className="w-8 h-8 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50">×</button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setDeclaredItems([...declaredItems, { description: '', value: '', quantity: 1 }])}
                                    className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-blue-600 "
                                >
                                    <Plus className="h-3.5 w-3.5" /> Add item
                                </button>
                            </section>

                            {/* Estimated cost summary */}
                            {selectedRate && (
                                <section className="rounded-xl border-2 border-gray-100 bg-gray-50/50 p-4">
                                    <h3 className="text-[10px] font-bold text-gray-400  mb-3">Estimated shipping cost</h3>
                                    <div className="flex flex-wrap items-baseline justify-between gap-4">
                                        <div>
                                            <p className="text-2xl font-black text-gray-900 tracking-tight">
                                                {estimatedTotal != null ? `$${estimatedTotal.toFixed(2)}` : '—'}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {selectedRate.type === 'KG' && (
                                                    <>{selectedRate.name} × {weight} kg = ${Number(selectedRate.price).toFixed(2)}/kg</>
                                                )}
                                                {selectedRate.type === 'UNIT' && (
                                                    <>{selectedRate.name} × {Math.max(1, totalItemQuantity)} unit(s) = ${Number(selectedRate.price).toFixed(2)}/unit</>
                                                )}
                                                {selectedRate.type === 'CBM' && (
                                                    <>{selectedRate.name} × {weight} (weight proxy) = ${Number(selectedRate.price).toFixed(2)}/CBM</>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </section>
                            )}

                            {/* Notice + Ship Now */}
                            <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 flex flex-wrap items-center justify-between gap-4">
                                <div className="flex gap-3">
                                    <Info className="h-5 w-5 text-blue-600 shrink-0" />
                                    <p className="text-xs text-blue-800/90 font-medium">Final transit fees are calculated upon arrival at our CN repository. Ensure your wallet has sufficient liquidity.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleBooking}
                                    disabled={isBooking}
                                    className="h-12 px-8 bg-gray-900 text-white rounded-xl font-bold text-sm  hover:bg-blue-600 transition-all disabled:opacity-50 shrink-0"
                                >
                                    {isBooking ? 'Submitting…' : 'Ship Now'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
