'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Users, Shield, Search, Mail, Calendar, Activity, Eye, Phone, Plus, X, ChevronRight } from 'lucide-react';
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
    const [addUserOpen, setAddUserOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [addUserForm, setAddUserForm] = useState({
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        phone: '',
    });

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

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!addUserForm.email.trim() || !addUserForm.password.trim() || !addUserForm.first_name.trim() || !addUserForm.last_name.trim()) {
            toast.error('Email/phone, password, first name and last name are required');
            return;
        }
        if (addUserForm.password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }
        setSubmitting(true);
        try {
            await api.post('/auth/admin/register', {
                email: addUserForm.email.trim(),
                password: addUserForm.password,
                first_name: addUserForm.first_name.trim(),
                last_name: addUserForm.last_name.trim(),
                phone: addUserForm.phone.trim() || undefined,
            });
            toast.success('User created');
            setAddUserOpen(false);
            setAddUserForm({ email: '', password: '', first_name: '', last_name: '', phone: '' });
            fetchUsers('');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to create user');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredUsers = users.filter(
        (u) =>
            displayName(u).toLowerCase().includes(searchTerm.toLowerCase()) ||
            (u.email ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (u.phone ?? '').toString().includes(searchTerm)
    );

    const stats = [
        { label: 'Total', value: users.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
        { label: 'Admins', value: users.filter((u) => u.role === 'admin' || u.role === 'superadmin').length, icon: Shield, color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-100' },
        { label: 'Active', value: users.filter((u) => u.is_active !== false).length, icon: Activity, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
    ];

    return (
        <DashboardLayout isAdmin={true}>
            <div className="pb-6 md:pb-8">
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                    <Users className="h-7 w-7 text-blue-600" />
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Users</h1>
                        <p className="text-xs text-gray-500 mt-0.5">User directory</p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setAddUserOpen(true)}
                        className="h-9 px-4 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-gray-900 shrink-0 flex items-center gap-1.5"
                    >
                        <Plus className="h-4 w-4" /> Add user
                    </button>
                    <form onSubmit={handleSearch} className="flex gap-2 min-w-0 flex-1">
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
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                        <div className={`w-9 h-9 rounded-lg ${stat.bg} ${stat.border} border flex items-center justify-center ${stat.color} mb-2`}>
                            <stat.icon className="h-4 w-4" />
                        </div>
                        <p className="text-xs font-semibold text-gray-500 mb-0.5">{stat.label}</p>
                        <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                ))}
            </div>

            <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <input
                    type="text"
                    placeholder="Filter list..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full h-9 bg-white border border-gray-100 rounded-lg pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/80 border-b border-gray-100">
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Email</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Phone</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Status</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Joined</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-500">
                                        Loading users...
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center">
                                        <Users className="h-10 w-10 mx-auto mb-2 text-gray-200" />
                                        <p className="text-sm text-gray-500">No users found</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => {
                                    const name = displayName(user);
                                    const isAdminRole = user.role === 'admin' || user.role === 'superadmin';
                                    const isActive = user.is_active !== false;
                                    const verified = user.is_verified === true;
                                    const created = user.created_at ? new Date(user.created_at).toLocaleDateString() : '—';
                                    const waUrl = toWhatsAppUrl(user.phone);
                                    return (
                                        <tr key={user.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-100 shrink-0 group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors">
                                                        <Users className="h-4 w-4 text-gray-500 group-hover:text-blue-600 transition-colors" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-gray-900 truncate">{name || 'No name'}</p>
                                                        <p className="text-xs text-gray-500 truncate sm:hidden">{user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 hidden sm:table-cell">
                                                <a href={`mailto:${user.email}`} className="text-sm text-gray-600 hover:text-blue-600 truncate block max-w-[180px]">
                                                    {user.email}
                                                </a>
                                            </td>
                                            <td className="px-4 py-3 hidden md:table-cell">
                                                {user.phone ? (
                                                    waUrl ? (
                                                        <a href={waUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-green-600 hover:underline">
                                                            {user.phone}
                                                        </a>
                                                    ) : (
                                                        <span className="text-sm text-gray-600">{user.phone}</span>
                                                    )
                                                ) : (
                                                    <span className="text-sm text-gray-400">—</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold ${isAdminRole ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                                                    {verified && <Shield className="h-3 w-3" />}
                                                    {(user.role ?? 'user').replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 hidden lg:table-cell">
                                                <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                                                    {isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 hidden md:table-cell text-sm text-gray-500">
                                                {created}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <Link
                                                    href={`/admin/users/${user.id}`}
                                                    className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
                                                >
                                                    View <ChevronRight className="h-4 w-4" />
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {addUserOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setAddUserOpen(false)}>
                    <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold text-gray-900">Add new user</h2>
                            <button type="button" onClick={() => setAddUserOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <form onSubmit={handleAddUser} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Email or phone *</label>
                                <input
                                    type="text"
                                    value={addUserForm.email}
                                    onChange={(e) => setAddUserForm((f) => ({ ...f, email: e.target.value }))}
                                    placeholder="user@example.com or +233..."
                                    className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Password * (min 6 characters)</label>
                                <input
                                    type="password"
                                    value={addUserForm.password}
                                    onChange={(e) => setAddUserForm((f) => ({ ...f, password: e.target.value }))}
                                    className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    required
                                    minLength={6}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">First name *</label>
                                    <input
                                        type="text"
                                        value={addUserForm.first_name}
                                        onChange={(e) => setAddUserForm((f) => ({ ...f, first_name: e.target.value }))}
                                        className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Last name *</label>
                                    <input
                                        type="text"
                                        value={addUserForm.last_name}
                                        onChange={(e) => setAddUserForm((f) => ({ ...f, last_name: e.target.value }))}
                                        className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Phone (optional, if email used above)</label>
                                <input
                                    type="text"
                                    value={addUserForm.phone}
                                    onChange={(e) => setAddUserForm((f) => ({ ...f, phone: e.target.value }))}
                                    placeholder="+233..."
                                    className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="submit" disabled={submitting} className="flex-1 h-10 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-gray-900 disabled:opacity-50">
                                    {submitting ? 'Creating...' : 'Create user'}
                                </button>
                                <button type="button" onClick={() => setAddUserOpen(false)} className="h-10 px-4 border border-gray-200 rounded-lg font-semibold text-sm text-gray-600 hover:bg-gray-50">
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
