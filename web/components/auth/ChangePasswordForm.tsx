'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import { authInputClass, authLabelClass, authPrimaryBtnClass } from '@/components/auth/AuthScreen';

const schema = z
    .object({
        currentPassword: z.string().min(6, 'Current password is required'),
        newPassword: z.string().min(8, 'New password must be at least 8 characters'),
        confirmPassword: z.string().min(8, 'Confirm your new password'),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: "Passwords don't match",
        path: ['confirmPassword'],
    });

type FormData = z.infer<typeof schema>;

type ChangePasswordFormProps = {
    onCancel?: () => void;
};

export default function ChangePasswordForm({ onCancel }: ChangePasswordFormProps) {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<FormData>({ resolver: zodResolver(schema) });

    const onSubmit = async (data: FormData) => {
        try {
            await api.post('/auth/change-password', {
                currentPassword: data.currentPassword,
                newPassword: data.newPassword,
            });
            toast.success('Password updated');
            reset();
            onCancel?.();
        } catch (error: unknown) {
            const message =
                error && typeof error === 'object' && 'response' in error
                    ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
                    : undefined;
            toast.error(message || 'Failed to change password');
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4 pt-4 border-t border-gray-100">
            <div>
                <label className={authLabelClass} htmlFor="current-password">
                    Current password
                </label>
                <input
                    id="current-password"
                    {...register('currentPassword')}
                    type="password"
                    autoComplete="current-password"
                    className={authInputClass}
                />
                {errors.currentPassword && (
                    <p className="text-red-500 text-xs mt-1">{errors.currentPassword.message}</p>
                )}
            </div>
            <div>
                <label className={authLabelClass} htmlFor="new-password">
                    New password
                </label>
                <input
                    id="new-password"
                    {...register('newPassword')}
                    type="password"
                    autoComplete="new-password"
                    className={authInputClass}
                />
                {errors.newPassword && <p className="text-red-500 text-xs mt-1">{errors.newPassword.message}</p>}
            </div>
            <div>
                <label className={authLabelClass} htmlFor="confirm-password">
                    Confirm new password
                </label>
                <input
                    id="confirm-password"
                    {...register('confirmPassword')}
                    type="password"
                    autoComplete="new-password"
                    className={authInputClass}
                />
                {errors.confirmPassword && (
                    <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>
                )}
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
                <button type="submit" disabled={isSubmitting} className={authPrimaryBtnClass}>
                    {isSubmitting ? 'Updating…' : 'Update password'}
                </button>
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="min-h-[44px] px-4 rounded-xl border border-gray-200/90 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                )}
            </div>
        </form>
    );
}
