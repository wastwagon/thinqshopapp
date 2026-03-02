'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/axios';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
    ArrowLeft,
    User,
    Mail,
    Phone,
    Shield,
    Calendar,
    Activity,
    Package,
    MapPin,
    ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';

/** Convert phone to WhatsApp wa.me URL. Handles Ghana (0/233) and international (+country). */
function toWhatsAppUrl(phone: string | null | undefined): string | null {
    if (!phone || !phone.trim()) return null;
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 9) return null;
    const num = digits.startsWith('0') ? '233' + digits.slice(1) : digits;
    return `https://wa.me/${num}`;
}

interface UserDetail {
    id: number;
    email: string;
    phone?: string | null;
    user_identifier?: string | null;
    role: string;
    is_verified: boolean;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    profile?: { first_name?: string; last_name?: string; profile_image?: string };
    wallet?: { balance_ghs: number };
    _count?: { orders: number; addresses: number };
}

export default function AdminUserDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;
    const [user, setUser] = useState<UserDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const { data } = await api.get(`/users/admin/${id}`);
                setUser(data);
            } catch (err: any) {
                toast.error(err.response?.data?.message || 'Failed to load user');
                router.push('/admin/users');
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchUser();
    }, [id, router]);

    const displayName = user?.profile
        ? `${user.profile.first_name || ''} ${user.profile.last_name || ''}`.trim() || user.email
        : user?.email ?? '—';

    const whatsappUrl = toWhatsAppUrl(user?.phone);

    if (loading) {
        return (
            <DashboardLayout isAdmin={true}>
                <div className="p-6 pb-6 md:pb-8 text-center">
                    <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-3" />
                    <p className="text-sm text-gray-500">Loading user...</p>
                </div>
            </DashboardLayout>
        );
    }

    if (!user) return null;

    return (
        <DashboardLayout isAdmin={true}>
            <div className="pb-6 md:pb-8">
            <div className="mb-6 flex items-center justify-between gap-3">
                <Link
                    href="/admin/users"
                    className="text-blue-600 hover:text-gray-900 flex items-center text-sm font-medium transition-colors"
                >
                    <ArrowLeft className="h-4 w-4 mr-1.5" /> Users
                </Link>
            </div>

            <div className="space-y-6">
                {/* Header card */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-4 py-4 sm:px-6 border-b border-gray-50 flex flex-wrap justify-between items-start gap-4 bg-gray-50/50">
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">{displayName}</h1>
                            <p className="text-xs text-gray-500 mt-0.5">
                                {user.user_identifier ?? `ID ${user.id}`} · Joined {new Date(user.created_at).toLocaleDateString()}
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize ${user.role === 'admin' || user.role === 'superadmin' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                                {user.role}
                            </span>
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${user.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                                {user.is_active ? 'Active' : 'Inactive'}
                            </span>
                            {user.is_verified && (
                                <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 flex items-center gap-1">
                                    <Shield className="h-3 w-3" /> Verified
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Main content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Contact info */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/50">
                                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                    <User className="h-4 w-4" /> Contact details
                                </h3>
                            </div>
                            <div className="px-4 py-4 space-y-4">
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 mb-1">Email</p>
                                    <a href={`mailto:${user.email}`} className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                                        <Mail className="h-3.5 w-3.5" /> {user.email}
                                    </a>
                                </div>
                                {user.phone ? (
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 mb-1">Phone / WhatsApp</p>
                                        {whatsappUrl ? (
                                            <a
                                                href={whatsappUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg font-medium text-sm hover:bg-green-100 transition-colors"
                                            >
                                                <Phone className="h-4 w-4" /> {user.phone}
                                                <ExternalLink className="h-3.5 w-3.5" /> Chat on WhatsApp
                                            </a>
                                        ) : (
                                            <p className="text-sm text-gray-700 flex items-center gap-2">
                                                <Phone className="h-3.5 w-3.5" /> {user.phone}
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 mb-1">Phone / WhatsApp</p>
                                        <p className="text-sm text-gray-400">Not provided</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Stats */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/50">
                                <h3 className="text-sm font-semibold text-gray-900">Account</h3>
                            </div>
                            <div className="px-4 py-4 space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 flex items-center gap-2"><Calendar className="h-3.5 w-3.5" /> Joined</span>
                                    <span className="font-medium text-gray-900">{new Date(user.created_at).toLocaleDateString()}</span>
                                </div>
                                {user.wallet && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500 flex items-center gap-2">Wallet</span>
                                        <span className="font-medium text-gray-900">₵{Number(user.wallet.balance_ghs).toFixed(2)}</span>
                                    </div>
                                )}
                                {user._count && (
                                    <>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500 flex items-center gap-2"><Package className="h-3.5 w-3.5" /> Orders</span>
                                            <span className="font-medium text-gray-900">{user._count.orders}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500 flex items-center gap-2"><MapPin className="h-3.5 w-3.5" /> Addresses</span>
                                            <span className="font-medium text-gray-900">{user._count.addresses}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            </div>
        </DashboardLayout>
    );
}
