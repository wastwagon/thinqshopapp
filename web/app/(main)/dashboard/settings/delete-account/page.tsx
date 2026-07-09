'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DashboardPageHeader from '@/components/dashboard/DashboardPageHeader';
import DashboardContent from '@/components/dashboard/DashboardContent';
import { Trash2 } from 'lucide-react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DeleteAccountPage() {
    const router = useRouter();
    const [confirmText, setConfirmText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const expectedText = 'DELETE';

    const handleDelete = async () => {
        if (confirmText !== expectedText) {
            toast.error(`Please type ${expectedText} to confirm`);
            return;
        }
        setIsDeleting(true);
        try {
            await api.delete('/auth/account');
            localStorage.removeItem('token');
            toast.success('Your account has been deleted.');
            router.push('/');
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(err?.response?.data?.message || 'Failed to delete account');
            setIsDeleting(false);
        }
    };

    return (
        <DashboardLayout>
            <DashboardContent>
                <DashboardPageHeader
                    title="Delete account"
                    subtitle="This action is permanent and cannot be undone"
                    backHref="/dashboard/settings"
                    backLabel="Settings"
                />
                <div className="dashboard-card p-6 md:p-8 border-red-100">
                    <p className="text-sm text-gray-600 mb-6">
                        Deleting your account will permanently remove your profile, orders, wallet balance, and all associated data. You will not be able to recover this account.
                    </p>
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Type <strong className="text-red-600">DELETE</strong> to confirm
                        </label>
                        <input
                            type="text"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            placeholder="DELETE"
                            className="block w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                            disabled={isDeleting}
                        />
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={confirmText !== expectedText || isDeleting}
                            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            <Trash2 className="h-4 w-4" />
                            {isDeleting ? 'Deleting…' : 'Permanently delete my account'}
                        </button>
                        <Link
                            href="/dashboard/settings"
                            className="inline-flex items-center justify-center min-h-[44px] px-5 py-2.5 rounded-xl text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all"
                        >
                            Cancel
                        </Link>
                    </div>
                </div>
            </DashboardContent>
        </DashboardLayout>
    );
}
