'use client';

import React, { useEffect, useState, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Search, Upload, Image as ImageIcon, Trash2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/axios';
import { getMediaUrl } from '@/lib/media';

type MediaItem = {
    id: number;
    filename: string;
    path: string;
    url: string;
    mime_type?: string;
    size_bytes?: number;
    created_at: string;
};

export default function AdminMediaPage() {
    const [items, setItems] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [uploading, setUploading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchMedia = async () => {
        try {
            const { data } = await api.get('/media', {
                params: { page, limit: 48, search: search || undefined },
            });
            setItems(data?.data ?? []);
            setTotalPages(data?.meta?.totalPages ?? 1);
        } catch (e) {
            toast.error('Failed to load media');
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setLoading(true);
        fetchMedia();
    }, [page, search]);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image (JPEG, PNG, GIF, WebP, SVG)');
            return;
        }
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const { data } = await api.post('/media/upload', formData, {
                headers: { 'Content-Type': undefined },
            });
            if (data?.url) {
                toast.success('Uploaded');
                fetchMedia();
            } else {
                toast.error(data?.error || 'Upload failed');
            }
        } catch (err) {
            toast.error('Upload failed');
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this file from the media library?')) return;
        try {
            await api.delete(`/media/${id}`);
            toast.success('Deleted');
            setItems((prev) => prev.filter((m) => m.id !== id));
        } catch {
            toast.error('Failed to delete');
        }
    };

    return (
        <DashboardLayout isAdmin={true}>
            <div className="pb-6 md:pb-8">
            <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div className="flex items-center gap-3">
                    <ImageIcon className="h-8 w-8 text-blue-600" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight leading-tight">Media</h1>
                        <p className="text-xs text-blue-600 flex items-center gap-1.5 mt-0.5">
                            Upload and reuse images across products
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search files..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="h-10 pl-9 pr-4 border border-gray-100 rounded-xl text-sm font-medium w-48 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                        className="hidden"
                        onChange={handleUpload}
                    />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="h-10 px-5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-gray-900 transition-all flex items-center gap-2 disabled:opacity-60"
                    >
                        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        Upload
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="py-20 flex justify-center">
                        <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
                    </div>
                ) : items.length === 0 ? (
                    <div className="py-20 text-center">
                        <ImageIcon className="h-14 w-14 mx-auto mb-4 text-gray-200" />
                        <p className="text-gray-500 font-medium">No media yet</p>
                        <p className="text-sm text-gray-400 mt-1">Upload images to use in products and across the site.</p>
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="mt-4 h-10 px-5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-gray-900"
                        >
                            Upload image
                        </button>
                    </div>
                ) : (
                    <div className="p-4 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                        {items.map((m) => (
                            <div
                                key={m.id}
                                className="group relative rounded-xl border border-gray-100 overflow-hidden bg-gray-50 aspect-square"
                            >
                                <img
                                    src={getMediaUrl(m.path || m.url)}
                                    alt={m.filename}
                                    className="w-full h-full object-contain"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%239ca3af" stroke-width="1.5"%3E%3Crect x="3" y="3" width="18" height="18" rx="2"/%3E%3Ccircle cx="8.5" cy="8.5" r="1.5"/%3E%3Cpath d="M21 15l-5-5L5 21"/%3E%3C/svg%3E';
                                        (e.target as HTMLImageElement).onerror = null;
                                    }}
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(m.id)}
                                        className="w-9 h-9 rounded-lg bg-red-500 text-white flex items-center justify-center hover:bg-red-600"
                                        aria-label="Delete"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                                <p className="absolute bottom-0 left-0 right-0 text-[10px] text-white bg-gradient-to-t from-black/70 to-transparent p-2 truncate">
                                    {m.filename}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
                {totalPages > 1 && (
                    <div className="flex justify-center gap-2 py-4 border-t border-gray-50">
                        <button
                            type="button"
                            disabled={page <= 1}
                            onClick={() => setPage((p) => p - 1)}
                            className="h-9 px-4 rounded-lg border border-gray-200 text-sm font-medium disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <span className="flex items-center px-4 text-sm text-gray-500">
                            Page {page} of {totalPages}
                        </span>
                        <button
                            type="button"
                            disabled={page >= totalPages}
                            onClick={() => setPage((p) => p + 1)}
                            className="h-9 px-4 rounded-lg border border-gray-200 text-sm font-medium disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
            </div>
        </DashboardLayout>
    );
}
