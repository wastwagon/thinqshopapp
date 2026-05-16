'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AuthScreen, { authInputClass, authLabelClass, authPrimaryBtnClass } from '@/components/auth/AuthScreen';
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

    const inputCls = authInputClass;
    const inputClsPr = `${authInputClass} pr-12`;

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
            toast.success('Registration successful! Please login.');
            router.push('/login');
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
                    <Link
                        href="/login"
                        className="inline-flex items-center gap-2 text-brand hover:text-brand/90 font-medium text-sm"
                    >
                        Sign in
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
            }
        >
            <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className={authLabelClass}>First name</label>
                        <input {...register('first_name')} type="text" placeholder="John" className={inputCls} />
                        {errors.first_name && <p className="text-red-500 text-xs mt-1.5">{errors.first_name.message}</p>}
                    </div>
                    <div>
                        <label className={authLabelClass}>Last name</label>
                        <input {...register('last_name')} type="text" placeholder="Doe" className={inputCls} />
                        {errors.last_name && <p className="text-red-500 text-xs mt-1.5">{errors.last_name.message}</p>}
                    </div>
                </div>
                <div>
                    <label className={authLabelClass}>Email or phone</label>
                    <input
                        {...register('email')}
                        type="text"
                        inputMode="email"
                        autoComplete="username"
                        placeholder="you@example.com or +233..."
                        className={inputCls}
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1.5">{errors.email.message}</p>}
                </div>
                <div>
                    <label className={authLabelClass}>
                        WhatsApp / Phone <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <input {...register('phone')} type="tel" placeholder="+233... (optional)" className={inputCls} />
                    {errors.phone && <p className="text-red-500 text-xs mt-1.5">{errors.phone.message}</p>}
                </div>
                <div>
                    <label className={authLabelClass}>Password</label>
                    <div className="relative">
                        <input
                            {...register('password')}
                            type={showPassword ? 'text' : 'password'}
                            placeholder="At least 8 characters"
                            className={inputClsPr}
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
                    {errors.password && <p className="text-red-500 text-xs mt-1.5">{errors.password.message}</p>}
                </div>
                <div>
                    <label className={authLabelClass}>Confirm password</label>
                    <div className="relative">
                        <input
                            {...register('confirmPassword')}
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder="Re-enter your password"
                            className={inputClsPr}
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
                    {errors.confirmPassword && (
                        <p className="text-red-500 text-xs mt-1.5">{errors.confirmPassword.message}</p>
                    )}
                </div>
                <button type="submit" disabled={isSubmitting} className={authPrimaryBtnClass}>
                    {isSubmitting ? 'Creating account...' : 'Create account'}
                </button>
            </form>
        </AuthScreen>
    );
}
