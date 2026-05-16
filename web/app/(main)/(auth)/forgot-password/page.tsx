'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import Link from 'next/link';
import AuthScreen, { authInputClass, authLabelClass, authPrimaryBtnClass } from '@/components/auth/AuthScreen';
import { Mail, ArrowLeft } from 'lucide-react';

const forgotSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
});

type ForgotFormData = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
    const [submitted, setSubmitted] = useState(false);
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotFormData>({
        resolver: zodResolver(forgotSchema),
    });

    const onSubmit = async (data: ForgotFormData) => {
        try {
            await api.post('/auth/forgot-password', data);
            setSubmitted(true);
            toast.success('Check your email for reset instructions.');
        } catch {
            setSubmitted(true);
        }
    };

    if (submitted) {
        return (
            <AuthScreen title="Check your email" subtitle="If an account exists, we sent reset instructions. Check your inbox and spam folder.">
                <div className="text-center py-4">
                    <div className="mb-6 flex justify-center">
                        <div className="w-14 h-14 rounded-full bg-green-50 border border-green-100 flex items-center justify-center">
                            <Mail className="h-7 w-7 text-green-600" />
                        </div>
                    </div>
                    <Link
                        href="/login"
                        className="inline-flex items-center gap-2 text-brand hover:text-brand/90 font-medium text-sm"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to sign in
                    </Link>
                </div>
            </AuthScreen>
        );
    }

    return (
        <AuthScreen
            title="Forgot password?"
            subtitle="Enter your email and we'll send reset instructions."
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
                    <label className={authLabelClass}>Email</label>
                    <div className="relative">
                        <input
                            {...register('email')}
                            type="email"
                            placeholder="you@example.com"
                            className={authInputClass}
                        />
                        <Mail className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 pointer-events-none" />
                    </div>
                    {errors.email && <p className="text-red-500 text-xs mt-1.5">{errors.email.message}</p>}
                </div>
                <button type="submit" disabled={isSubmitting} className={authPrimaryBtnClass}>
                    {isSubmitting ? 'Sending...' : 'Send reset instructions'}
                </button>
            </form>
        </AuthScreen>
    );
}
