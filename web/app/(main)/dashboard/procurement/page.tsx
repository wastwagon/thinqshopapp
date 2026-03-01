'use client';

import { useState, useEffect, useRef } from 'react';
import api from '@/lib/axios';
import { getMediaUrl } from '@/lib/media';
import { ShoppingBag, Plus, Link as LinkIcon, CheckCircle, History as HistoryIcon, Info, Trash2, ChevronRight, Shield, Globe, Zap, FileDown, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useRouter } from 'next/navigation';

interface Request {
    id: number;
    request_number: string;
    request_type?: string;
    description: string;
    specifications?: string;
    status: string;
    created_at: string;
    quotes: any[];
    orders: any[];
}

export default function ProcurementPage() {
    const router = useRouter();
    const [requests, setRequests] = useState<Request[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);

    const [requestType, setRequestType] = useState<'sourcing' | 'print'>('sourcing');
    const [description, setDescription] = useState('');
    const [quantity, setQuantity] = useState<number>(1);
    const [specifications, setSpecifications] = useState('');
    const [budget, setBudget] = useState('');
    const [referenceLink, setReferenceLink] = useState('');
    const [urgency, setUrgency] = useState('standard');
    const [uploadedImages, setUploadedImages] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files?.length) return;
        setUploading(true);
        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                if (!file.type.startsWith('image/')) {
                    toast.error(`${file.name} is not an image`);
                    continue;
                }
                const formData = new FormData();
                formData.append('file', file);
                const { data } = await api.post('/procurement/upload-image', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                if (data?.url) {
                    setUploadedImages((prev) => [...prev, data.url]);
                }
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Upload failed');
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    const removeImage = (index: number) => {
        setUploadedImages((prev) => prev.filter((_, i) => i !== index));
    };

    const handleAcceptQuote = async (quoteId: number) => {
        if (!confirm('Are you sure? This will deduct funds from your wallet.')) return;
        try {
            await api.post('/procurement/accept-quote', { quoteId });
            toast.success('Order placed successfully!');
            fetchRequests();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Payment failed');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!description.trim()) return;

        if (requestType === 'sourcing' && uploadedImages.length === 0) {
            toast.error('Upload at least one product image for sourcing');
            return;
        }
        if (requestType === 'print' && uploadedImages.length === 0) {
            toast.error('Upload at least one design file (logo, label, etc.)');
            return;
        }

        try {
            const specsCombined = [
                specifications.trim(),
                referenceLink.trim() && `Reference: ${referenceLink.trim()}`,
                `Priority: ${urgency}`,
            ].filter(Boolean).join('\n');

            const payload = {
                request_type: requestType,
                description: description.trim(),
                quantity: Number(quantity),
                specifications: specsCombined || undefined,
                budget_range: budget.trim() || undefined,
                reference_link: referenceLink.trim() || undefined,
                reference_images: uploadedImages.length > 0 ? uploadedImages : undefined,
            };

            const { data } = await api.post('/procurement/request', payload);
            setIsCreating(false);
            setDescription('');
            setQuantity(1);
            setSpecifications('');
            setBudget('');
            setReferenceLink('');
            setUrgency('standard');
            setUploadedImages([]);
            router.push(`/dashboard/procurement/success?id=${data.id}`);
            fetchRequests();
        } catch (error) {
            toast.error('Failed to submit request');
        }
    };

    return (
        <DashboardLayout>
            <div className="pb-20 md:pb-10">
            <div className="mb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <div className="flex items-center gap-2">
                    <ShoppingBag className="h-8 w-8 text-blue-600" />
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Procurement</h1>
                        <p className="text-xs text-blue-600 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                            Sourcing &amp; print
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setIsCreating(!isCreating)}
                    className={`h-9 px-4 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 ${isCreating ? 'bg-gray-100 text-gray-600' : 'bg-blue-600 text-white hover:bg-gray-900'}`}
                >
                    {isCreating ? 'Cancel' : <><Plus className="h-4 w-4" /> New request</>}
                </button>
            </div>

            {isCreating && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-5 mb-4 md:mb-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                        <Plus className="h-4 w-4 text-blue-600" />
                        New request
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-medium text-gray-600 mb-1.5 block">Request type</label>
                                <div className="flex gap-2">
                                    {[
                                        { id: 'sourcing' as const, label: 'Find & buy product', desc: 'Upload product images; we find and purchase' },
                                        { id: 'print' as const, label: 'Print design', desc: 'Logos, labels, samples; we print in China & deliver' }
                                    ].map((t) => (
                                        <button
                                            key={t.id}
                                            type="button"
                                            onClick={() => setRequestType(t.id)}
                                            className={`flex-1 p-3 rounded-lg text-left border-2 transition-all ${requestType === t.id ? 'border-blue-600 bg-blue-50' : 'border-gray-100 hover:border-gray-200'}`}
                                        >
                                            <span className={`text-xs font-semibold block ${requestType === t.id ? 'text-blue-600' : 'text-gray-600'}`}>{t.label}</span>
                                            <span className="text-[10px] text-gray-500 mt-0.5 block">{t.desc}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="text-xs font-medium text-gray-600 mb-1 block">Product / Item</label>
                                <input
                                    type="text"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="block w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-lg text-sm font-medium text-gray-900 focus:bg-white outline-none"
                                    placeholder={requestType === 'sourcing' ? 'e.g. PS5 controller' : 'e.g. Custom labels'}
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-600 mb-1 block">Quantity</label>
                                <input
                                    type="number"
                                    value={quantity}
                                    onChange={(e) => setQuantity(Number(e.target.value))}
                                    className="block w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-lg text-sm font-medium text-gray-900 focus:bg-white outline-none"
                                    min="1"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-600 mb-1 block">Budget (GHS)</label>
                                <input
                                    type="text"
                                    value={budget}
                                    onChange={(e) => setBudget(e.target.value)}
                                    className="block w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-lg text-sm font-medium text-gray-900 focus:bg-white outline-none"
                                    placeholder="e.g. 450"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-600 mb-1 block">Reference URL</label>
                                <div className="flex">
                                    <div className="h-9 px-2.5 bg-gray-100 border border-gray-100 rounded-l-lg flex items-center text-gray-400">
                                        <LinkIcon className="h-3.5 w-3.5" />
                                    </div>
                                    <input
                                        type="url"
                                        value={referenceLink}
                                        onChange={(e) => setReferenceLink(e.target.value)}
                                        className="flex-1 min-w-0 h-9 px-3 bg-gray-50 border border-l-0 border-gray-100 rounded-r-lg text-xs font-medium text-gray-900 focus:bg-white outline-none"
                                        placeholder="Optional product link"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-medium text-gray-600 mb-1 block">Specifications</label>
                            <textarea
                                value={specifications}
                                onChange={(e) => setSpecifications(e.target.value)}
                                className="block w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-lg text-sm font-medium text-gray-900 focus:bg-white outline-none min-h-[60px]"
                                placeholder="Color, size, material, etc."
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <label className="text-xs font-medium text-gray-600 mb-1.5 block">
                                    {requestType === 'sourcing' ? 'Product images' : 'Design files'}{' '}
                                    <span className="text-gray-400">(JPG, PNG, WebP)</span>
                                </label>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,image/gif"
                                    multiple
                                    onChange={handleFileUpload}
                                    className="hidden"
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                    className="w-full py-3 border-2 border-dashed border-gray-200 rounded-lg text-xs font-medium text-gray-500 hover:border-blue-300 hover:bg-blue-50/50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    <Upload className="h-4 w-4" />
                                    {uploading ? 'Uploading…' : 'Upload images'}
                                </button>
                                <div className="min-h-[120px] rounded-lg border-2 border-dashed border-gray-100 bg-gray-50/50 p-3">
                                    <p className="text-[10px] font-semibold text-gray-500 mb-2">
                                        {uploadedImages.length > 0
                                            ? `Uploaded images (${uploadedImages.length})`
                                            : 'Image preview — uploads will appear here'}
                                    </p>
                                    {uploadedImages.length > 0 ? (
                                        <div className="flex flex-wrap gap-3">
                                            {uploadedImages.map((url, i) => (
                                                <div key={i} className="relative group">
                                                    <img
                                                        src={getMediaUrl(url)}
                                                        alt={`Upload ${i + 1}`}
                                                        className="w-20 h-20 rounded-lg object-cover border-2 border-white shadow-sm"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="%239ca3af" stroke-width="1.5"%3E%3Crect x="3" y="3" width="18" height="18" rx="2"/%3E%3Ccircle cx="8.5" cy="8.5" r="1.5"/%3E%3Cpath d="M21 15l-5-5L5 21"/%3E%3C/svg%3E';
                                                        }}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeImage(i)}
                                                        className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 transition-colors"
                                                        title="Remove image"
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center py-6 text-gray-400">
                                            <div className="text-center">
                                                <Upload className="h-8 w-8 mx-auto mb-1 opacity-50" />
                                                <p className="text-[10px]">No images yet</p>
                                                <p className="text-[9px]">Click above to upload</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <div>
                                    <label className="text-xs font-medium text-gray-600 mb-1 block">Priority</label>
                                    <div className="flex gap-2">
                                        {['standard', 'urgent', 'flexible'].map((u) => (
                                            <button
                                                key={u}
                                                type="button"
                                                onClick={() => setUrgency(u)}
                                                className={`py-2 px-3 rounded-lg text-xs font-semibold border-2 transition-all ${urgency === u ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-100 text-gray-500 hover:border-gray-200'}`}
                                            >
                                                {u}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Info className="h-4 w-4 text-blue-600" />
                                        <span className="text-xs font-semibold text-gray-700">How it works</span>
                                    </div>
                                    <ul className="space-y-1 text-[10px] text-gray-500">
                                        <li className="flex items-center gap-2"><Shield className="h-3 w-3 text-blue-500" /> Verified suppliers</li>
                                        <li className="flex items-center gap-2"><Globe className="h-3 w-3 text-blue-500" /> China supply chain</li>
                                        <li className="flex items-center gap-2"><Zap className="h-3 w-3 text-blue-500" /> Wallet checked before quote</li>
                                    </ul>
                                    <p className="text-[10px] text-gray-400 mt-2">Budget indicative; quotes may vary ±5%.</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <button className="h-9 px-4 rounded-lg font-semibold text-sm text-gray-500 hover:bg-gray-50" type="button" onClick={() => setIsCreating(false)}>
                                Cancel
                            </button>
                            <button className="h-9 px-5 bg-gray-900 text-white rounded-lg font-semibold text-sm hover:bg-blue-600" type="submit">
                                Submit request
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {!isCreating && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xs font-semibold text-gray-600 flex items-center gap-2">
                            <HistoryIcon className="h-4 w-4 text-blue-600" />
                            Requests
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                        {loading && requests.length === 0 ? (
                            <div className="py-10 text-center bg-white rounded-xl border border-gray-100">
                                <div className="animate-pulse flex flex-col items-center">
                                    <div className="w-8 h-8 bg-gray-100 rounded-full mb-2" />
                                    <p className="text-xs text-gray-400">Loading...</p>
                                </div>
                            </div>
                        ) : requests.length === 0 ? (
                            <div className="py-10 text-center bg-white rounded-xl border border-gray-100">
                                <ShoppingBag className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                                <p className="text-xs text-gray-400">No requests yet</p>
                            </div>
                        ) : (
                            requests.map((req) => (
                                <div key={req.id} className="bg-white rounded-xl border border-gray-100 hover:shadow-md transition-all p-4 group">
                                    <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
                                        <div className="space-y-2 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{req.description}</p>
                                                {req.request_type && (
                                                    <span className="text-[9px] font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                                                        {req.request_type === 'print' ? 'Print' : 'Sourcing'}
                                                    </span>
                                                )}
                                                <span className={`px-3 py-1 rounded-full text-[9px] font-black ${req.status === 'submitted' ? 'bg-blue-50 text-blue-600' : req.status === 'quote_provided' ? 'bg-orange-50 text-orange-600' : req.status === 'accepted' ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-400'}`}>
                                                    {req.status.replace('_', ' ')}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-4 text-[10px] text-gray-500">
                                                <span className="font-mono">{req.request_number}</span>
                                                <span>{new Date(req.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                {req.orders?.length > 0 && (
                                                    <span className="text-green-600 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> {req.orders[0].order_number}</span>
                                                )}
                                                <Link href={`/dashboard/procurement/${req.id}/response`} className="text-blue-600 hover:text-blue-800 flex items-center gap-1">
                                                    <FileDown className="h-3 w-3" /> Download response
                                                </Link>
                                            </div>
                                        </div>
                                        {req.quotes?.length > 0 && req.status !== 'accepted' ? (
                                            <div className="bg-gray-900 rounded-lg p-3 flex items-center gap-4">
                                                <div>
                                                    <p className="text-[9px] text-blue-300">Quote</p>
                                                    <p className="text-lg font-bold text-white">₵{Number(req.quotes[0].quote_amount).toFixed(2)}</p>
                                                </div>
                                                <button
                                                    onClick={() => handleAcceptQuote(req.quotes[0].id)}
                                                    className="h-9 px-4 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-white hover:text-gray-900 flex items-center gap-1"
                                                >
                                                    Pay <ChevronRight className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        ) : req.status === 'accepted' ? (
                                            <div className="bg-green-50 px-3 py-2 rounded-lg border border-green-100">
                                                <p className="text-[9px] font-semibold text-green-600">Status</p>
                                                <p className="text-xs font-medium text-green-900">In progress</p>
                                            </div>
                                        ) : (
                                            <div className="bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                                                <p className="text-[9px] font-semibold text-gray-500">Status</p>
                                                <p className="text-xs font-medium text-gray-700">Awaiting quote</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
            </div>
        </DashboardLayout>
    );
}
