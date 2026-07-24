'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import FormField from '@/components/ui/FormField';

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
            <FormField
                label="Current password"
                htmlFor="current-password"
                error={errors.currentPassword?.message}
            >
                <Input
                    id="current-password"
                    {...register('currentPassword')}
                    type="password"
                    autoComplete="current-password"
                    invalid={!!errors.currentPassword}
                />
            </FormField>
            <FormField label="New password" htmlFor="new-password" error={errors.newPassword?.message}>
                <Input
                    id="new-password"
                    {...register('newPassword')}
                    type="password"
                    autoComplete="new-password"
                    invalid={!!errors.newPassword}
                />
            </FormField>
            <FormField
                label="Confirm new password"
                htmlFor="confirm-password"
                error={errors.confirmPassword?.message}
            >
                <Input
                    id="confirm-password"
                    {...register('confirmPassword')}
                    type="password"
                    autoComplete="new-password"
                    invalid={!!errors.confirmPassword}
                />
            </FormField>
            <div className="flex flex-col sm:flex-row gap-2">
                <Button type="submit" variant="primary" size="lg" className="w-full sm:w-auto" loading={isSubmitting}>
                    {isSubmitting ? 'Updating…' : 'Update password'}
                </Button>
                {onCancel && (
                    <Button type="button" variant="secondary" size="lg" onClick={onCancel} className="w-full sm:w-auto">
                        Cancel
                    </Button>
                )}
            </div>
        </form>
    );
}
