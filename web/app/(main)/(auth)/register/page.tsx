'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ShopLayout from '@/components/layout/ShopLayout';
import { ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';

const ghanaPhoneRegex = /^(\+233|0)[0-9]{9}$/;
const registerSchema = z.object({
    first_name: z.string().min(2, "First name is required"),
    last_name: z.string().min(2, "Last name is required"),
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters long"),
    confirmPassword: z.string().min(8, "Please confirm your password"),
    phone: z.string().optional().refine((v) => !v || v.trim() === '' || ghanaPhoneRegex.test(v.replace(/\s/g, '')), "Please enter a valid Ghana phone number (e.g. +233XXXXXXXXX or 0XXXXXXXXX)"),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const router = useRouter();
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
    });

    const onSubmit = async (data: RegisterFormData) => {
        try {
            const { confirmPassword, ...rest } = data;
            const payload = { ...rest, phone: data.phone?.trim() || undefined };
            await api.post('/auth/register', payload);
            toast.success('Registration successful! Please login.');
            router.push('/login');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Registration failed');
        }
    };

    return (
        <ShopLayout>
            <div className="min-h-[90vh] flex items-center justify-center px-4 py-20 relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                {/* Premium background: subtle mesh gradient + grid */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(59,130,246,0.15),transparent)]" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_80%_50%,rgba(99,102,241,0.08),transparent)]" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_50%_at_20%_80%,rgba(59,130,246,0.06),transparent)]" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="max-w-md w-full relative z-10"
                >
                    <div className="bg-white/95 backdrop-blur-xl rounded-[2.5rem] p-10 md:p-14 border border-white/20 shadow-2xl shadow-black/20">
                        <div className="mb-10 text-center">
                            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight mb-3">Create your account</h1>
                            <p className="text-gray-500 text-sm">
                                Sign up to start shopping for premium tech and services.
                            </p>
                        </div>

                        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                            <div className="space-y-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 ml-1 mb-2 block">First name</label>
                                        <input
                                            {...register('first_name')}
                                            type="text"
                                            placeholder="John"
                                            className="block w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                                        />
                                        {errors.first_name && <p className="text-red-500 text-xs mt-2 ml-1">{errors.first_name.message}</p>}
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 ml-1 mb-2 block">Last name</label>
                                        <input
                                            {...register('last_name')}
                                            type="text"
                                            placeholder="Doe"
                                            className="block w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                                        />
                                        {errors.last_name && <p className="text-red-500 text-xs mt-2 ml-1">{errors.last_name.message}</p>}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700 ml-1 mb-2 block">Email</label>
                                    <input
                                        {...register('email')}
                                        type="email"
                                        placeholder="you@example.com"
                                        className="block w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                                    />
                                    {errors.email && <p className="text-red-500 text-xs mt-2 ml-1">{errors.email.message}</p>}
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700 ml-1 mb-2 block">WhatsApp / Phone number <span className="text-gray-400 font-normal">(optional)</span></label>
                                    <input
                                        {...register('phone')}
                                        type="tel"
                                        placeholder="+233XXXXXXXXX or 0XXXXXXXXX (for WhatsApp contact)"
                                        className="block w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                                    />
                                    {errors.phone && <p className="text-red-500 text-xs mt-2 ml-1">{errors.phone.message}</p>}
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700 ml-1 mb-2 block">Password</label>
                                    <div className="relative">
                                        <input
                                            {...register('password')}
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="At least 8 characters"
                                            className="block w-full px-5 py-3.5 pr-12 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    {errors.password && <p className="text-red-500 text-xs mt-2 ml-1">{errors.password.message}</p>}
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700 ml-1 mb-2 block">Confirm password</label>
                                    <div className="relative">
                                        <input
                                            {...register('confirmPassword')}
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            placeholder="Re-enter your password"
                                            className="block w-full px-5 py-3.5 pr-12 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                                            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                                        >
                                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    {errors.confirmPassword && <p className="text-red-500 text-xs mt-2 ml-1">{errors.confirmPassword.message}</p>}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-gray-900 text-white h-12 rounded-xl font-medium text-sm hover:bg-gray-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-6"
                            >
                                {isSubmitting ? 'Creating account...' : 'Create account'}
                            </button>

                            <div className="pt-8 border-t border-gray-100 text-center">
                                <p className="text-gray-500 text-sm mb-3">Already have an account?</p>
                                <Link href="/login" className="inline-block text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors">
                                    Sign in
                                </Link>
                            </div>
                        </form>
                    </div>

                    <div className="mt-8 flex items-center justify-center gap-2 text-white/60">
                        <ShieldCheck className="h-4 w-4" />
                        <span className="text-xs">Your data is encrypted and secure</span>
                    </div>
                </motion.div>
            </div>
        </ShopLayout>
    );
}
