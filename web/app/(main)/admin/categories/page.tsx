'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
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
import Badge from '@/components/ui/Badge';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { Plus, FolderTree, Edit3, Trash2, FileText, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/axios';
import { flattenCategoryTree, getRootCategories, type CategoryNode } from '@/lib/category-utils';

export default function AdminCategories() {
    const { confirm, confirmDialog } = useConfirmDialog();
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<any>(null);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        description: '',
        sort_order: '0',
        is_active: 'true',
        parent_id: '',
    });

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const { data } = await api.get('/products/categories/admin');
            setCategories(Array.isArray(data) ? data : []);
        } catch {
            toast.error('Failed to fetch categories');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (cat: any = null) => {
        if (cat) {
            setEditingCategory(cat);
            setFormData({
                name: cat.name ?? '',
                slug: cat.slug ?? '',
                description: cat.description ?? '',
                sort_order: String(cat.sort_order ?? 0),
                is_active: cat.is_active === false ? 'false' : 'true',
                parent_id: cat.parent_id != null ? String(cat.parent_id) : '',
            });
        } else {
            setEditingCategory(null);
            setFormData({ name: '', slug: '', description: '', sort_order: '0', is_active: 'true', parent_id: '' });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            toast.error('Name is required');
            return;
        }
        setSaving(true);
        try {
            const payload: Record<string, unknown> = {
                name: formData.name.trim(),
                slug: formData.slug.trim() || undefined,
                description: formData.description.trim() || undefined,
                sort_order: parseInt(formData.sort_order, 10) || 0,
                is_active: formData.is_active === 'true',
                parent_id: formData.parent_id ? parseInt(formData.parent_id, 10) : null,
            };
            if (editingCategory) {
                await api.patch(`/products/categories/${editingCategory.id}`, payload);
                toast.success('Category updated');
            } else {
                await api.post('/products/categories', payload);
                toast.success('Category created');
            }
            setIsModalOpen(false);
            fetchCategories();
        } catch (e: unknown) {
            const err = e as { response?: { data?: { message?: string | string[] } } };
            const raw = err?.response?.data?.message;
            const msg = Array.isArray(raw) ? raw.join(', ') : raw;
            toast.error(msg || 'Failed to save category');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        const ok = await confirm({
            title: 'Delete this category?',
            description: 'This cannot be undone. Categories with products may fail to delete.',
            confirmLabel: 'Delete',
        });
        if (!ok) return;
        try {
            await api.delete(`/products/categories/${id}`);
            toast.success('Category deleted');
            setCategories(categories.filter((c) => c.id !== id));
        } catch (e: any) {
            toast.error(e?.response?.data?.message || 'Failed to delete');
        }
    };

    const roots = getRootCategories(categories as CategoryNode[]);
    const treeRows = flattenCategoryTree(categories as CategoryNode[]);
    const filtered = treeRows.filter(
        ({ cat }) =>
            cat.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cat.slug?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const activeCount = categories.filter((c) => c.is_active !== false).length;
    const inactiveCount = categories.filter((c) => c.is_active === false).length;

    const stats = [
        { label: 'Total', value: categories.length, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
        { label: 'Active', value: activeCount, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
        { label: 'Inactive', value: inactiveCount, icon: XCircle, color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-100' },
    ];

    return (
        <DashboardLayout isAdmin={true}>
            <div className="pb-6 md:pb-8">
                <AdminPageHeader
                    icon={FolderTree}
                    title="Categories"
                    subtitle="Product taxonomy"
                    actions={
                        <AdminToolbar
                            searchValue={searchTerm}
                            onSearchChange={setSearchTerm}
                            searchPlaceholder="Search categories..."
                            searchAriaLabel="Search categories"
                        >
                            <Button
                                type="button"
                                size="sm"
                                leftIcon={<Plus className="h-3.5 w-3.5" />}
                                onClick={() => handleOpenModal()}
                            >
                                Add category
                            </Button>
                        </AdminToolbar>
                    }
                />

                <div className="grid grid-cols-3 gap-3 mb-4">
                    {stats.map((s, i) => (
                        <div key={i} className="admin-stat-card">
                            <div className={`w-9 h-9 rounded-lg ${s.bg} ${s.border} border flex items-center justify-center ${s.color} mb-2`}>
                                <s.icon className="h-4 w-4" />
                            </div>
                            <p className="text-xs font-semibold text-gray-500 mb-0.5">{s.label}</p>
                            <p className="text-xl font-bold text-gray-900">{s.value}</p>
                        </div>
                    ))}
                </div>

                <AdminTable>
                    <AdminTableHead>
                        <AdminTh>Name</AdminTh>
                        <AdminTh>Parent</AdminTh>
                        <AdminTh>Slug</AdminTh>
                        <AdminTh>Status</AdminTh>
                        <AdminTh align="right">Actions</AdminTh>
                    </AdminTableHead>
                    <AdminTableBody>
                        {loading ? (
                            <AdminTableLoading colSpan={5} />
                        ) : filtered.length === 0 ? (
                            <AdminTableEmpty
                                colSpan={5}
                                icon={<FolderTree className="h-10 w-10 mx-auto mb-2 text-gray-200" />}
                                message="No categories found"
                            />
                        ) : (
                            filtered.map(({ cat: c, depth }) => (
                                <AdminTr key={c.id} className="group">
                                    <AdminTd>
                                        <div className="flex items-center gap-2" style={{ paddingLeft: depth * 16 }}>
                                            <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                                                <FolderTree className="h-3.5 w-3.5 text-gray-400" />
                                            </div>
                                            <span className="text-xs font-semibold text-gray-900">
                                                {depth > 0 ? `↳ ${c.name}` : c.name}
                                            </span>
                                        </div>
                                    </AdminTd>
                                    <AdminTd className="text-xs text-gray-500">
                                        {c.parent?.name ?? (c.parent_id ? '—' : 'Main')}
                                    </AdminTd>
                                    <AdminTd className="text-xs font-mono text-gray-500">{c.slug}</AdminTd>
                                    <AdminTd>
                                        <Badge variant={c.is_active ? 'success' : 'default'}>
                                            {c.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </AdminTd>
                                    <AdminTd className="text-right">
                                        <div className="flex justify-end gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => handleOpenModal(c)}
                                                className="w-7 h-7 bg-white border border-gray-100 rounded-lg flex items-center justify-center text-gray-400 hover:text-brand hover:border-brand transition-all"
                                                aria-label="Edit"
                                            >
                                                <Edit3 className="h-3 w-3" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => void handleDelete(c.id)}
                                                className="w-7 h-7 bg-white border border-gray-100 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-100 hover:bg-red-50 transition-all"
                                                aria-label="Delete"
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </button>
                                        </div>
                                    </AdminTd>
                                </AdminTr>
                            ))
                        )}
                    </AdminTableBody>
                </AdminTable>

                <Modal
                    open={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    title={editingCategory ? 'Edit category' : 'New category'}
                    size="md"
                    footer={
                        <>
                            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" form="category-form" variant="primary" loading={saving}>
                                {editingCategory ? 'Update' : 'Create'}
                            </Button>
                        </>
                    }
                >
                    <form id="category-form" onSubmit={handleSubmit} className="space-y-4">
                        <FormField label="Name" htmlFor="cat-name">
                            <Input
                                id="cat-name"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </FormField>
                        <FormField
                            label="Parent category"
                            htmlFor="cat-parent"
                            hint={
                                editingCategory?.children?.length
                                    ? 'Main categories with subcategories cannot be moved under another parent.'
                                    : undefined
                            }
                        >
                            <Select
                                id="cat-parent"
                                value={formData.parent_id}
                                onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                                disabled={!!editingCategory?.children?.length}
                            >
                                <option value="">None (main category)</option>
                                {roots
                                    .filter((r) => !editingCategory || r.id !== editingCategory.id)
                                    .map((r) => (
                                        <option key={r.id} value={r.id}>
                                            {r.name}
                                        </option>
                                    ))}
                            </Select>
                        </FormField>
                        <FormField label="Slug (optional)" htmlFor="cat-slug" hint="Auto-generated from name if empty">
                            <Input
                                id="cat-slug"
                                value={formData.slug}
                                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                placeholder="Auto-generated from name"
                            />
                        </FormField>
                        <FormField label="Description" htmlFor="cat-desc">
                            <Textarea
                                id="cat-desc"
                                rows={2}
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </FormField>
                        <div className="grid grid-cols-2 gap-3">
                            <FormField label="Sort order" htmlFor="cat-sort">
                                <Input
                                    id="cat-sort"
                                    type="number"
                                    min={0}
                                    value={formData.sort_order}
                                    onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })}
                                />
                            </FormField>
                            <FormField label="Status" htmlFor="cat-status">
                                <Select
                                    id="cat-status"
                                    value={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.value })}
                                >
                                    <option value="true">Active</option>
                                    <option value="false">Inactive</option>
                                </Select>
                            </FormField>
                        </div>
                    </form>
                </Modal>
                {confirmDialog}
            </div>
        </DashboardLayout>
    );
}
