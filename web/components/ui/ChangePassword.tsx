'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import { Lock } from 'lucide-react';

const changePasswordSchema = z.object({
    currentPassword: z.string().min(6, "Current password is required"),
    newPassword: z.string().min(6, "New password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Confirm password is required"),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export default function ChangePassword() {
    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ChangePasswordFormData>({
        resolver: zodResolver(changePasswordSchema),
    });

    const onSubmit = async (data: ChangePasswordFormData) => {
        try {
            await api.post('/auth/change-password', {
                currentPassword: data.currentPassword,
                newPassword: data.newPassword,
            });
            toast.success('Password changed successfully');
            reset();
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to change password');
        }
    };

    return (
        <div className="mt-8 bg-white overflow-hidden shadow rounded-lg px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 flex items-center mb-4">
                <Lock className="mr-2 h-5 w-5" /> Security Settings
            </h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Current Password</label>
                    <input
                        {...register('currentPassword')}
                        type="password"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    />
                    {errors.currentPassword && <p className="text-red-500 text-xs">{errors.currentPassword.message}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">New Password</label>
                    <input
                        {...register('newPassword')}
                        type="password"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    />
                    {errors.newPassword && <p className="text-red-500 text-xs">{errors.newPassword.message}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                    <input
                        {...register('confirmPassword')}
                        type="password"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    />
                    {errors.confirmPassword && <p className="text-red-500 text-xs">{errors.confirmPassword.message}</p>}
                </div>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                >
                    {isSubmitting ? 'Updating...' : 'Update Password'}
                </button>
            </form>
        </div>
    );
}
