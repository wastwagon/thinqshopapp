'use client';

import { Suspense, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import AuthScreen, { authInputClass, authLabelClass, authPrimaryBtnClass, authLinkClass } from '@/components/auth/AuthScreen';
import { ArrowLeft, Lock } from 'lucide-react';

const resetSchema = z
    .object({
        password: z.string().min(6, 'Password must be at least 6 characters'),
        confirmPassword: z.string().min(6, 'Confirm your password'),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    });

type ResetFormData = z.infer<typeof resetSchema>;

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token') || '';
    const [done, setDone] = useState(false);

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ResetFormData>({
        resolver: zodResolver(resetSchema),
    });

    if (!token) {
        return (
            <AuthScreen
                title="Invalid reset link"
                subtitle="This link is missing or expired. Request a new one from the sign-in page."
            >
                <div className="text-center pt-2">
                    <Link href="/forgot-password" className={`text-sm ${authLinkClass}`}>
                        Request new link
                    </Link>
                </div>
            </AuthScreen>
        );
    }

    const onSubmit = async (data: ResetFormData) => {
        try {
            await api.post('/auth/reset-password', { token, password: data.password });
            setDone(true);
            toast.success('Password updated. You can sign in now.');
            setTimeout(() => router.push('/login'), 2000);
        } catch (err: unknown) {
            const message =
                (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
            const text = Array.isArray(message) ? message[0] : message;
            toast.error(text || 'Could not reset password. The link may have expired.');
        }
    };

    if (done) {
        return (
            <AuthScreen title="Password updated" subtitle="Redirecting you to sign in…">
                <Link href="/login" className={`inline-flex items-center gap-2 text-sm ${authLinkClass}`}>
                    <ArrowLeft className="h-4 w-4" />
                    Sign in now
                </Link>
            </AuthScreen>
        );
    }

    return (
        <AuthScreen
            title="Choose a new password"
            subtitle="Enter a new password for your account."
            footer={
                <div className="pt-6 mt-6 border-t border-gray-100 text-center">
                    <Link href="/login" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm font-medium">
                        <ArrowLeft className="h-4 w-4" />
                        Back to sign in
                    </Link>
                </div>
            }
        >
            <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
                <div>
                    <label className={authLabelClass}>New password</label>
                    <div className="relative">
                        <input
                            {...register('password')}
                            type="password"
                            autoComplete="new-password"
                            placeholder="At least 6 characters"
                            className={authInputClass}
                        />
                        <Lock className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 pointer-events-none" />
                    </div>
                    {errors.password && <p className="text-red-500 text-xs mt-1.5">{errors.password.message}</p>}
                </div>
                <div>
                    <label className={authLabelClass}>Confirm password</label>
                    <input
                        {...register('confirmPassword')}
                        type="password"
                        autoComplete="new-password"
                        placeholder="Repeat password"
                        className={authInputClass}
                    />
                    {errors.confirmPassword && (
                        <p className="text-red-500 text-xs mt-1.5">{errors.confirmPassword.message}</p>
                    )}
                </div>
                <button type="submit" disabled={isSubmitting} className={authPrimaryBtnClass}>
                    {isSubmitting ? 'Saving…' : 'Update password'}
                </button>
            </form>
        </AuthScreen>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense
            fallback={
                <AuthScreen title="Loading…" subtitle="Preparing password reset.">
                    <div className="h-10" />
                </AuthScreen>
            }
        >
            <ResetPasswordForm />
        </Suspense>
    );
}
