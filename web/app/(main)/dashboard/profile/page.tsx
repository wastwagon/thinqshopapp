'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
    User,
    Phone,
    Shield,
    Save,
    Camera,
    Lock,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import api from '@/lib/axios';

export default function ProfilePage() {
    const { user, refreshUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        first_name: user?.first_name || '',
        last_name: user?.last_name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        ghana_card: (user as any)?.ghana_card || '',
        voter_id: (user as any)?.voter_id || '',
        profile_image: (user as any)?.profile_image || '',
    });

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                email: user.email || '',
                phone: user.phone || '',
                ghana_card: (user as any)?.ghana_card || '',
                voter_id: (user as any)?.voter_id || '',
                profile_image: (user as any)?.profile_image || '',
            }));
        }
    }, [user]);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.patch('/users/profile', {
                first_name: formData.first_name,
                last_name: formData.last_name,
                phone: formData.phone,
                ghana_card: formData.ghana_card,
                voter_id: formData.voter_id,
                profile_image: formData.profile_image?.trim() || null,
            });
            await refreshUser();
            toast.success('Profile updated');
        } catch (error) {
            toast.error('Update failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="pb-6 md:pb-8">
            <div className="mb-6 flex items-center gap-3">
                <User className="h-8 w-8 text-blue-600" />
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight leading-tight">Profile</h1>
                    <p className="text-xs text-blue-600 flex items-center gap-1.5 mt-0.5">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                        Active
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-4">
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center">
                        <div className="relative inline-block mb-4">
                            <div className="w-24 h-24 rounded-2xl bg-gray-100 flex items-center justify-center overflow-hidden relative">
                                {formData.profile_image ? (
                                    <Image
                                        src={formData.profile_image}
                                        alt=""
                                        fill
                                        className="object-cover"
                                        sizes="96px"
                                        unoptimized={formData.profile_image.startsWith('http')}
                                    />
                                ) : (
                                    <User className="h-10 w-10 text-gray-400" />
                                )}
                            </div>
                            <span className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center border-2 border-white pointer-events-none">
                                <Camera className="h-3.5 w-3.5" />
                            </span>
                        </div>
                        <p className="text-[10px] text-gray-500 mb-2">Add a photo via URL below</p>
                        <h2 className="text-lg font-bold text-gray-900 mb-1">{formData.first_name || '—'} {formData.last_name || '—'}</h2>
                        <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-2">{user?.role || 'User'}</p>
                        <div className="px-2 py-1 bg-gray-50 rounded-lg border border-gray-100 inline-block">
                            <p className="text-[9px] font-semibold text-gray-600">ID: {user?.user_identifier || '—'}</p>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-50">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-100 text-[10px] font-semibold text-emerald-600">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                Verified
                            </span>
                        </div>
                    </div>

                    <div className="mt-4 bg-gray-900 rounded-2xl p-5 text-white">
                        <h3 className="text-[10px] font-semibold uppercase tracking-wider text-blue-300 mb-3 flex items-center gap-2">
                            <Shield className="h-3 w-3" /> Security
                        </h3>
                        <p className="text-xs text-white/70 leading-relaxed mb-4">Your data is encrypted and secure.</p>
                        <button type="button" className="text-[10px] font-semibold text-white flex items-center gap-2 hover:text-blue-300 transition-colors">
                            <Lock className="h-3 w-3" /> Change password
                        </button>
                    </div>
                </div>

                <div className="lg:col-span-8">
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                        <div className="mb-6">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Details</h3>
                            <p className="text-base font-bold text-gray-900">Personal information</p>
                        </div>

                        <form onSubmit={handleUpdate} className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider ml-1 mb-1.5 block">First name</label>
                                    <input
                                        type="text"
                                        value={formData.first_name}
                                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider ml-1 mb-1.5 block">Last name</label>
                                    <input
                                        type="text"
                                        value={formData.last_name}
                                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider ml-1 mb-1.5 block">Email</label>
                                    <div className="relative">
                                        <input
                                            type="email"
                                            disabled
                                            value={formData.email}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium text-gray-400 cursor-not-allowed"
                                        />
                                        <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-300" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider ml-1 mb-1.5 block">WhatsApp / Phone</label>
                                    <input
                                        type="text"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider ml-1 mb-1.5 block">Profile image URL <span className="text-gray-400 font-normal">(optional)</span></label>
                                    <input
                                        type="url"
                                        value={formData.profile_image}
                                        onChange={(e) => setFormData({ ...formData, profile_image: e.target.value })}
                                        placeholder="https://example.com/your-photo.jpg"
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white"
                                    />
                                </div>
                            </div>

                            <div className="pt-5 border-t border-gray-50">
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-4 flex items-center gap-2">
                                    <Shield className="h-3.5 w-3.5 text-blue-600" />
                                    ID (optional)
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider ml-1 mb-1.5 block">Ghana Card</label>
                                        <input
                                            type="text"
                                            value={formData.ghana_card || ''}
                                            onChange={(e) => setFormData({ ...formData, ghana_card: e.target.value })}
                                            placeholder="GHA-123456789-0"
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium text-gray-900 focus:bg-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider ml-1 mb-1.5 block">Voter ID</label>
                                        <input
                                            type="text"
                                            value={formData.voter_id || ''}
                                            onChange={(e) => setFormData({ ...formData, voter_id: e.target.value })}
                                            placeholder="Optional"
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium text-gray-900 focus:bg-white"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-5 border-t border-gray-50 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="h-10 px-6 bg-gray-900 text-white rounded-xl font-semibold text-sm hover:bg-blue-600 transition-all flex items-center gap-2 disabled:opacity-50"
                                >
                                    {loading ? 'Saving...' : 'Save changes'}
                                    <Save className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            </div>
        </DashboardLayout>
    );
}
