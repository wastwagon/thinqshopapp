'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AuthScreen, { authLinkClass } from '@/components/auth/AuthScreen';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import FormField from '@/components/ui/FormField';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';

const emailOrPhone = z.string().min(1, 'Enter your email or phone number').refine(
    (v) => {
        const t = (v || '').trim();
        if (t.includes('@')) return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t);
        const digits = t.replace(/\D/g, '');
        return digits.length >= 10 && digits.length <= 15;
    },
    'Enter a valid email address or phone number (e.g. +233XXXXXXXXX)'
);

const phoneOptional = (v: string | undefined) => {
    if (!v || v.trim() === '') return true;
    const digits = v.replace(/\D/g, '');
    return digits.length >= 10 && digits.length <= 15;
};

const registerSchema = z
    .object({
        first_name: z.string().min(2, 'First name is required'),
        last_name: z.string().min(2, 'Last name is required'),
        email: emailOrPhone,
        password: z.string().min(8, 'Password must be at least 8 characters long'),
        confirmPassword: z.string().min(8, 'Please confirm your password'),
        phone: z
            .string()
            .optional()
            .refine(phoneOptional, 'Please enter a valid phone number (e.g. +233XXXXXXXXX)'),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const router = useRouter();
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
    });

    const onSubmit = async (data: RegisterFormData) => {
        try {
            const { confirmPassword, ...rest } = data;
            let emailOrPhoneVal = (rest.email || '').trim();
            if (emailOrPhoneVal && !emailOrPhoneVal.includes('@')) {
                const digits = emailOrPhoneVal.replace(/\D/g, '');
                emailOrPhoneVal = digits.length >= 10 ? `+${digits}` : emailOrPhoneVal;
            }
            const payload = { ...rest, email: emailOrPhoneVal, phone: data.phone?.trim() || undefined };
            await api.post('/auth/register', payload);
            toast.success('Registration successful! Please sign in.');
            router.push('/login?from=/dashboard');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Registration failed');
        }
    };

    return (
        <AuthScreen
            title="Create your account"
            subtitle="Sign up to start shopping for electronics and services."
            footer={
                <div className="pt-6 mt-6 border-t border-gray-100 text-center">
                    <p className="text-gray-500 text-sm mb-2">Already have an account?</p>
                    <Link href="/login" className={`inline-flex items-center gap-2 text-sm ${authLinkClass}`}>
                        Sign in
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
            }
        >
            <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="First name" htmlFor="reg-first" error={errors.first_name?.message}>
                        <Input
                            id="reg-first"
                            {...register('first_name')}
                            type="text"
                            placeholder="John"
                            invalid={!!errors.first_name}
                        />
                    </FormField>
                    <FormField label="Last name" htmlFor="reg-last" error={errors.last_name?.message}>
                        <Input
                            id="reg-last"
                            {...register('last_name')}
                            type="text"
                            placeholder="Doe"
                            invalid={!!errors.last_name}
                        />
                    </FormField>
                </div>
                <FormField label="Email or phone" htmlFor="reg-email" error={errors.email?.message}>
                    <Input
                        id="reg-email"
                        {...register('email')}
                        type="text"
                        inputMode="email"
                        autoComplete="username"
                        placeholder="you@example.com or +233..."
                        invalid={!!errors.email}
                    />
                </FormField>
                <FormField
                    label="WhatsApp / Phone"
                    htmlFor="reg-phone"
                    hint="Optional"
                    error={errors.phone?.message}
                >
                    <Input
                        id="reg-phone"
                        {...register('phone')}
                        type="tel"
                        placeholder="+233..."
                        invalid={!!errors.phone}
                    />
                </FormField>
                <FormField label="Password" htmlFor="reg-password" error={errors.password?.message}>
                    <div className="relative">
                        <Input
                            id="reg-password"
                            {...register('password')}
                            type={showPassword ? 'text' : 'password'}
                            placeholder="At least 8 characters"
                            invalid={!!errors.password}
                            className="pr-12"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                </FormField>
                <FormField label="Confirm password" htmlFor="reg-confirm" error={errors.confirmPassword?.message}>
                    <div className="relative">
                        <Input
                            id="reg-confirm"
                            {...register('confirmPassword')}
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder="Re-enter your password"
                            invalid={!!errors.confirmPassword}
                            className="pr-12"
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400"
                            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                        >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                </FormField>
                <Button type="submit" variant="primary" size="lg" className="w-full" loading={isSubmitting}>
                    {isSubmitting ? 'Creating account...' : 'Create account'}
                </Button>
            </form>
        </AuthScreen>
    );
}
