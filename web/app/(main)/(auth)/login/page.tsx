'use client';

import { Suspense, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import Link from 'next/link';
import AuthScreen, { authLinkClass } from '@/components/auth/AuthScreen';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Label from '@/components/ui/Label';
import FormField from '@/components/ui/FormField';
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

function LoginForm() {
    const [showPassword, setShowPassword] = useState(false);
    const searchParams = useSearchParams();
    const from = searchParams.get('from') || '/dashboard';
    const { completeLogin } = useAuth();
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
            const res = await fetch('/api/session/login', {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const body = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(body?.message || 'Invalid email, phone or password');
            }
            await completeLogin(from);
            toast.success('Welcome back!');
        } catch (error: unknown) {
            const err = error as { message?: string };
            toast.error(err?.message || 'Invalid email, phone or password');
        }
    };

    return (
        <AuthScreen
            title="Sign in"
            subtitle={
                from === '/checkout'
                    ? 'Sign in for saved addresses and wallet, or continue as a guest.'
                    : 'Sign in to your account to continue shopping.'
            }
            footer={
                <div className="pt-6 mt-6 border-t border-gray-100 text-center">
                    {from === '/checkout' && (
                        <p className="text-gray-500 text-sm mb-4">
                            <Link href="/checkout" className={`inline-flex items-center gap-2 ${authLinkClass}`}>
                                Continue as guest
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </p>
                    )}
                    <p className="text-gray-500 text-sm mb-2">Don&apos;t have an account?</p>
                    <Link href="/register" className={`inline-flex items-center gap-2 text-sm ${authLinkClass}`}>
                        Create account
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
            }
        >
            <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
                <FormField
                    label="Email or phone"
                    htmlFor="login-email"
                    error={errors.email?.message}
                >
                    <div className="relative">
                        <Input
                            id="login-email"
                            {...register('email')}
                            type="text"
                            inputMode="email"
                            autoComplete="username"
                            placeholder="you@example.com or +233..."
                            invalid={!!errors.email}
                            className="pr-11"
                        />
                        <Mail className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 pointer-events-none" />
                    </div>
                </FormField>

                <div>
                    <div className="flex justify-between items-center mb-1.5">
                        <Label htmlFor="login-password" className="mb-0">
                            Password
                        </Label>
                        <Link href="/forgot-password" className={`text-xs font-medium ${authLinkClass}`}>
                            Forgot password?
                        </Link>
                    </div>
                    <div className="relative">
                        <Input
                            id="login-password"
                            {...register('password')}
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="current-password"
                            placeholder="••••••••"
                            invalid={!!errors.password}
                            className="pr-12"
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
                    {errors.password && (
                        <p className="text-red-500 text-xs mt-1.5" role="alert">
                            {errors.password.message}
                        </p>
                    )}
                </div>

                <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full"
                    loading={isSubmitting}
                    rightIcon={!isSubmitting ? <ArrowRight className="h-4 w-4" /> : undefined}
                >
                    {isSubmitting ? 'Signing in...' : 'Sign in'}
                </Button>
            </form>
        </AuthScreen>
    );
}

export default function LoginPage() {
    return (
        <Suspense
            fallback={
                <AuthScreen title="Sign in" subtitle="Sign in to your account to continue shopping.">
                    <div className="h-48 rounded-xl bg-gray-50 animate-pulse" aria-hidden />
                </AuthScreen>
            }
        >
            <LoginForm />
        </Suspense>
    );
}
