'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Link from 'next/link';
import {
    User,
    Shield,
    Save,
    Camera,
    Lock,
    Trash2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import api from '@/lib/axios';
import { getMediaUrl } from '@/lib/media';
import ChangePasswordForm from '@/components/auth/ChangePasswordForm';

export default function ProfilePage() {
    const { user, refreshUser } = useAuth();
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [avatarUploading, setAvatarUploading] = useState(false);
    const [pendingPreview, setPendingPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        first_name: user?.first_name || '',
        last_name: user?.last_name || '',
        email: user?.email || '',
        phone: user?.phone || '',
    });

    useEffect(() => {
        if (user) {
            setFormData({
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                email: user.email || '',
                phone: user.phone || '',
            });
        }
    }, [user]);

    useEffect(() => {
        return () => {
            if (pendingPreview) URL.revokeObjectURL(pendingPreview);
        };
    }, [pendingPreview]);

    const avatarDisplaySrc = pendingPreview || getMediaUrl(user?.profile_image);
    const showAvatarImage = Boolean(avatarDisplaySrc);

    const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            toast.error('Please choose an image file');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image must be 5MB or smaller');
            return;
        }
        if (pendingPreview) URL.revokeObjectURL(pendingPreview);
        setPendingPreview(URL.createObjectURL(file));
        setAvatarUploading(true);
        try {
            const fd = new FormData();
            fd.append('file', file);
            await api.post('/users/profile/avatar', fd, { headers: { 'Content-Type': undefined } });
            await refreshUser();
            setPendingPreview((prev) => {
                if (prev) URL.revokeObjectURL(prev);
                return null;
            });
            toast.success('Profile photo updated');
        } catch {
            setPendingPreview(null);
            toast.error('Photo upload failed');
        } finally {
            setAvatarUploading(false);
        }
    };

    const handleRemovePhoto = async () => {
        setAvatarUploading(true);
        try {
            await api.patch('/users/profile', { profile_image: null });
            await refreshUser();
            if (pendingPreview) URL.revokeObjectURL(pendingPreview);
            setPendingPreview(null);
            toast.success('Profile photo removed');
        } catch {
            toast.error('Could not remove photo');
        } finally {
            setAvatarUploading(false);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.patch('/users/profile', {
                first_name: formData.first_name,
                last_name: formData.last_name,
                phone: formData.phone,
            });
            await refreshUser();
            toast.success('Profile updated');
        } catch {
            toast.error('Update failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="pb-6 md:pb-8">
            <header className="mb-5 px-1">
                <h1 className="page-title">Profile</h1>
                <p className="page-subtitle">Personal details and security</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-4">
                    <div className="flat-card p-6 text-center">
                        <div className="relative inline-block mb-4">
                            <div className="w-24 h-24 rounded-2xl bg-gray-100 flex items-center justify-center overflow-hidden relative">
                                {showAvatarImage ? (
                                    <Image
                                        src={avatarDisplaySrc}
                                        alt=""
                                        fill
                                        className="object-cover"
                                        sizes="96px"
                                        unoptimized={
                                            avatarDisplaySrc.startsWith('http') ||
                                            avatarDisplaySrc.startsWith('blob:')
                                        }
                                    />
                                ) : (
                                    <User className="h-10 w-10 text-gray-400" />
                                )}
                            </div>
                            <button
                                type="button"
                                disabled={avatarUploading}
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute bottom-0 right-0 w-8 h-8 bg-brand text-white rounded-lg flex items-center justify-center border-2 border-white hover:bg-brand/90 transition-colors disabled:opacity-50"
                                aria-label="Upload profile photo"
                            >
                                <Camera className="h-3.5 w-3.5" />
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/gif,image/webp"
                                className="hidden"
                                onChange={handleAvatarFile}
                            />
                        </div>
                        <p className="text-xs text-gray-500 mb-2">
                            {avatarUploading ? 'Uploading…' : 'Tap the camera to upload a photo'}
                        </p>
                        {user?.profile_image ? (
                            <button
                                type="button"
                                disabled={avatarUploading}
                                onClick={handleRemovePhoto}
                                className="text-xs font-medium text-gray-400 hover:text-red-600 mb-2 disabled:opacity-50"
                            >
                                Remove photo
                            </button>
                        ) : null}
                        <h2 className="text-lg font-bold text-gray-900 mb-1">{formData.first_name || '—'} {formData.last_name || '—'}</h2>
                        <p className="text-xs font-medium text-gray-500 mb-2 capitalize">{user?.role || 'User'}</p>
                        <div className="px-2 py-1 bg-gray-50 rounded-lg border border-gray-100 inline-block">
                            <p className="text-xs font-semibold text-gray-600">ID: {user?.user_identifier || '—'}</p>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-50">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-100 text-xs font-semibold text-emerald-600">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                Verified
                            </span>
                        </div>
                    </div>

                    <div className="mt-4 flat-card border-l-4 border-l-brand p-5">
                        <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <Shield className="h-4 w-4 text-brand" /> Security
                        </h3>
                        <p className="text-xs text-gray-500 leading-relaxed mb-4">Your data is encrypted and secure.</p>
                        {!showChangePassword ? (
                            <button
                                type="button"
                                onClick={() => setShowChangePassword(true)}
                                className="text-sm font-medium text-brand flex items-center gap-2 hover:text-brand/80 transition-colors min-h-[44px]"
                            >
                                <Lock className="h-3.5 w-3.5" /> Change password
                            </button>
                        ) : (
                            <ChangePasswordForm onCancel={() => setShowChangePassword(false)} />
                        )}
                    </div>

                    <div className="mt-4 flat-card border-l-4 border-l-red-500 p-5">
                        <h3 className="text-sm font-semibold text-red-600 mb-2 flex items-center gap-2">
                            <Trash2 className="h-4 w-4" /> Delete account
                        </h3>
                        <p className="text-xs text-gray-600 leading-relaxed mb-4">Permanently delete your account and all associated data. This cannot be undone.</p>
                        <Link
                            href="/dashboard/settings/delete-account"
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 transition-all"
                        >
                            <Trash2 className="h-4 w-4" />
                            Delete my account
                        </Link>
                    </div>
                </div>

                <div className="lg:col-span-8">
                    <div className="flat-card p-6">
                        <div className="mb-6">
                            <h3 className="text-sm font-semibold text-gray-900">Personal information</h3>
                            <p className="text-xs text-gray-500 mt-0.5">Update your profile details</p>
                        </div>

                        <form onSubmit={handleUpdate} className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-600 mb-1.5 block">First name</label>
                                    <input
                                        type="text"
                                        value={formData.first_name}
                                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand focus:bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-600 mb-1.5 block">Last name</label>
                                    <input
                                        type="text"
                                        value={formData.last_name}
                                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand focus:bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-600 mb-1.5 block">Email</label>
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
                                    <label className="text-sm font-medium text-gray-600 mb-1.5 block">WhatsApp / Phone</label>
                                    <input
                                        type="text"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand focus:bg-white"
                                    />
                                </div>
                            </div>

                            <div className="pt-5 border-t border-gray-50 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="h-10 px-6 bg-brand text-white rounded-xl font-semibold text-sm hover:bg-brand/90 transition-colors flex items-center gap-2 disabled:opacity-50"
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
