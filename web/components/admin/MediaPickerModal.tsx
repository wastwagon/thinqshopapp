'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { getMediaUrl } from '@/lib/media';
import { Loader2, X } from 'lucide-react';

type MediaItem = { id: number; filename: string; path: string; url: string };

interface MediaPickerModalProps {
    open: boolean;
    onClose: () => void;
    onSelect: (path: string) => void;
    onSelectMultiple?: (paths: string[]) => void;
    multiple?: boolean;
}

export default function MediaPickerModal({
    open,
    onClose,
    onSelect,
    onSelectMultiple,
    multiple = false,
}: MediaPickerModalProps) {
    const [items, setItems] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState<string[]>([]);

    useEffect(() => {
        if (!open) return;
        setSelected([]);
        setLoading(true);
        api.get('/media', { params: { limit: 60 } })
            .then(({ data }) => setItems(data?.data ?? []))
            .catch(() => setItems([]))
            .finally(() => setLoading(false));
    }, [open]);

    const toggle = (path: string) => {
        if (multiple) {
            setSelected((prev) =>
                prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
            );
        } else {
            onSelect(path);
            onClose();
        }
    };

    const handleUseSelected = () => {
        if (multiple && onSelectMultiple && selected.length) {
            onSelectMultiple(selected);
        }
        onClose();
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900">
                        {multiple ? 'Choose images' : 'Choose image'}
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto overscroll-y-contain scrollbar-thin p-4">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                        </div>
                    ) : items.length === 0 ? (
                        <p className="text-center text-gray-500 py-12">No media. Upload images in Media first.</p>
                    ) : (
                        <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                            {items.map((m) => {
                                const path = m.path || m.url;
                                const isSelected = multiple && selected.includes(path);
                                return (
                                    <button
                                        key={m.id}
                                        type="button"
                                        onClick={() => toggle(path)}
                                        className={`aspect-square rounded-xl border-2 overflow-hidden bg-gray-50 transition-all ${
                                            isSelected ? 'border-blue-600 ring-2 ring-blue-200' : 'border-gray-100 hover:border-gray-200'
                                        }`}
                                    >
                                        <img
                                            src={getMediaUrl(path)}
                                            alt={m.filename}
                                            className="w-full h-full object-contain"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%239ca3af" stroke-width="1.5"%3E%3Crect x="3" y="3" width="18" height="18" rx="2"/%3E%3Ccircle cx="8.5" cy="8.5" r="1.5"/%3E%3Cpath d="M21 15l-5-5L5 21"/%3E%3C/svg%3E';
                                                (e.target as HTMLImageElement).onerror = null;
                                            }}
                                        />
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
                {multiple && (
                    <div className="p-4 border-t border-gray-100 flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="h-10 px-4 rounded-xl border border-gray-200 text-sm font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleUseSelected}
                            disabled={selected.length === 0}
                            className="h-10 px-4 rounded-xl bg-blue-600 text-white text-sm font-medium disabled:opacity-50"
                        >
                            Use {selected.length} selected
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
