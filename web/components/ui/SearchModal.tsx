'use client';

import { useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import SearchWithSuggestions from './SearchWithSuggestions';

interface SearchModalProps {
    open: boolean;
    onClose: () => void;
}

export default function SearchModal({ open, onClose }: SearchModalProps) {
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
            setTimeout(() => panelRef.current?.querySelector<HTMLInputElement>('input')?.focus(), 100);
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [open]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 pb-4 bg-black/50 backdrop-blur-sm transition-opacity duration-200"
            onClick={(e) => e.target === e.currentTarget && onClose()}
            role="dialog"
            aria-modal="true"
            aria-label="Search products"
        >
            <div
                ref={panelRef}
                className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl shadow-gray-900/20 border border-gray-100 overflow-visible"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center gap-4 px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50/80 to-white">
                    <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gray-900 text-white shrink-0">
                        <Search className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-semibold text-gray-900">Search products</h2>
                        <p className="text-sm text-gray-500">Type to find cameras, computers, and more</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors shrink-0"
                        aria-label="Close search"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Search input + suggestions */}
                <div className="p-6">
                    <SearchWithSuggestions
                        id="search-modal-input"
                        className="[&_input]:h-14 [&_input]:pl-14 [&_input]:rounded-2xl [&_input]:text-base [&_input]:border-gray-200 [&_input]:bg-gray-50"
                        placeholder="Search products..."
                        onNavigate={onClose}
                    />
                </div>
            </div>
        </div>
    );
}
