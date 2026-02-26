'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Users, Shield, Search, Mail, Calendar, Activity, Eye, Phone } from 'lucide-react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';

/** Convert phone to WhatsApp wa.me URL. Handles Ghana (0/233) and international (+country). */
function toWhatsAppUrl(phone: string | null | undefined): string | null {
    if (!phone || !phone.trim()) return null;
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 9) return null;
    const num = digits.startsWith('0') ? '233' + digits.slice(1) : digits;
    return `https://wa.me/${num}`;
}

const displayName = (u: any) => {
    const p = u?.profile;
    if (p?.first_name || p?.last_name) return `${p.first_name || ''} ${p.last_name || ''}`.trim();
    return u?.email ?? '—';
};

export default function AdminUsers() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchInput, setSearchInput] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async (search?: string) => {
        try {
            const params = search ? { search } : {};
            const { data } = await api.get('/users/admin/list', { params });
            setUsers(data?.data ?? []);
        } catch {
            toast.error('Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        fetchUsers(searchInput);
    };

    const handleRefresh = () => {
        setSearchInput('');
        setSearchTerm('');
        setLoading(true);
        fetchUsers('');
    };

    const filteredUsers = users.filter(
        (u) =>
            displayName(u).toLowerCase().includes(searchTerm.toLowerCase()) ||
            (u.email ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (u.phone ?? '').toString().includes(searchTerm)
    );

    const stats = [
        { label: 'Total', value: users.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
        { label: 'Admins', value: users.filter((u) => u.role === 'admin' || u.role === 'superadmin').length, icon: Shield, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100' },
        { label: 'Active', value: users.filter((u) => u.is_active !== false).length, icon: Activity, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
    ];

    return (
        <DashboardLayout isAdmin={true}>
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                    <Users className="h-7 w-7 text-blue-600" />
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Users</h1>
                        <p className="text-xs text-gray-500 mt-0.5">User directory</p>
                    </div>
                </div>
                <form onSubmit={handleSearch} className="flex gap-2 min-w-0">
                    <div className="relative flex-1 min-w-0">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search by email or phone..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="w-full h-9 bg-white border border-gray-100 rounded-lg pl-9 pr-3 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                    </div>
                    <button type="submit" className="h-9 px-4 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-gray-900 shrink-0">
                        Search
                    </button>
                    <button type="button" onClick={handleRefresh} className="h-9 px-4 border border-gray-200 rounded-lg font-semibold text-sm text-gray-500 hover:bg-gray-50 shrink-0">
                        Refresh
                    </button>
                </form>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                        <div className={`w-9 h-9 rounded-lg ${stat.bg} ${stat.border} border flex items-center justify-center ${stat.color} mb-2`}>
                            <stat.icon className="h-4 w-4" />
                        </div>
                        <p className="text-[10px] font-semibold text-gray-500 mb-0.5">{stat.label}</p>
                        <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                ))}
            </div>

            <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <input
                    type="text"
                    placeholder="Filter list..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full h-9 bg-white border border-gray-100 rounded-lg pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredUsers.map((user) => {
                    const name = displayName(user);
                    const isAdminRole = user.role === 'admin' || user.role === 'superadmin';
                    const isActive = user.is_active !== false;
                    const verified = user.is_verified === true;
                    const created = user.created_at ? new Date(user.created_at).toLocaleDateString() : '—';
                    const waUrl = toWhatsAppUrl(user.phone);
                    return (
                        <div key={user.id} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                            <div className="flex justify-between items-start mb-3">
                                <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-100 shrink-0">
                                    <Users className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                                </div>
                                <div className="flex flex-col items-end gap-1 min-w-0">
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-semibold uppercase shrink-0 ${isAdminRole ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                        {user.role ?? 'user'}
                                    </span>
                                    {verified && (
                                        <span className="flex items-center gap-1 bg-green-50 px-2 py-0.5 rounded text-[8px] font-semibold text-green-600 shrink-0">
                                            <Shield className="h-2.5 w-2.5" /> Verified
                                        </span>
                                    )}
                                </div>
                            </div>
                            <h3 className="text-sm font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors truncate">{name || 'No name'}</h3>
                            <p className="text-xs text-gray-500 flex items-center gap-1.5 truncate mb-1">
                                <Mail className="h-3 w-3 shrink-0" /> {user.email}
                            </p>
                            {user.phone && (
                                <p className="text-xs text-gray-500 flex items-center gap-1.5 truncate mb-2">
                                    <Phone className="h-3 w-3 shrink-0" />
                                    {waUrl ? (
                                        <a href={waUrl} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline truncate">
                                            {user.phone}
                                        </a>
                                    ) : (
                                        <span>{user.phone}</span>
                                    )}
                                </p>
                            )}
                            <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                                <span className="text-[9px] text-gray-400 flex items-center gap-1">
                                    <Calendar className="h-3 w-3 shrink-0" /> {created}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-[9px] font-semibold shrink-0 ${isActive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                    {isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                            <Link
                                href={`/admin/users/${user.id}`}
                                className="mt-2 pt-2 border-t border-gray-50 flex items-center justify-center gap-1.5 text-blue-600 hover:text-blue-800 text-xs font-semibold w-full"
                            >
                                <Eye className="h-3.5 w-3.5" /> View details
                            </Link>
                        </div>
                    );
                })}
            </div>

            {!loading && filteredUsers.length === 0 && (
                <div className="py-10 text-center bg-white rounded-xl border border-gray-100">
                    <Users className="h-10 w-10 mx-auto mb-2 text-gray-200" />
                    <p className="text-sm text-gray-500">No users found</p>
                </div>
            )}
        </DashboardLayout>
    );
}
