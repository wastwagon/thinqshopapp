'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
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
import FormField from '@/components/ui/FormField';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { Users, Shield, Activity, ChevronRight, Plus } from 'lucide-react';
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

const formatCmsLabel = (value?: string | null): string =>
    (value || '')
        .replace(/_/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/\b\w/g, (c) => c.toUpperCase()) || '—';

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
        if (
            !addUserForm.email.trim() ||
            !addUserForm.password.trim() ||
            !addUserForm.first_name.trim() ||
            !addUserForm.last_name.trim()
        ) {
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
        {
            label: 'Total',
            value: users.length,
            icon: Users,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            border: 'border-blue-200',
        },
        {
            label: 'Admins',
            value: users.filter((u) => u.role === 'admin' || u.role === 'superadmin').length,
            icon: Shield,
            color: 'text-orange-500',
            bg: 'bg-orange-50',
            border: 'border-orange-100',
        },
        {
            label: 'Active',
            value: users.filter((u) => u.is_active !== false).length,
            icon: Activity,
            color: 'text-green-600',
            bg: 'bg-green-50',
            border: 'border-green-100',
        },
    ];

    return (
        <DashboardLayout isAdmin={true}>
            <div className="pb-6 md:pb-8">
                <AdminPageHeader
                    icon={Users}
                    title="Users"
                    subtitle="Manage customer and team accounts"
                    actions={
                        <form onSubmit={handleSearch}>
                            <AdminToolbar
                                searchValue={searchInput}
                                onSearchChange={setSearchInput}
                                searchPlaceholder="Search name, email, phone…"
                                searchAriaLabel="Search users"
                            >
                                <Button type="submit" size="sm">
                                    Search
                                </Button>
                                <Button type="button" size="sm" variant="secondary" onClick={handleRefresh}>
                                    Refresh
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    leftIcon={<Plus className="h-3.5 w-3.5" />}
                                    onClick={() => setAddUserOpen(true)}
                                >
                                    Add user
                                </Button>
                            </AdminToolbar>
                        </form>
                    }
                />

                <AdminStatGrid items={stats} columns={3} />

                <div className="mb-4">
                    <AdminToolbar
                        searchValue={searchTerm}
                        onSearchChange={setSearchTerm}
                        searchPlaceholder="Quick filter within loaded users…"
                        searchAriaLabel="Filter loaded users"
                        className="w-full [&>div]:flex-1 [&>div]:sm:flex-1 [&>div]:sm:w-full [&>div_input]:sm:w-full"
                    />
                </div>

                <AdminTable>
                    <AdminTableHead>
                        <AdminTh>User</AdminTh>
                        <AdminTh className="hidden sm:table-cell">Email</AdminTh>
                        <AdminTh className="hidden md:table-cell">Phone</AdminTh>
                        <AdminTh>Role</AdminTh>
                        <AdminTh className="hidden lg:table-cell">Status</AdminTh>
                        <AdminTh className="hidden md:table-cell">Joined</AdminTh>
                        <AdminTh align="right">Action</AdminTh>
                    </AdminTableHead>
                    <AdminTableBody>
                        {loading ? (
                            <AdminTableLoading colSpan={7} label="Loading users…" />
                        ) : filteredUsers.length === 0 ? (
                            <AdminTableEmpty
                                colSpan={7}
                                icon={<Users className="h-10 w-10 mx-auto mb-2 text-gray-200" />}
                                message="No users found"
                            />
                        ) : (
                            filteredUsers.map((user) => {
                                const name = displayName(user);
                                const isAdminRole =
                                    user.role === 'admin' || user.role === 'superadmin';
                                const isActive = user.is_active !== false;
                                const verified = user.is_verified === true;
                                const created = user.created_at
                                    ? new Date(user.created_at).toLocaleDateString()
                                    : '—';
                                const waUrl = toWhatsAppUrl(user.phone);
                                return (
                                    <AdminTr key={user.id} className="group">
                                        <AdminTd>
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-100 shrink-0 group-hover:bg-blue-50 group-hover:border-blue-200 transition-colors">
                                                    <Users className="h-4 w-4 text-gray-500 group-hover:text-brand transition-colors" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-gray-900 truncate">
                                                        {name || 'No name'}
                                                    </p>
                                                    <p className="text-xs text-gray-500 truncate sm:hidden">
                                                        {user.email}
                                                    </p>
                                                </div>
                                            </div>
                                        </AdminTd>
                                        <AdminTd className="hidden sm:table-cell">
                                            <a
                                                href={`mailto:${user.email}`}
                                                className="text-sm text-gray-600 hover:text-brand truncate block max-w-[180px]"
                                            >
                                                {user.email}
                                            </a>
                                        </AdminTd>
                                        <AdminTd className="hidden md:table-cell">
                                            {user.phone ? (
                                                waUrl ? (
                                                    <a
                                                        href={waUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-sm text-emerald-600 hover:underline"
                                                    >
                                                        {user.phone}
                                                    </a>
                                                ) : (
                                                    <span className="text-sm text-gray-600">
                                                        {user.phone}
                                                    </span>
                                                )
                                            ) : (
                                                <span className="text-sm text-gray-400">—</span>
                                            )}
                                        </AdminTd>
                                        <AdminTd>
                                            <Badge variant={isAdminRole ? 'brand' : 'default'}>
                                                {verified && <Shield className="h-3 w-3" />}
                                                {formatCmsLabel(user.role ?? 'user')}
                                            </Badge>
                                        </AdminTd>
                                        <AdminTd className="hidden lg:table-cell">
                                            <Badge variant={isActive ? 'success' : 'danger'}>
                                                {isActive ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </AdminTd>
                                        <AdminTd className="hidden md:table-cell text-sm text-gray-500">
                                            {created}
                                        </AdminTd>
                                        <AdminTd className="text-right">
                                            <Link
                                                href={`/admin/users/${user.id}`}
                                                className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:text-brand/80"
                                            >
                                                View <ChevronRight className="h-4 w-4" />
                                            </Link>
                                        </AdminTd>
                                    </AdminTr>
                                );
                            })
                        )}
                    </AdminTableBody>
                </AdminTable>

                <Modal
                    open={addUserOpen}
                    onClose={() => setAddUserOpen(false)}
                    title="Add new user"
                    footer={
                        <>
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => setAddUserOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                form="add-user-form"
                                loading={submitting}
                                disabled={submitting}
                            >
                                Create user
                            </Button>
                        </>
                    }
                >
                    <form id="add-user-form" onSubmit={handleAddUser} className="space-y-4">
                        <FormField label="Email or phone" htmlFor="add-email" required>
                            <Input
                                id="add-email"
                                type="text"
                                value={addUserForm.email}
                                onChange={(e) =>
                                    setAddUserForm((f) => ({ ...f, email: e.target.value }))
                                }
                                placeholder="user@example.com or +233..."
                                required
                            />
                        </FormField>
                        <FormField
                            label="Password"
                            htmlFor="add-password"
                            hint="Minimum 6 characters"
                            required
                        >
                            <Input
                                id="add-password"
                                type="password"
                                value={addUserForm.password}
                                onChange={(e) =>
                                    setAddUserForm((f) => ({ ...f, password: e.target.value }))
                                }
                                required
                                minLength={6}
                            />
                        </FormField>
                        <div className="grid grid-cols-2 gap-3">
                            <FormField label="First name" htmlFor="add-first" required>
                                <Input
                                    id="add-first"
                                    type="text"
                                    value={addUserForm.first_name}
                                    onChange={(e) =>
                                        setAddUserForm((f) => ({
                                            ...f,
                                            first_name: e.target.value,
                                        }))
                                    }
                                    required
                                />
                            </FormField>
                            <FormField label="Last name" htmlFor="add-last" required>
                                <Input
                                    id="add-last"
                                    type="text"
                                    value={addUserForm.last_name}
                                    onChange={(e) =>
                                        setAddUserForm((f) => ({
                                            ...f,
                                            last_name: e.target.value,
                                        }))
                                    }
                                    required
                                />
                            </FormField>
                        </div>
                        <FormField
                            label="Phone"
                            htmlFor="add-phone"
                            hint="Optional if email used above"
                        >
                            <Input
                                id="add-phone"
                                type="text"
                                value={addUserForm.phone}
                                onChange={(e) =>
                                    setAddUserForm((f) => ({ ...f, phone: e.target.value }))
                                }
                                placeholder="+233..."
                            />
                        </FormField>
                    </form>
                </Modal>
            </div>
        </DashboardLayout>
    );
}
