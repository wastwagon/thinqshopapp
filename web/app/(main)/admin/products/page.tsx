'use client';

import React, { useEffect, useState, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
    Search,
    Plus,
    Package,
    Edit3,
    Trash2,
    Eye,
    Upload,
    ImageIcon,
    X,
    Loader2,
    FileText,
    CheckCircle,
    AlertTriangle,
    Layers
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/axios';
import { getMediaUrl } from '@/lib/media';
import MediaPickerModal from '@/components/admin/MediaPickerModal';

export default function AdminProducts() {
    const [products, setProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<{ id: number; name: string; slug: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<any>(null);
    const [formData, setFormData] = useState({
        name: '',
        category_id: '',
        price: '',
        compare_price: '',
        stock_quantity: '',
        is_featured: false,
        featuredImage: '',
        gallery: [] as string[],
        wholesale_min_quantity: '',
        wholesale_discount_pct: '',
        short_description: '',
        description: '',
        specifications_json: '', // JSON text for specs (e.g. {"Screen": "14\"", "RAM": "8GB"})
        variants: [] as { variant_type: string; variant_value: string; sku?: string; price_adjust?: number; stock_quantity?: number }[],
    });
    const [variationOptions, setVariationOptions] = useState<{ id: number; name: string; slug: string; values: { id: number; value: string }[] }[]>([]);
    const [mediaPickerOpen, setMediaPickerOpen] = useState<'featured' | 'gallery' | null>(null);
    const [uploadingFeatured, setUploadingFeatured] = useState(false);
    const [uploadingGallery, setUploadingGallery] = useState(false);
    const featuredInputRef = useRef<HTMLInputElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, []);

    const fetchVariationOptions = async () => {
        try {
            const { data } = await api.get('/variations/options');
            setVariationOptions(Array.isArray(data) ? data : []);
        } catch {
            setVariationOptions([]);
        }
    };

    const fetchProducts = async () => {
        try {
            const { data } = await api.get('/products/admin/list');
            setProducts(Array.isArray(data) ? data : data?.data ?? []);
        } catch {
            toast.error('Failed to fetch products');
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const { data } = await api.get('/products/categories');
            setCategories(Array.isArray(data) ? data : []);
        } catch {
            setCategories([]);
        }
    };

    const handleOpenModal = (product: any = null) => {
        fetchVariationOptions();
        if (product) {
            setEditingProduct(product);
            const catName = product.category?.name ?? product.category;
            const catId = product.category_id ?? categories.find(c => c.name === catName)?.id ?? '';
            const imgs = Array.isArray(product.images) ? product.images.filter(Boolean) : product.image ? [product.image] : [];
            const variants = (product.variants || []).map((v: any) => ({
                variant_type: v.variant_type ?? '',
                variant_value: v.variant_value ?? '',
                sku: v.sku ?? undefined,
                price_adjust: v.price_adjust != null ? Number(v.price_adjust) : undefined,
                stock_quantity: v.stock_quantity != null ? Number(v.stock_quantity) : undefined,
            }));
            setFormData({
                name: product.name ?? '',
                category_id: String(catId),
                price: String(Number(product.price ?? 0)),
                compare_price: product.compare_price != null ? String(Number(product.compare_price)) : '',
                stock_quantity: String(Number(product.stock_quantity ?? product.stock ?? 10)),
                is_featured: !!product.is_featured,
                featuredImage: imgs[0] ?? '',
                gallery: imgs.slice(1),
                wholesale_min_quantity: String(product.wholesale_min_quantity ?? ''),
                wholesale_discount_pct: String(product.wholesale_discount_pct ?? ''),
                short_description: product.short_description ?? '',
                description: product.description ?? '',
                specifications_json: (() => {
                    const s = product.specifications;
                    if (!s || typeof s !== 'object' || Array.isArray(s)) return '';
                    return Object.entries(s)
                        .map(([k, v]) => `${k}: ${v == null ? '' : String(v)}`)
                        .join('\n');
                })(),
                variants,
            });
        } else {
            setEditingProduct(null);
            setFormData({
                name: '',
                category_id: '',
                price: '',
                compare_price: '',
                stock_quantity: '',
                is_featured: false,
                featuredImage: '',
                gallery: [],
                wholesale_min_quantity: '',
                wholesale_discount_pct: '',
                short_description: '',
                description: '',
                specifications_json: '',
                variants: [],
            });
        }
        setIsModalOpen(true);
    };

    const uploadFile = async (file: File, forGallery: boolean) => {
        const formDataUpload = new FormData();
        formDataUpload.append('file', file);
        const { data } = await api.post('/media/upload', formDataUpload, { headers: { 'Content-Type': undefined } });
        const path = data?.path ?? data?.url;
        if (path) {
            if (forGallery) {
                setFormData((prev) => ({ ...prev, gallery: [...prev.gallery, path] }));
            } else {
                setFormData((prev) => ({ ...prev, featuredImage: path }));
            }
        }
        return path;
    };

    const handleFeaturedUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file?.type.startsWith('image/')) {
            toast.error('Please select an image');
            return;
        }
        setUploadingFeatured(true);
        try {
            await uploadFile(file, false);
            toast.success('Image set as featured');
        } catch {
            toast.error('Upload failed');
        } finally {
            setUploadingFeatured(false);
            e.target.value = '';
        }
    };

    const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files?.length) return;
        setUploadingGallery(true);
        try {
            for (let i = 0; i < files.length; i++) {
                if (files[i].type.startsWith('image/')) await uploadFile(files[i], true);
            }
            toast.success('Images added to gallery');
        } catch {
            toast.error('Upload failed');
        } finally {
            setUploadingGallery(false);
            e.target.value = '';
        }
    };

    const removeGalleryImage = (index: number) => {
        setFormData((prev) => ({ ...prev, gallery: prev.gallery.filter((_, i) => i !== index) }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const categoryId = parseInt(formData.category_id, 10);
        if (!categoryId || !formData.name || !formData.price) {
            toast.error("Name, category, and price are required");
            return;
        }
        try {
            const images = [formData.featuredImage, ...formData.gallery].filter(Boolean);
            const payload: Record<string, unknown> = {
                name: formData.name,
                category_id: categoryId,
                price: parseFloat(formData.price),
                stock_quantity: parseInt(formData.stock_quantity || '0', 10) || 0,
                is_featured: formData.is_featured,
                images
            };
            if (formData.compare_price) payload.compare_price = parseFloat(formData.compare_price);
            if (formData.wholesale_min_quantity) payload.wholesale_min_quantity = parseInt(formData.wholesale_min_quantity, 10);
            if (formData.wholesale_discount_pct) payload.wholesale_discount_pct = parseFloat(formData.wholesale_discount_pct);
            if (formData.short_description !== undefined) payload.short_description = formData.short_description.trim() || null;
            if (formData.description !== undefined) payload.description = formData.description.trim() || null;
            // Parse specifications: accept JSON object or "Key: Value" lines; only send valid object (backend rejects null)
            let specsObj: Record<string, unknown> | null = null;
            const raw = formData.specifications_json?.trim();
            if (raw) {
                try {
                    const parsed = JSON.parse(raw);
                    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) specsObj = parsed;
                } catch {
                    // Try "Key: Value" lines
                    const lines = raw.split(/\r?\n/).filter((l) => l.trim());
                    const obj: Record<string, string> = {};
                    for (const line of lines) {
                        const idx = line.indexOf(':');
                        if (idx > 0) {
                            const k = line.slice(0, idx).trim();
                            const v = line.slice(idx + 1).trim();
                            if (k) obj[k] = v;
                        }
                    }
                    if (Object.keys(obj).length) specsObj = obj;
                }
            }
            payload.specifications = specsObj && typeof specsObj === 'object' ? specsObj : {};
            payload.variants = (formData.variants || []).map((v) => ({
                variant_type: v.variant_type,
                variant_value: v.variant_value,
                sku: v.sku || undefined,
                price_adjust: v.price_adjust ?? 0,
                stock_quantity: v.stock_quantity ?? 0,
            }));
            if (editingProduct) {
                await api.patch(`/products/${editingProduct.id}`, payload);
                toast.success("Product updated");
            } else {
                await api.post('/products', payload);
                toast.success("Product created");
            }
            setIsModalOpen(false);
            fetchProducts();
        } catch (err: any) {
            const msg = err?.response?.data?.message ?? err?.message ?? 'Failed to save product';
            const details = Array.isArray(err?.response?.data?.message) ? err.response.data.message.join(', ') : msg;
            toast.error(details);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this product?')) return;
        try {
            await api.delete(`/products/${id}`);
            toast.success('Product deleted');
            setProducts(products.filter((p) => p.id !== id));
        } catch {
            toast.error('Failed to delete product');
        }
    };

    const getCategoryName = (p: any) =>
        typeof p.category === 'object' && p.category?.name ? p.category.name : (p.category ?? '—');
    const getProductImage = (p: any) => {
        const imgs = p.images;
        if (Array.isArray(imgs) && imgs.length) return imgs[0];
        return p.image ?? '';
    };

    const productImageUrl = (path: string) => (path && path.startsWith('http') ? path : getMediaUrl(path)) || '/placeholder.svg';

    const filteredProducts = products.filter(
        (p) =>
            p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            getCategoryName(p).toLowerCase().includes(searchTerm.toLowerCase())
    );

    const activeCount = products.filter((p) => p.is_active !== false).length;
    const lowStockCount = products.filter((p) => (Number(p.stock_quantity) ?? 0) <= (Number(p.low_stock_threshold) ?? 10)).length;

    const stats = [
        { label: 'Total', value: products.length, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
        { label: 'Active', value: activeCount, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
        { label: 'Low stock', value: lowStockCount, icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
    ];

    return (
        <DashboardLayout isAdmin={true}>
            <div className="pb-6 md:pb-8">
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                    <Package className="h-7 w-7 text-blue-600" />
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Products</h1>
                        <p className="text-xs text-gray-500 mt-0.5">Catalog</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <div className="relative flex-1 min-w-0 sm:w-48">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-9 pl-9 pr-3 bg-white border border-gray-100 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={() => handleOpenModal()}
                        className="min-h-[44px] h-9 px-4 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-gray-900 transition-all flex items-center gap-1.5 shrink-0"
                    >
                        <Plus className="h-3.5 w-3.5" /> Add product
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
                {stats.map((s, i) => (
                    <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                        <div className={`w-9 h-9 rounded-lg ${s.bg} ${s.border} border flex items-center justify-center ${s.color} mb-2`}>
                            <s.icon className="h-4 w-4" />
                        </div>
                        <p className="text-xs font-semibold text-gray-500 mb-0.5">{s.label}</p>
                        <p className="text-xl font-bold text-gray-900">{s.value}</p>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-50">
                                <th className="px-3 py-2.5 text-xs font-semibold text-gray-500">Product</th>
                                <th className="px-3 py-2.5 text-xs font-semibold text-gray-500">Category</th>
                                <th className="px-3 py-2.5 text-xs font-semibold text-gray-500">Price</th>
                                <th className="px-3 py-2.5 text-xs font-semibold text-gray-500">Status</th>
                                <th className="px-3 py-2.5 text-xs font-semibold text-gray-500 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="py-10 text-center">
                                        <div className="animate-spin h-7 w-7 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2" />
                                        <p className="text-sm text-gray-500">Loading...</p>
                                    </td>
                                </tr>
                            ) : filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-10 text-center text-gray-500">
                                        <Package className="h-10 w-10 mx-auto mb-2 text-gray-200" />
                                        <p className="text-sm">No products found</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredProducts.map((p) => (
                                    <tr key={p.id} className="group hover:bg-gray-50/50 transition-colors">
                                        <td className="px-3 py-2.5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-9 h-9 rounded-lg bg-gray-50 overflow-hidden border border-gray-100 shrink-0">
                                                    <img src={productImageUrl(getProductImage(p))} alt="" className="w-full h-full object-contain" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">{p.name}</p>
                                                    <p className="text-xs text-gray-400">ID: {p.id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <span className="px-2 py-0.5 bg-gray-50 border border-gray-100 rounded-lg text-xs font-semibold text-gray-600">
                                                {getCategoryName(p)}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <span className="text-xs font-semibold text-gray-900">
                                                ₵{Number(p.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <span className={`inline-flex items-center gap-1 text-xs font-semibold ${p.is_active !== false ? 'text-green-600' : 'text-gray-500'}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${p.is_active !== false ? 'bg-green-500' : 'bg-gray-400'}`} />
                                                {p.is_active !== false ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2.5 text-right">
                                            <div className="flex justify-end gap-1.5">
                                                <button type="button" className="min-w-[44px] min-h-[44px] w-9 h-9 bg-white border border-gray-100 rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-600 hover:border-blue-600 transition-all" aria-label="View"><Eye className="h-4 w-4" /></button>
                                                <button type="button" onClick={() => handleOpenModal(p)} className="min-w-[44px] min-h-[44px] w-9 h-9 bg-white border border-gray-100 rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-600 hover:border-blue-600 transition-all" aria-label="Edit"><Edit3 className="h-4 w-4" /></button>
                                                <button type="button" onClick={() => handleDelete(p.id)} className="min-w-[44px] min-h-[44px] w-9 h-9 bg-white border border-gray-100 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-100 hover:bg-red-50 transition-all" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-white rounded-xl border border-gray-100 shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto overscroll-y-contain scrollbar-thin p-5" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-lg font-bold text-gray-900 mb-4">
                            {editingProduct ? 'Edit product' : 'New product'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full h-10 px-3 border border-gray-100 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Category</label>
                                <select
                                    required
                                    value={formData.category_id}
                                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                                    className="w-full h-10 px-3 border border-gray-100 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                >
                                    <option value="">Select category</option>
                                    {categories.map((c) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Short description</label>
                                <input
                                    type="text"
                                    value={formData.short_description}
                                    onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                                    placeholder="One line summary (e.g. Reliable computing for everyday tasks)"
                                    className="w-full h-10 px-3 border border-gray-100 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Product description / details</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Full description, features, or HTML. Shown on the product page."
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-100 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-y min-h-[80px]"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Price (GHS)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        className="w-full h-10 px-3 border border-gray-100 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Compare price (GHS)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.compare_price}
                                        onChange={(e) => setFormData({ ...formData, compare_price: e.target.value })}
                                        placeholder="Original price for sale display"
                                        className="w-full h-10 px-3 border border-gray-100 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    />
                                    <p className="text-xs text-gray-400 mt-0.5">Shows in Featured Deals when set</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Stock</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.stock_quantity}
                                        onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                                        className="w-full h-10 px-3 border border-gray-100 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-3 py-1">
                                <input
                                    type="checkbox"
                                    id="is_featured"
                                    checked={formData.is_featured}
                                    onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                                    className="w-4 h-4 rounded border-gray-200 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="is_featured" className="text-sm font-medium text-gray-700">Show in Featured section on homepage</label>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1.5">
                                    <Layers className="h-3.5 w-3.5" /> Variants (optional)
                                </label>
                                <p className="text-xs text-gray-400 mb-2">Add options from Variations (e.g. Size, Color). Define SKU, price adjustment and stock per variant.</p>
                                <div className="space-y-2">
                                    {formData.variants.map((v, idx) => (
                                        <div key={idx} className="flex flex-wrap items-center gap-2 p-2 rounded-lg bg-gray-50 border border-gray-100">
                                            <select
                                                value={v.variant_type}
                                                onChange={(e) => setFormData((f) => ({
                                                    ...f,
                                                    variants: f.variants.map((x, i) => i === idx ? { ...x, variant_type: e.target.value, variant_value: '' } : x),
                                                }))}
                                                className="h-9 px-2 rounded-lg border border-gray-200 text-sm min-w-[100px]"
                                            >
                                                <option value="">Option</option>
                                                {variationOptions.map((o) => (
                                                    <option key={o.id} value={o.slug}>{o.name}</option>
                                                ))}
                                            </select>
                                            <select
                                                value={v.variant_value}
                                                onChange={(e) => setFormData((f) => ({
                                                    ...f,
                                                    variants: f.variants.map((x, i) => i === idx ? { ...x, variant_value: e.target.value } : x),
                                                }))}
                                                className="h-9 px-2 rounded-lg border border-gray-200 text-sm min-w-[90px]"
                                            >
                                                <option value="">Value</option>
                                                {variationOptions.find((o) => o.slug === v.variant_type)?.values?.map((val) => (
                                                    <option key={val.id} value={val.value}>{val.value}</option>
                                                ))}
                                            </select>
                                            <input
                                                type="text"
                                                placeholder="SKU"
                                                value={v.sku ?? ''}
                                                onChange={(e) => setFormData((f) => ({
                                                    ...f,
                                                    variants: f.variants.map((x, i) => i === idx ? { ...x, sku: e.target.value || undefined } : x),
                                                }))}
                                                className="h-9 px-2 rounded-lg border border-gray-200 text-sm w-20"
                                            />
                                            <input
                                                type="number"
                                                step="0.01"
                                                placeholder="Price ±"
                                                value={v.price_adjust ?? ''}
                                                onChange={(e) => setFormData((f) => ({
                                                    ...f,
                                                    variants: f.variants.map((x, i) => i === idx ? { ...x, price_adjust: e.target.value ? parseFloat(e.target.value) : undefined } : x),
                                                }))}
                                                className="h-9 px-2 rounded-lg border border-gray-200 text-sm w-20"
                                            />
                                            <input
                                                type="number"
                                                min="0"
                                                placeholder="Stock"
                                                value={v.stock_quantity ?? ''}
                                                onChange={(e) => setFormData((f) => ({
                                                    ...f,
                                                    variants: f.variants.map((x, i) => i === idx ? { ...x, stock_quantity: e.target.value ? parseInt(e.target.value, 10) : undefined } : x),
                                                }))}
                                                className="h-9 px-2 rounded-lg border border-gray-200 text-sm w-20"
                                            />
                                            <button type="button" onClick={() => setFormData((f) => ({ ...f, variants: f.variants.filter((_, i) => i !== idx) }))} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50" aria-label="Remove variant">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => setFormData((f) => ({ ...f, variants: [...f.variants, { variant_type: '', variant_value: '' }] }))}
                                        className="min-h-[40px] px-3 rounded-lg border border-dashed border-gray-300 text-gray-500 text-sm font-medium flex items-center gap-1.5 hover:border-blue-400 hover:text-blue-600"
                                    >
                                        <Plus className="h-3.5 w-3.5" /> Add variant
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Minimum quantity for wholesale</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.wholesale_min_quantity}
                                        onChange={(e) => setFormData({ ...formData, wholesale_min_quantity: e.target.value })}
                                        placeholder="e.g. 10"
                                        className="w-full h-10 px-3 border border-gray-100 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Wholesale discount (%)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.5"
                                        value={formData.wholesale_discount_pct}
                                        onChange={(e) => setFormData({ ...formData, wholesale_discount_pct: e.target.value })}
                                        placeholder="e.g. 10"
                                        className="w-full h-10 px-3 border border-gray-100 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Specifications</label>
                                <textarea
                                    value={formData.specifications_json}
                                    onChange={(e) => setFormData({ ...formData, specifications_json: e.target.value })}
                                    placeholder={'Screen: 14"\nRAM: 8GB\nStorage: 128GB\nProcessor: Intel Core i7'}
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-y min-h-[80px]"
                                />
                                <p className="text-xs text-gray-400 mt-0.5">One per line as <strong>Label: Value</strong>. Or valid JSON object. Shown in a table on the product page.</p>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Featured image</label>
                                <div className="flex items-start gap-2">
                                    <div className="w-20 h-20 rounded-lg border border-gray-100 bg-gray-50 overflow-hidden shrink-0">
                                        {formData.featuredImage ? (
                                            <img
                                                src={productImageUrl(formData.featuredImage)}
                                                alt=""
                                                className="w-full h-full object-contain"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = '/placeholder.svg';
                                                    (e.target as HTMLImageElement).onerror = null;
                                                }}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                <ImageIcon className="h-6 w-6" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <input ref={featuredInputRef} type="file" accept="image/*" className="hidden" onChange={handleFeaturedUpload} />
                                        <button type="button" onClick={() => featuredInputRef.current?.click()} disabled={uploadingFeatured} className="min-h-[44px] h-9 px-3 rounded-lg border border-gray-200 text-xs font-medium flex items-center gap-1.5 disabled:opacity-60">
                                            {uploadingFeatured ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                                            Upload
                                        </button>
                                        <button type="button" onClick={() => setMediaPickerOpen('featured')} className="min-h-[44px] h-9 px-3 rounded-lg border border-gray-200 text-xs font-medium text-left flex items-center">
                                            Choose from library
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Product gallery</label>
                                <div className="space-y-1.5">
                                    <div className="flex flex-wrap gap-1.5">
                                        {formData.gallery.map((path, i) => (
                                            <div key={i} className="relative w-14 h-14 rounded-lg border border-gray-100 bg-gray-50 overflow-hidden group">
                                                <img
                                                    src={productImageUrl(path)}
                                                    alt=""
                                                    className="w-full h-full object-contain"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = '/placeholder.svg';
                                                        (e.target as HTMLImageElement).onerror = null;
                                                    }}
                                                />
                                                <button type="button" onClick={() => removeGalleryImage(i)} className="absolute top-0.5 right-0.5 w-5 h-5 rounded bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Remove">
                                                    <X className="h-2.5 w-2.5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex gap-1.5">
                                        <input ref={galleryInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleGalleryUpload} />
                                        <button type="button" onClick={() => galleryInputRef.current?.click()} disabled={uploadingGallery} className="min-h-[44px] h-9 px-3 rounded-lg border border-gray-200 text-xs font-medium flex items-center gap-1.5 disabled:opacity-60">
                                            {uploadingGallery ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                                            Upload
                                        </button>
                                        <button type="button" onClick={() => setMediaPickerOpen('gallery')} className="min-h-[44px] h-9 px-3 rounded-lg border border-gray-200 text-xs font-medium flex items-center">
                                            Choose from library
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button type="submit" className="flex-1 min-h-[44px] h-10 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-gray-900 flex items-center justify-center">
                                    {editingProduct ? 'Update' : 'Create'}
                                </button>
                                <button type="button" onClick={() => setIsModalOpen(false)} className="min-h-[44px] h-10 px-4 border border-gray-200 rounded-lg font-semibold text-sm text-gray-600 hover:bg-gray-50 flex items-center">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <MediaPickerModal
                open={mediaPickerOpen === 'featured'}
                onClose={() => setMediaPickerOpen(null)}
                onSelect={(path) => {
                    setFormData((prev) => ({ ...prev, featuredImage: path }));
                    setMediaPickerOpen(null);
                }}
            />
            <MediaPickerModal
                open={mediaPickerOpen === 'gallery'}
                onClose={() => setMediaPickerOpen(null)}
                onSelect={() => {}}
                multiple
                onSelectMultiple={(paths) => {
                    setFormData((prev) => ({ ...prev, gallery: [...prev.gallery, ...paths] }));
                    setMediaPickerOpen(null);
                }}
            />
            </div>
        </DashboardLayout>
    );
}
