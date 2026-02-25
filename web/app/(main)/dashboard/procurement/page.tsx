'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { ShoppingBag, Plus, Link as LinkIcon, ExternalLink, CheckCircle, Package, History as HistoryIcon, Info, Search, AlertCircle, Trash2, ChevronRight, Shield, Globe, Zap, FileDown } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';

interface Request {
    id: number;
    request_number: string;
    description: string;
    specifications?: string;
    status: string;
    created_at: string;
    quotes: any[];
    orders: any[];
}

export default function ProcurementPage() {
    const [requests, setRequests] = useState<Request[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);

    // Form State
    const [description, setDescription] = useState('');
    const [quantity, setQuantity] = useState<number>(1);
    const [specifications, setSpecifications] = useState('');
    const [budget, setBudget] = useState('');
    const [referenceLink, setReferenceLink] = useState(''); // Main link
    const [urgency, setUrgency] = useState('standard');
    const [imageUrls, setImageUrls] = useState<string[]>(['']);

    const handleImageUrlChange = (index: number, value: string) => {
        const newUrls = [...imageUrls];
        newUrls[index] = value;
        setImageUrls(newUrls);
    };

    const addImageUrlField = () => setImageUrls([...imageUrls, '']);
    const removeImageUrl = (index: number) => {
        const newUrls = imageUrls.filter((_, i) => i !== index);
        setImageUrls(newUrls);
    };

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/procurement/user');
            setRequests(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!description) return;

        try {
            // Filter out empty image URLs
            const validImages = imageUrls.filter(url => url.trim() !== '');
            // Combine reference link into images or keep separate? 
            // Model has reference_images (Json). Let's put validImages there.
            // And maybe referenceLink goes to specifications if we want, or just append to specs.
            // But actually, we should probably send referenceLink as part of the description or a specific field if backend supported it.
            // Backend takes `data: any`. We can send `reference_link` if we update schema, but schema has `reference_images`.
            // Let's treat `referenceLink` as the primary "Reference Link" and `imageUrls` as "reference_images".
            // But `ProcurementRequest` schema has `specifications`.

            // Construct payload
            const payload = {
                description,
                quantity: Number(quantity),
                specifications: `${specifications}\n\nReference Link: ${referenceLink}\nUrgency: ${urgency}`,
                budget_range: budget,
                reference_images: validImages.length > 0 ? validImages : undefined
            };

            await api.post('/procurement/request', payload);

            toast.success("Request submitted!");
            setIsCreating(false);
            // Reset form
            setDescription('');
            setQuantity(1);
            setSpecifications('');
            setBudget('');
            setReferenceLink('');
            setUrgency('standard');
            setImageUrls(['']);
            fetchRequests();
        } catch (error) {
            toast.error("Failed to submit request");
        }
    };

    const handleAcceptQuote = async (quoteId: number) => {
        if (!confirm("Are you sure? This will deduct funds from your wallet.")) return;
        try {
            await api.post('/procurement/accept-quote', { quoteId });
            toast.success("Order placed successfully!");
            fetchRequests();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Payment failed");
        }
    };

    return (
        <DashboardLayout>
            <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div className="flex items-center gap-3">
                    <ShoppingBag className="h-8 w-8 text-blue-600" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight leading-tight">Procurement</h1>
                        <p className="text-xs text-blue-600 flex items-center gap-1.5 mt-0.5">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                            Sourcing available
                        </p>
                    </div>
                </div>
                <div className="flex flex-col md:items-end gap-2">
                    <p className="text-gray-500 text-sm max-w-sm md:text-right">Request items from China; we source and quote for you.</p>
                    <button
                        onClick={() => setIsCreating(!isCreating)}
                        className={`h-10 px-5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${isCreating ? 'bg-gray-100 text-gray-600' : 'bg-blue-600 text-white hover:bg-gray-900'}`}
                    >
                        {isCreating ? 'Cancel' : <><Plus className="h-4 w-4" /> New request</>}
                    </button>
                </div>
            </div>

            {isCreating && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:p-8 mb-6 animate-fade-in-down">
                    <h3 className="text-xs font-semibold  text-gray-500 mb-6 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
                            <Plus className="h-3.5 w-3.5 text-white" />
                        </div>
                        New request
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-medium text-gray-500  ml-1 mb-1.5 block">Product</label>
                                    <input
                                        type="text"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="block w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium text-gray-900 focus:bg-white transition-all outline-none"
                                        placeholder="e.g. MacBook Pro M3"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-medium text-gray-500  ml-1 mb-1.5 block">Quantity</label>
                                    <input
                                        type="number"
                                        value={quantity}
                                        onChange={(e) => setQuantity(Number(e.target.value))}
                                        className="block w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium text-gray-900 focus:bg-white transition-all outline-none"
                                        min="1"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-medium text-gray-500  ml-1 mb-1.5 block">Reference URL</label>
                                    <div className="flex items-center">
                                        <div className="h-10 px-3 bg-gray-100 border border-gray-100 rounded-l-xl flex items-center text-gray-400">
                                            <LinkIcon className="h-4 w-4" />
                                        </div>
                                        <input
                                            type="url"
                                            value={referenceLink}
                                            onChange={(e) => setReferenceLink(e.target.value)}
                                            className="flex-1 min-w-0 h-10 px-4 bg-gray-50 border border-l-0 border-gray-100 rounded-r-xl text-sm font-medium text-gray-900 focus:bg-white transition-all outline-none"
                                            placeholder="https://..."
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-medium text-gray-500  ml-1 mb-1.5 block">Budget (GHS)</label>
                                    <input
                                        type="text"
                                        value={budget}
                                        onChange={(e) => setBudget(e.target.value)}
                                        className="block w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium text-gray-900 focus:bg-white transition-all outline-none"
                                        placeholder="e.g. ₵15,000 – ₵18,000"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-medium text-gray-500  ml-1 mb-1.5 block">Specifications</label>
                            <textarea
                                value={specifications}
                                onChange={(e) => setSpecifications(e.target.value)}
                                className="block w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium text-gray-900 focus:bg-white transition-all outline-none min-h-[80px]"
                                placeholder="Specs, color, etc."
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-medium text-blue-600  ml-1 mb-2 block">Priority</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['standard', 'urgent', 'flexible'].map((u) => (
                                            <button
                                                key={u}
                                                type="button"
                                                onClick={() => setUrgency(u)}
                                                className={`py-2.5 rounded-xl text-[10px] font-semibold  border-2 transition-all ${urgency === u ? 'bg-gray-900 border-gray-900 text-white' : 'bg-white border-gray-100 text-gray-500 hover:border-gray-200'}`}
                                            >
                                                {u}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-medium text-blue-600  ml-1 mb-2 block">Reference images</label>
                                    <div className="space-y-2">
                                        {imageUrls.map((url, index) => (
                                            <div key={index} className="relative">
                                                <input
                                                    type="url"
                                                    value={url}
                                                    onChange={(e) => handleImageUrlChange(index, e.target.value)}
                                                    className="block w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-medium text-gray-900 focus:bg-white outline-none pr-10"
                                                    placeholder="Image URL (JPG/PNG)"
                                                />
                                                {index > 0 && (
                                                    <button type="button" onClick={() => removeImageUrl(index)} className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 bg-red-50 text-red-500 rounded flex items-center justify-center hover:bg-red-500 hover:text-white transition-all">
                                                        <Trash2 className="h-3 w-3" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={addImageUrlField}
                                            className="w-full py-2.5 bg-blue-50 border border-dashed border-blue-200 rounded-xl text-[10px] font-semibold text-blue-600  hover:bg-blue-100 transition-all flex items-center justify-center gap-2"
                                        >
                                            <Plus className="h-3 w-3" /> Add image
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shadow-sm">
                                        <Info className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <h4 className="text-sm font-semibold text-gray-900">How it works</h4>
                                </div>
                                <ul className="space-y-3">
                                    {[
                                        { icon: Shield, text: 'Verified suppliers only.' },
                                        { icon: Globe, text: 'Sourcing from China supply chain.' },
                                        { icon: Zap, text: 'Wallet balance checked before quote.' }
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-start gap-3">
                                            <item.icon className="h-3.5 w-3.5 text-blue-500 mt-0.5 shrink-0" />
                                            <p className="text-xs text-gray-500 leading-relaxed">{item.text}</p>
                                        </li>
                                    ))}
                                </ul>
                                <div className="mt-4 p-3 bg-white rounded-xl border border-gray-100 border-l-4 border-l-blue-600">
                                    <p className="text-[10px] font-semibold text-gray-700 mb-1">Note</p>
                                    <p className="text-[10px] text-gray-500 leading-relaxed">Budget is indicative; final quotes may vary by ±5%.</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <button
                                type="button"
                                onClick={() => setIsCreating(false)}
                                className="h-10 px-5 rounded-xl font-semibold text-sm text-gray-500 hover:bg-gray-50 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="h-10 px-6 bg-gray-900 text-white rounded-xl font-semibold text-sm hover:bg-blue-600 transition-all"
                            >
                                Submit request
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xs font-semibold  text-gray-500 flex items-center">
                        <HistoryIcon className="h-4 w-4 mr-2 text-blue-600" />
                        Requests
                    </h2>
                    <button type="button" className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-blue-600">
                        <Search className="h-3.5 w-3.5" />
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {loading && requests.length === 0 ? (
                        <div className="py-12 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
                            <div className="animate-pulse flex flex-col items-center">
                                <div className="w-10 h-10 bg-gray-100 rounded-full mb-3" />
                                <p className="text-xs text-gray-400">Loading...</p>
                            </div>
                        </div>
                    ) : requests.length === 0 ? (
                        <div className="py-12 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
                            <ShoppingBag className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                            <p className="text-xs text-gray-400">No requests yet</p>
                        </div>
                    ) : (
                        requests.map((req) => (
                            <div key={req.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all p-5 lg:p-6 group relative overflow-hidden">
                                <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-5 relative z-10">
                                    <div className="space-y-3 flex-1">
                                        <div className="flex flex-wrap items-center gap-3">
                                            <p className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors leading-tight">{req.description}</p>
                                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black  ${req.status === 'submitted' ? 'bg-blue-50 text-blue-600 shadow-sm shadow-blue-50' :
                                                req.status === 'quote_provided' ? 'bg-orange-50 text-orange-600 shadow-sm shadow-orange-50' :
                                                    req.status === 'accepted' ? 'bg-green-50 text-green-700 shadow-sm shadow-green-50' :
                                                        'bg-gray-50 text-gray-400'
                                                }`}>
                                                {req.status.replace('_', ' ')}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-6">
                                            <div className="flex items-center text-[10px] font-black text-gray-400  font-mono">
                                                <Package className="h-3 w-3 mr-2" /> {req.request_number}
                                            </div>
                                            <div className="flex items-center text-[10px] font-black text-gray-400  font-mono">
                                                <HistoryIcon className="h-3 w-3 mr-2 font-sans" /> {new Date(req.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </div>
                                            {req.orders && req.orders.length > 0 && (
                                                <div className="flex items-center text-[10px] font-black text-green-600 ">
                                                    <CheckCircle className="h-3 w-3 mr-2" /> Linked: {req.orders[0].order_number}
                                                </div>
                                            )}
                                            <Link
                                                href={`/dashboard/procurement/${req.id}/response`}
                                                className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-blue-600 hover:text-blue-800"
                                            >
                                                <FileDown className="h-3 w-3" /> Download response
                                            </Link>
                                        </div>
                                    </div>

                                    {/* Quote Panel */}
                                    {req.quotes && req.quotes.length > 0 && req.status !== 'accepted' ? (
                                        <div className="bg-gray-900 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-4 border border-gray-800">
                                            <div className="text-center sm:text-left">
                                                <p className="text-[9px] font-semibold text-blue-300  mb-1">Quote</p>
                                                <p className="text-xl font-bold text-white">₵{Number(req.quotes[0].quote_amount).toFixed(2)}</p>
                                            </div>
                                            <button
                                                onClick={() => handleAcceptQuote(req.quotes[0].id)}
                                                className="w-full sm:w-auto h-10 px-5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-white hover:text-gray-900 transition-all flex items-center justify-center gap-2"
                                            >
                                                Pay <ChevronRight className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    ) : req.status === 'accepted' ? (
                                        <div className="bg-green-50 px-4 py-3 rounded-xl border border-green-100">
                                            <p className="text-[10px] font-semibold text-green-600  mb-0.5">Status</p>
                                            <p className="text-xs font-medium text-green-900">In progress</p>
                                        </div>
                                    ) : (
                                        <div className="bg-gray-50 px-4 py-3 rounded-xl border border-gray-100">
                                            <p className="text-[10px] font-semibold text-gray-500  mb-0.5">Status</p>
                                            <p className="text-xs font-medium text-gray-700">Awaiting quote</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
