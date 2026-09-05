'use client';

import React, { useEffect, useState, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminStatGrid from '@/components/admin/AdminStatGrid';
import AdminToolbar from '@/components/admin/AdminToolbar';
import AdminTable, {
    AdminTableBody,
    AdminTableEmpty,
    AdminTableHead,
    AdminTableLoading,
    AdminTd,
    AdminTh,
    AdminTr,
} from '@/components/admin/AdminTable';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import FormField from '@/components/ui/FormField';
import Modal from '@/components/ui/Modal';
import {
    Plus,
    Package,
    Edit3,
    Trash2,
    Eye,
    Upload,
    ImageIcon,
    X,
    FileText,
    CheckCircle,
    AlertTriangle,
    Layers
} from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import api from '@/lib/axios';
import {
    getShopNavRoots,
    getSubcategoriesForRoot,
    rootHasSubcategories,
    resolveAdminCategoryIds,
    resolveCategoryIdForAdmin,
    type CategoryNode,
} from '@/lib/category-utils';
import { getMediaUrl } from '@/lib/media';
import MediaPickerModal from '@/components/admin/MediaPickerModal';
import ProductVariantsEditor from '@/components/admin/ProductVariantsEditor';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import {
    reconstructAxesFromVariants,
    type VariantOptionAxis,
} from '@/lib/variant-options';

type VariationOptionRow = { id: number; name: string; slug: string; values: { id: number; value: string }[] };

export default function AdminProducts() {
    const { confirm, confirmDialog } = useConfirmDialog();
    const [products, setProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<CategoryNode[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<any>(null);
    const [formData, setFormData] = useState({
        name: '',
        main_category_id: '',
        condition_category_id: '',
        product_kind: 'simple' as 'simple' | 'variable',
        price: '',
        compare_price: '',
        stock_quantity: '',
        is_featured: false,
        featuredImage: '',
        gallery: [] as string[],
        wholesale_min_quantity: '',
        wholesale_discount_pct: '',
        enforce_min_quantity: false,
        short_description: '',
        description: '',
        specifications_json: '', // JSON text for specs (e.g. {"Screen": "14\"", "RAM": "8GB"})
        variant_options: [] as VariantOptionAxis[],
        variants: [] as {
            variant_type: string;
            variant_value: string;
            option_values?: Record<string, string>;
            sku?: string;
            price_adjust?: number;
            stock_quantity?: number;
        }[],
    });
    const [variationOptions, setVariationOptions] = useState<VariationOptionRow[]>([]);
    const [mediaPickerOpen, setMediaPickerOpen] = useState<'featured' | 'gallery' | null>(null);
    const [uploadingFeatured, setUploadingFeatured] = useState(false);
    const [uploadingGallery, setUploadingGallery] = useState(false);
    const featuredInputRef = useRef<HTMLInputElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);
    const variationOptionsRef = useRef<VariationOptionRow[]>([]);

    const applyVariationOptions = (opts: VariationOptionRow[]) => {
        variationOptionsRef.current = opts;
        setVariationOptions(opts);
    };

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, []);

    const fetchVariationOptions = async (): Promise<VariationOptionRow[]> => {
        try {
            let data: unknown;
            try {
                ({ data } = await api.get('/variations/admin/options'));
            } catch {
                ({ data } = await api.get('/variations/options'));
            }
            const opts = Array.isArray(data) ? data : [];
            applyVariationOptions(opts);
            return opts;
        } catch {
            toast.error('Failed to load variation options');
            applyVariationOptions([]);
            return [];
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

    const handleOpenModal = async (product: any = null) => {
        const options = await fetchVariationOptions();
        if (product) {
            setEditingProduct(product);
            const catName = product.category?.name ?? product.category;
            const catId = Number(
                product.category_id ?? categories.find((c) => c.name === catName)?.id ?? 0,
            );
            const { mainId, conditionId } = catId
                ? resolveAdminCategoryIds(categories, catId)
                : { mainId: '', conditionId: '' };
            const imgs = Array.isArray(product.images) ? product.images.filter(Boolean) : product.image ? [product.image] : [];
            const variants = (product.variants || []).map((v: any) => ({
                variant_type: v.variant_type ?? '',
                variant_value: v.variant_value ?? '',
                option_values:
                    v.option_values && typeof v.option_values === 'object'
                        ? (v.option_values as Record<string, string>)
                        : undefined,
                sku: v.sku ?? undefined,
                price_adjust: v.price_adjust != null ? Number(v.price_adjust) : undefined,
                stock_quantity: v.stock_quantity != null ? Number(v.stock_quantity) : undefined,
            }));
            const storedAxes = Array.isArray(product.variant_options)
                ? (product.variant_options as VariantOptionAxis[])
                : [];
            const variant_options =
                storedAxes.length > 0
                    ? storedAxes
                    : reconstructAxesFromVariants(variants, options);
            setFormData({
                name: product.name ?? '',
                main_category_id: mainId,
                condition_category_id: conditionId,
                product_kind: variants.length > 0 || variant_options.length > 0 ? 'variable' : 'simple',
                price: String(Number(product.price ?? 0)),
                compare_price: product.compare_price != null ? String(Number(product.compare_price)) : '',
                stock_quantity: String(Number(product.stock_quantity ?? product.stock ?? 10)),
                is_featured: !!product.is_featured,
                featuredImage: imgs[0] ?? '',
                gallery: imgs.slice(1),
                wholesale_min_quantity: String(product.wholesale_min_quantity ?? ''),
                wholesale_discount_pct: String(product.wholesale_discount_pct ?? ''),
                enforce_min_quantity: !!product.enforce_min_quantity,
                short_description: product.short_description ?? '',
                description: product.description ?? '',
                specifications_json: (() => {
                    const s = product.specifications;
                    if (!s || typeof s !== 'object' || Array.isArray(s)) return '';
                    return Object.entries(s)
                        .map(([k, v]) => `${k}: ${v == null ? '' : String(v)}`)
                        .join('\n');
                })(),
                variant_options,
                variants,
            });
        } else {
            setEditingProduct(null);
            setFormData({
                name: '',
                main_category_id: '',
                condition_category_id: '',
                product_kind: 'simple',
                price: '',
                compare_price: '',
                stock_quantity: '',
                is_featured: false,
                featuredImage: '',
                gallery: [],
                wholesale_min_quantity: '',
                wholesale_discount_pct: '',
                enforce_min_quantity: false,
                short_description: '',
                description: '',
                specifications_json: '',
                variant_options: [],
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
        const categoryId = resolveCategoryIdForAdmin(
            categories,
            formData.main_category_id,
            formData.condition_category_id,
        );
        if (!categoryId || !formData.name) {
            const main = parseInt(formData.main_category_id, 10);
            if (main && rootHasSubcategories(categories, main) && !formData.condition_category_id) {
                toast.error('Select New or Used for this category');
            } else {
                toast.error('Name and category are required');
            }
            return;
        }
        const isVariable = formData.product_kind === 'variable';
        if (!isVariable && !formData.price) {
            toast.error('Simple products require a base price');
            return;
        }
        if (isVariable) {
            const ok =
                formData.variant_options.some((a) => a.values.length > 0) &&
                formData.variants.some((v) => v.variant_type && v.variant_value);
            if (!ok) {
                toast.error('Add at least one option with values to generate variants');
                return;
            }
        }
        if (formData.enforce_min_quantity) {
            const min = parseInt(formData.wholesale_min_quantity, 10);
            if (!Number.isFinite(min) || min < 2) {
                toast.error('Set a minimum quantity of at least 2 to block purchases below that quantity');
                return;
            }
        }
        try {
            const images = [formData.featuredImage, ...formData.gallery].filter(Boolean);
            const payload: Record<string, unknown> = {
                name: formData.name,
                category_id: categoryId,
                price: isVariable
                    ? (formData.price === '' || formData.price === undefined ? 0 : parseFloat(String(formData.price)))
                    : parseFloat(formData.price),
                stock_quantity: parseInt(formData.stock_quantity || '0', 10) || 0,
                is_featured: formData.is_featured,
                images
            };
            if (formData.compare_price) payload.compare_price = parseFloat(formData.compare_price);
            payload.enforce_min_quantity = !!formData.enforce_min_quantity;
            payload.wholesale_min_quantity = formData.wholesale_min_quantity
                ? parseInt(formData.wholesale_min_quantity, 10)
                : null;
            payload.wholesale_discount_pct = formData.wholesale_discount_pct
                ? parseFloat(formData.wholesale_discount_pct)
                : null;
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
            if (isVariable) {
                payload.variant_options = formData.variant_options.filter((a) => a.slug && a.values.length > 0);
                payload.variants = (formData.variants || [])
                    .filter((v) => v.variant_type && v.variant_value)
                    .map((v) => ({
                        variant_type: v.variant_type,
                        variant_value: v.variant_value,
                        option_values: v.option_values || undefined,
                        sku: v.sku || undefined,
                        price_adjust: v.price_adjust ?? 0,
                        stock_quantity: v.stock_quantity ?? 0,
                    }));
            } else {
                payload.variant_options = [];
                payload.variants = [];
            }
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
        const ok = await confirm({ title: 'Delete this product?', confirmLabel: 'Delete' });
        if (!ok) return;
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
        { label: 'Total', value: products.length, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
        { label: 'Active', value: activeCount, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
        { label: 'Low stock', value: lowStockCount, icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
    ];

    return (
        <DashboardLayout isAdmin={true}>
            <div className="pb-6 md:pb-8">
            <AdminPageHeader
                icon={Package}
                title="Products"
                subtitle="Manage your storefront catalog"
                actions={
                    <AdminToolbar
                        searchValue={searchTerm}
                        onSearchChange={setSearchTerm}
                        searchPlaceholder="Search name or category…"
                        searchAriaLabel="Search products"
                    >
                        <Button
                            type="button"
                            size="sm"
                            leftIcon={<Plus className="h-3.5 w-3.5" />}
                            onClick={() => handleOpenModal()}
                        >
                            Add product
                        </Button>
                    </AdminToolbar>
                }
            />
            <AdminStatGrid items={stats} columns={3} />

            <AdminTable>
                <AdminTableHead>
                    <AdminTh>Product</AdminTh>
                    <AdminTh>Category</AdminTh>
                    <AdminTh>Price</AdminTh>
                    <AdminTh>Status</AdminTh>
                    <AdminTh align="right">Actions</AdminTh>
                </AdminTableHead>
                <AdminTableBody>
                    {loading ? (
                        <AdminTableLoading colSpan={5} />
                    ) : filteredProducts.length === 0 ? (
                        <AdminTableEmpty
                            colSpan={5}
                            icon={<Package className="h-10 w-10 mx-auto mb-2 text-gray-200" />}
                            message="No products found"
                        />
                    ) : (
                        filteredProducts.map((p) => (
                            <AdminTr key={p.id} className="group">
                                <AdminTd>
                                    <div className="flex items-center gap-2">
                                        <div className="w-9 h-9 rounded-lg bg-gray-50 overflow-hidden border border-gray-100 shrink-0">
                                            <img src={productImageUrl(getProductImage(p))} alt="" className="w-full h-full object-contain" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-semibold text-gray-900 truncate group-hover:text-brand transition-colors">{p.name}</p>
                                            <p className="text-xs text-gray-400">ID: {p.id}</p>
                                        </div>
                                    </div>
                                </AdminTd>
                                <AdminTd>
                                    <span className="px-2 py-0.5 bg-gray-50 border border-gray-100 rounded-lg text-xs font-semibold text-gray-600">
                                        {getCategoryName(p)}
                                    </span>
                                </AdminTd>
                                <AdminTd>
                                    <span className="text-xs font-semibold text-gray-900">
                                        ₵{Number(p.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </span>
                                    {p.enforce_min_quantity && Number(p.wholesale_min_quantity) >= 2 ? (
                                        <p className="text-[10px] font-medium text-amber-700 mt-0.5">
                                            Min {p.wholesale_min_quantity}
                                            {p.wholesale_discount_pct != null && Number(p.wholesale_discount_pct) > 0
                                                ? ` · ${Number(p.wholesale_discount_pct)}% off`
                                                : ''}
                                        </p>
                                    ) : p.wholesale_min_quantity != null &&
                                      Number(p.wholesale_min_quantity) > 0 &&
                                      p.wholesale_discount_pct != null &&
                                      Number(p.wholesale_discount_pct) > 0 ? (
                                        <p className="text-[10px] text-gray-400 mt-0.5">
                                            {p.wholesale_min_quantity}+ for {Number(p.wholesale_discount_pct)}% off
                                        </p>
                                    ) : null}
                                </AdminTd>
                                <AdminTd>
                                    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${p.is_active !== false ? 'text-green-600' : 'text-gray-500'}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${p.is_active !== false ? 'bg-green-500' : 'bg-gray-400'}`} />
                                        {p.is_active !== false ? 'Active' : 'Inactive'}
                                    </span>
                                </AdminTd>
                                <AdminTd className="text-right">
                                    <div className="flex justify-end gap-1.5">
                                        <button type="button" className="min-w-[44px] min-h-[44px] w-9 h-9 bg-white border border-gray-100 rounded-lg flex items-center justify-center text-gray-400 hover:text-brand hover:border-brand transition-all" aria-label="View"><Eye className="h-4 w-4" /></button>
                                        <button type="button" onClick={() => handleOpenModal(p)} className="min-w-[44px] min-h-[44px] w-9 h-9 bg-white border border-gray-100 rounded-lg flex items-center justify-center text-gray-400 hover:text-brand hover:border-brand transition-all" aria-label="Edit"><Edit3 className="h-4 w-4" /></button>
                                        <button type="button" onClick={() => void handleDelete(p.id)} className="min-w-[44px] min-h-[44px] w-9 h-9 bg-white border border-gray-100 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-100 hover:bg-red-50 transition-all" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                                    </div>
                                </AdminTd>
                            </AdminTr>
                        ))
                    )}
                </AdminTableBody>
            </AdminTable>

            {/* Create/Edit Modal */}
            <Modal
                open={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingProduct ? 'Edit product' : 'New product'}
                size="xl"
                footer={
                    <>
                        <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" form="product-form" variant="primary">
                            {editingProduct ? 'Update' : 'Create'}
                        </Button>
                    </>
                }
            >
                <form id="product-form" onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto overscroll-y-contain scrollbar-thin -mx-1 px-1">
                    <FormField label="Name" htmlFor="product-name" required>
                        <Input
                            id="product-name"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </FormField>
                    <FormField label="Main category" htmlFor="product-main-category" required>
                        <Select
                            id="product-main-category"
                            required
                            value={formData.main_category_id}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    main_category_id: e.target.value,
                                    condition_category_id: '',
                                })
                            }
                        >
                            <option value="">Select category</option>
                            {getShopNavRoots(categories).map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </Select>
                    </FormField>
                    {formData.main_category_id &&
                        rootHasSubcategories(categories, parseInt(formData.main_category_id, 10)) && (
                            <FormField label="Condition" htmlFor="product-condition" required>
                                <Select
                                    id="product-condition"
                                    required
                                    value={formData.condition_category_id}
                                    onChange={(e) =>
                                        setFormData({ ...formData, condition_category_id: e.target.value })
                                    }
                                >
                                    <option value="">Select New or Used</option>
                                    {getSubcategoriesForRoot(
                                        categories,
                                        parseInt(formData.main_category_id, 10),
                                    ).map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </Select>
                            </FormField>
                        )}
                    <FormField
                        label="Product type"
                        hint="Variable: set per-option prices below; base price can be 0 if each option price is the full amount."
                    >
                        <div className="flex rounded-lg border border-gray-200/90 p-0.5 bg-gray-50 gap-0.5">
                            <button
                                type="button"
                                onClick={() =>
                                    setFormData((f) => ({
                                        ...f,
                                        product_kind: 'simple',
                                        variants: [],
                                        variant_options: [],
                                    }))
                                }
                                className={`flex-1 h-9 rounded-md text-xs font-semibold transition-all ${formData.product_kind === 'simple' ? 'bg-white text-gray-900 border border-gray-200/90' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Simple
                            </button>
                            <button
                                type="button"
                                onClick={async () => {
                                    await fetchVariationOptions();
                                    setFormData((f) => ({
                                        ...f,
                                        product_kind: 'variable',
                                        variant_options: f.variant_options.length > 0 ? f.variant_options : [],
                                        variants: f.variants.length > 0 ? f.variants : [],
                                    }));
                                }}
                                className={`flex-1 h-9 rounded-md text-xs font-semibold transition-all ${formData.product_kind === 'variable' ? 'bg-white text-gray-900 border border-gray-200/90' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Variable
                            </button>
                        </div>
                    </FormField>
                    <FormField label="Short description" htmlFor="product-short-desc">
                        <Input
                            id="product-short-desc"
                            value={formData.short_description}
                            onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                            placeholder="One line summary (e.g. Reliable computing for everyday tasks)"
                        />
                    </FormField>
                    <FormField label="Product description / details" htmlFor="product-desc">
                        <Textarea
                            id="product-desc"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Full product description and key highlights shown on the product page."
                            rows={4}
                        />
                    </FormField>
                    <div className="grid grid-cols-2 gap-3">
                        <FormField
                            label={formData.product_kind === 'variable' ? 'Base price (GHS) — optional' : 'Price (GHS)'}
                            htmlFor="product-price"
                        >
                            <Input
                                id="product-price"
                                type="number"
                                step="0.01"
                                required={formData.product_kind === 'simple'}
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                placeholder={formData.product_kind === 'variable' ? '0 if using full price per variant' : ''}
                            />
                        </FormField>
                        <FormField
                            label="Compare price (GHS)"
                            htmlFor="product-compare-price"
                            hint="Shows in Featured Deals when set"
                        >
                            <Input
                                id="product-compare-price"
                                type="number"
                                step="0.01"
                                min={0}
                                value={formData.compare_price}
                                onChange={(e) => setFormData({ ...formData, compare_price: e.target.value })}
                                placeholder="Original price for sale display"
                            />
                        </FormField>
                        <FormField label="Stock" htmlFor="product-stock">
                            <Input
                                id="product-stock"
                                type="number"
                                min={0}
                                value={formData.stock_quantity}
                                onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                            />
                        </FormField>
                    </div>
                    <div className="flex items-center gap-3 py-1">
                        <input
                            type="checkbox"
                            id="is_featured"
                            checked={formData.is_featured}
                            onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                            className="w-4 h-4 rounded border-gray-200 text-brand focus:ring-brand"
                        />
                        <label htmlFor="is_featured" className="text-sm font-medium text-gray-700">Show in Featured section on homepage</label>
                    </div>
                    {formData.product_kind === 'variable' && (
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1.5">
                            <Layers className="h-3.5 w-3.5" /> Variants
                        </label>
                        <p className="text-xs text-gray-400 mb-2">
                            Add options (Color, Size, …) then set price, quantity, and SKU for each combination.
                            Price = base + adjust (use base 0 and enter the full GHS price per row if you prefer).
                        </p>
                        <ProductVariantsEditor
                            basePrice={parseFloat(String(formData.price || '0')) || 0}
                            catalog={variationOptions}
                            axes={formData.variant_options}
                            variants={formData.variants}
                            onAxesChange={(variant_options) =>
                                setFormData((f) => ({ ...f, variant_options }))
                            }
                            onVariantsChange={(variants) => setFormData((f) => ({ ...f, variants }))}
                        />
                    </div>
                    )}
                    {!editingProduct?.is_consignment && (
                    <div className="flex items-start gap-3 py-1">
                        <input
                            type="checkbox"
                            id="enforce_min_quantity"
                            checked={formData.enforce_min_quantity}
                            onChange={(e) => setFormData({ ...formData, enforce_min_quantity: e.target.checked })}
                            className="mt-0.5 w-4 h-4 rounded border-gray-200 text-brand focus:ring-brand"
                        />
                        <label htmlFor="enforce_min_quantity" className="text-sm font-medium text-gray-700">
                            Cannot purchase below the minimum quantity
                            <span className="block text-xs font-normal text-gray-500 mt-0.5">
                                {formData.enforce_min_quantity
                                    ? 'Customers must buy at least the wholesale minimum. They cannot buy a single item.'
                                    : 'Customers can buy any quantity. Discount still applies at the wholesale minimum and above.'}
                            </span>
                        </label>
                    </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                        <FormField label="Minimum quantity for wholesale" htmlFor="product-wholesale-min">
                            <Input
                                id="product-wholesale-min"
                                type="number"
                                min={formData.enforce_min_quantity ? 2 : 0}
                                value={formData.wholesale_min_quantity}
                                onChange={(e) => setFormData({ ...formData, wholesale_min_quantity: e.target.value })}
                                placeholder="e.g. 10"
                            />
                        </FormField>
                        <FormField label="Wholesale discount (%)" htmlFor="product-wholesale-pct">
                            <Input
                                id="product-wholesale-pct"
                                type="number"
                                min={0}
                                max={100}
                                step="0.5"
                                value={formData.wholesale_discount_pct}
                                onChange={(e) => setFormData({ ...formData, wholesale_discount_pct: e.target.value })}
                                placeholder="e.g. 10"
                            />
                        </FormField>
                    </div>
                    <FormField
                        label="Specifications"
                        htmlFor="product-specs"
                        hint="Add one item per line as Label: Value. These show in a clean specs table on the product page."
                    >
                        <Textarea
                            id="product-specs"
                            value={formData.specifications_json}
                            onChange={(e) => setFormData({ ...formData, specifications_json: e.target.value })}
                            placeholder={'Screen: 14"\nRAM: 8GB\nStorage: 128GB\nProcessor: Intel Core i7'}
                            rows={4}
                        />
                    </FormField>
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
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => featuredInputRef.current?.click()}
                                    disabled={uploadingFeatured}
                                    loading={uploadingFeatured}
                                    leftIcon={<Upload className="h-3.5 w-3.5" />}
                                    className="h-9 min-h-[36px] px-3 text-xs justify-start"
                                >
                                    Upload
                                </Button>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setMediaPickerOpen('featured')}
                                    className="h-9 min-h-[36px] px-3 text-xs justify-start"
                                >
                                    Choose from library
                                </Button>
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
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => galleryInputRef.current?.click()}
                                    disabled={uploadingGallery}
                                    loading={uploadingGallery}
                                    leftIcon={<Upload className="h-3.5 w-3.5" />}
                                    className="h-9 min-h-[36px] px-3 text-xs"
                                >
                                    Upload
                                </Button>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setMediaPickerOpen('gallery')}
                                    className="h-9 min-h-[36px] px-3 text-xs"
                                >
                                    Choose from library
                                </Button>
                            </div>
                        </div>
                    </div>
                </form>
            </Modal>

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
            {confirmDialog}
        </DashboardLayout>
    );
}
