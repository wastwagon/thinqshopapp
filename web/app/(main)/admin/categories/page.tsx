'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Search, Plus, FolderTree, Edit3, Trash2, FileText, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/axios';

export default function AdminCategories() {
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<any>(null);
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        description: '',
        sort_order: '0',
        is_active: 'true'
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
                is_active: cat.is_active === false ? 'false' : 'true'
            });
        } else {
            setEditingCategory(null);
            setFormData({ name: '', slug: '', description: '', sort_order: '0', is_active: 'true' });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            toast.error('Name is required');
            return;
        }
        try {
            const payload = {
                name: formData.name.trim(),
                slug: formData.slug.trim() || undefined,
                description: formData.description.trim() || undefined,
                sort_order: parseInt(formData.sort_order, 10) || 0,
                is_active: formData.is_active === 'true'
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
        } catch {
            toast.error('Failed to save category');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this category?')) return;
        try {
            await api.delete(`/products/categories/${id}`);
            toast.success('Category deleted');
            setCategories(categories.filter((c) => c.id !== id));
        } catch (e: any) {
            toast.error(e?.response?.data?.message || 'Failed to delete');
        }
    };

    const filtered = categories.filter(
        (c) =>
            c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.slug?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const activeCount = categories.filter((c) => c.is_active !== false).length;
    const inactiveCount = categories.filter((c) => c.is_active === false).length;

    const stats = [
        { label: 'Total', value: categories.length, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
        { label: 'Active', value: activeCount, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
        { label: 'Inactive', value: inactiveCount, icon: XCircle, color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-100' },
    ];

    return (
        <DashboardLayout isAdmin={true}>
            <div className="pb-6 md:pb-8">
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                    <FolderTree className="h-7 w-7 text-blue-600" />
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Categories</h1>
                        <p className="text-xs text-gray-500 mt-0.5">Product taxonomy</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <div className="relative flex-1 min-w-0 sm:w-48">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search categories..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-9 pl-9 pr-3 bg-white border border-gray-100 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={() => handleOpenModal()}
                        className="h-9 px-4 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-gray-900 transition-all flex items-center gap-1.5 shrink-0"
                    >
                        <Plus className="h-3.5 w-3.5" /> Add category
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
                                <th className="px-3 py-2.5 text-xs font-semibold text-gray-500">Name</th>
                                <th className="px-3 py-2.5 text-xs font-semibold text-gray-500">Slug</th>
                                <th className="px-3 py-2.5 text-xs font-semibold text-gray-500">Status</th>
                                <th className="px-3 py-2.5 text-xs font-semibold text-gray-500 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="py-10 text-center">
                                        <div className="animate-spin h-7 w-7 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2" />
                                        <p className="text-sm text-gray-500">Loading...</p>
                                    </td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-10 text-center text-gray-500">
                                        <FolderTree className="h-10 w-10 mx-auto mb-2 text-gray-200" />
                                        <p className="text-sm">No categories found</p>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((c) => (
                                    <tr key={c.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-3 py-2.5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                                                    <FolderTree className="h-3.5 w-3.5 text-gray-400" />
                                                </div>
                                                <span className="text-xs font-semibold text-gray-900">{c.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-3 py-2.5 text-xs font-mono text-gray-500">{c.slug}</td>
                                        <td className="px-3 py-2.5">
                                            <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold border ${c.is_active ? 'bg-green-50 text-green-700 border-green-100' : 'bg-gray-50 text-gray-500 border-gray-100'}`}>
                                                {c.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2.5 text-right">
                                            <div className="flex justify-end gap-1.5">
                                                <button type="button" onClick={() => handleOpenModal(c)} className="w-7 h-7 bg-white border border-gray-100 rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-600 hover:border-blue-600 transition-all" aria-label="Edit"><Edit3 className="h-3 w-3" /></button>
                                                <button type="button" onClick={() => handleDelete(c.id)} className="w-7 h-7 bg-white border border-gray-100 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-100 hover:bg-red-50 transition-all" aria-label="Delete"><Trash2 className="h-3 w-3" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-white rounded-xl border border-gray-100 shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto overscroll-y-contain p-5" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-lg font-bold text-gray-900 mb-4">
                            {editingCategory ? 'Edit category' : 'New category'}
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
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Slug (optional)</label>
                                <input
                                    type="text"
                                    value={formData.slug}
                                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                    placeholder="Auto-generated from name"
                                    className="w-full h-10 px-3 border border-gray-100 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={2}
                                    className="w-full px-3 py-2 border border-gray-100 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Sort order</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.sort_order}
                                        onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })}
                                        className="w-full h-10 px-3 border border-gray-100 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Status</label>
                                    <select
                                        value={formData.is_active}
                                        onChange={(e) => setFormData({ ...formData, is_active: e.target.value })}
                                        className="w-full h-10 px-3 border border-gray-100 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    >
                                        <option value="true">Active</option>
                                        <option value="false">Inactive</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button
                                    type="submit"
                                    className="flex-1 h-10 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-gray-900"
                                >
                                    {editingCategory ? 'Update' : 'Create'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="h-10 px-4 border border-gray-200 rounded-lg font-semibold text-sm text-gray-600 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            </div>
        </DashboardLayout>
    );
}
