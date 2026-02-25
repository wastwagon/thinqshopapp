'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search } from 'lucide-react';
import api from '@/lib/axios';
import { normalizeProduct, toSlug } from '@/lib/product-utils';
import staticProducts from '@/lib/data/scraped_products.json';

interface SearchWithSuggestionsProps {
    id?: string;
    className?: string;
    inputClassName?: string;
    placeholder?: string;
    mobile?: boolean;
    /** Callback when user navigates (e.g. selects a product). Use to close modal. */
    onNavigate?: () => void;
}

function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const t = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(t);
    }, [value, delay]);
    return debouncedValue;
}

export default function SearchWithSuggestions({ id = 'nav-search', className = '', inputClassName = '', placeholder = 'Search products...', mobile = false, onNavigate }: SearchWithSuggestionsProps) {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);
    const debouncedQuery = useDebounce(query.trim(), 300);

    useEffect(() => {
        if (!debouncedQuery || debouncedQuery.length < 2) {
            setSuggestions([]);
            setLoading(false);
            return;
        }
        let cancelled = false;
        setLoading(true);
        const fetchSuggestions = async () => {
            try {
                const { data } = await api.get('/products', { params: { search: debouncedQuery, limit: 6 } });
                const list = data?.data ?? [];
                if (cancelled) return;
                if (Array.isArray(list) && list.length > 0) {
                    setSuggestions(list.map((p: any, i: number) => normalizeProduct(p, i)));
                } else {
                    const normalized = (staticProducts as any[]).map((p, i) => normalizeProduct({ ...p, id: p.id ?? i + 1 }, i));
                    const q = debouncedQuery.toLowerCase();
                    const filtered = normalized.filter(
                        (p) =>
                            (p.name || '').toLowerCase().includes(q) ||
                            (p.description || '').toLowerCase().includes(q) ||
                            (typeof p.category === 'string' && p.category.toLowerCase().includes(q))
                    );
                    setSuggestions(filtered.slice(0, 6));
                }
            } catch (_) {
                if (cancelled) return;
                const normalized = (staticProducts as any[]).map((p, i) => normalizeProduct({ ...p, id: p.id ?? i + 1 }, i));
                const q = debouncedQuery.toLowerCase();
                const filtered = normalized.filter(
                    (p) =>
                        (p.name || '').toLowerCase().includes(q) ||
                        (p.description || '').toLowerCase().includes(q) ||
                        (typeof p.category === 'string' && p.category.toLowerCase().includes(q))
                );
                setSuggestions(filtered.slice(0, 6));
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        fetchSuggestions();
        return () => { cancelled = true; };
    }, [debouncedQuery]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setShowDropdown(false);
        if (query.trim()) {
            onNavigate?.();
            router.push(`/shop?search=${encodeURIComponent(query.trim())}`);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!showDropdown || suggestions.length === 0) {
            if (e.key === 'Escape') setShowDropdown(false);
            return;
        }
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex((i) => Math.min(i + 1, suggestions.length));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex((i) => Math.max(i - 1, -1));
        } else if (e.key === 'Enter' && activeIndex >= 0 && suggestions[activeIndex]) {
            e.preventDefault();
            const p = suggestions[activeIndex];
            const slug = p.slug ?? toSlug(p.name);
            onNavigate?.();
            router.push(`/products/${slug}`);
            setShowDropdown(false);
            setQuery('');
        } else if (e.key === 'Escape') {
            setShowDropdown(false);
            setActiveIndex(-1);
        }
    };

    const baseInputClass = mobile
        ? 'w-full h-14 pl-14 pr-6 bg-gray-50 border border-gray-200 rounded-2xl text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
        : 'w-full h-11 bg-gray-50 border border-gray-200 rounded-full px-6 pl-12 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all';

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            <form onSubmit={handleSubmit} role="search" aria-label="Search products">
                <label htmlFor={id} className="sr-only">Search products</label>
                <div className="relative">
                    <input
                        id={id}
                        type="search"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setShowDropdown(true);
                            setActiveIndex(-1);
                        }}
                        onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        autoComplete="off"
                        className={`${baseInputClass} ${inputClassName}`}
                        aria-label="Search products"
                        aria-autocomplete="list"
                        aria-controls="search-suggestions"
                        aria-expanded={showDropdown && suggestions.length > 0}
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" aria-hidden />
                </div>
            </form>

            {showDropdown && (suggestions.length > 0 || loading) && (
                <div
                    id="search-suggestions"
                    role="listbox"
                    className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl shadow-gray-200/50 z-[100] overflow-hidden"
                >
                    {loading ? (
                        <div className="px-4 py-6 text-center text-sm text-gray-500">Searching...</div>
                    ) : (
                        <ul className="py-2">
                            {suggestions.map((p, idx) => {
                                const slug = p.slug ?? toSlug(p.name);
                                const price = typeof p.price === 'string' ? p.price : `₵${Number(p.price || 0).toFixed(2)}`;
                                return (
                                    <li key={p.id ?? idx} role="option" aria-selected={activeIndex === idx}>
                                        <Link
                                            href={`/products/${slug}`}
                                            className={`block px-4 py-3 hover:bg-gray-50 transition-colors ${activeIndex === idx ? 'bg-gray-50' : ''}`}
                                            onClick={() => {
                                                setShowDropdown(false);
                                                setQuery('');
                                                onNavigate?.();
                                            }}
                                        >
                                            <p className="font-medium text-gray-900 truncate">{p.name}</p>
                                            <p className="text-xs text-gray-500 truncate">{p.category} · {price}</p>
                                        </Link>
                                    </li>
                                );
                            })}
                            <li className="border-t border-gray-100">
                                <Link
                                    href={`/shop?search=${encodeURIComponent(debouncedQuery)}`}
                                    className="block px-4 py-3 text-sm font-medium text-blue-600 hover:bg-blue-50"
                                    onClick={() => {
                                        setShowDropdown(false);
                                        onNavigate?.();
                                    }}
                                >
                                    View all results for &quot;{debouncedQuery}&quot;
                                </Link>
                            </li>
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}
