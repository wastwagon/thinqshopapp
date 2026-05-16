'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import Link from 'next/link';
import AuthScreen, { authInputClass, authLabelClass, authPrimaryBtnClass } from '@/components/auth/AuthScreen';
import { Mail, ArrowRight, Eye, EyeOff } from 'lucide-react';

const emailOrPhone = z.string().min(1, 'Enter your email or phone number').refine(
    (v) => {
        const t = (v || '').trim();
        if (t.includes('@')) return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t);
        const digits = t.replace(/\D/g, '');
        return digits.length >= 10 && digits.length <= 15;
    },
    'Enter a valid email address or phone number (e.g. +233XXXXXXXXX)'
);
const loginSchema = z.object({
    email: emailOrPhone,
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const [showPassword, setShowPassword] = useState(false);
    const searchParams = useSearchParams();
    const from = searchParams.get('from') || undefined;
    const { login } = useAuth();
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginFormData) => {
        try {
            let emailOrPhoneVal = (data.email || '').trim();
            if (emailOrPhoneVal && !emailOrPhoneVal.includes('@')) {
                const digits = emailOrPhoneVal.replace(/\D/g, '');
                emailOrPhoneVal = digits.length >= 10 ? `+${digits}` : emailOrPhoneVal;
            }
            const payload = { email: emailOrPhoneVal, password: data.password };
            const response = await api.post('/auth/login', payload);
            login(response.data.access_token, from);
            toast.success('Welcome back!');
        } catch (error: any) {
            const msg = error.response?.data?.message || 'Invalid email, phone or password';
            toast.error(msg);
        }
    };

    return (
        <AuthScreen
            title="Sign in"
            subtitle="Sign in to your account to continue shopping."
            footer={
                <div className="pt-6 mt-6 border-t border-gray-100 text-center">
                    <p className="text-gray-500 text-sm mb-2">Don&apos;t have an account?</p>
                    <Link href="/register" className="inline-flex items-center gap-2 text-brand hover:text-brand/90 font-medium text-sm">
                        Create account
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
            }
        >
            <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
                <div>
                    <label className={authLabelClass}>Email or phone</label>
                    <div className="relative">
                        <input
                            {...register('email')}
                            type="text"
                            inputMode="email"
                            autoComplete="username"
                            placeholder="you@example.com or +233..."
                            className={authInputClass}
                        />
                        <Mail className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 pointer-events-none" />
                    </div>
                    {errors.email && <p className="text-red-500 text-xs mt-1.5">{errors.email.message}</p>}
                </div>
                <div>
                    <div className="flex justify-between items-center mb-1.5">
                        <label className={authLabelClass}>Password</label>
                        <Link href="/forgot-password" className="text-xs font-medium text-blue-600 hover:text-blue-700">
                            Forgot password?
                        </Link>
                    </div>
                    <div className="relative">
                        <input
                            {...register('password')}
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            className={`${authInputClass} pr-12`}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                    {errors.password && <p className="text-red-500 text-xs mt-1.5">{errors.password.message}</p>}
                </div>
                <button type="submit" disabled={isSubmitting} className={authPrimaryBtnClass}>
                    {isSubmitting ? 'Signing in...' : 'Sign in'}
                    {!isSubmitting && <ArrowRight className="h-4 w-4" />}
                </button>
            </form>
        </AuthScreen>
    );
}
