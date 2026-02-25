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
import ShopLayout from '@/components/layout/ShopLayout';
import { ShieldCheck, Lock, Mail, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';

const loginSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const [showPassword, setShowPassword] = useState(false);
    const searchParams = useSearchParams();
    const from = searchParams.get('from') || undefined; // e.g. /dashboard from ?from=%2Fdashboard
    const { login } = useAuth();
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginFormData) => {
        try {
            const response = await api.post('/auth/login', data);
            login(response.data.access_token, from);
            toast.success('Welcome back!');
        } catch (error: any) {
            const msg = error.response?.data?.message || 'Invalid email or password';
            toast.error(msg);
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
                    <div className="bg-white/95 backdrop-blur-xl rounded-[2.5rem] p-10 md:p-14 border border-white/20 shadow-2xl shadow-black/20 relative overflow-hidden">
                        <div className="mb-12 text-center">
                            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight mb-3">Sign in</h1>
                            <p className="text-gray-500 text-sm">
                                Sign in to your account to continue shopping.
                            </p>
                        </div>

                        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                            <div className="space-y-5">
                                <div>
                                    <label className="text-sm font-medium text-gray-700 ml-1 mb-2 block">Email</label>
                                    <div className="relative">
                                        <input
                                            {...register('email')}
                                            type="email"
                                        placeholder="you@example.com"
                                        className="block w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                                        />
                                        <Mail className="absolute right-6 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-200" />
                                    </div>
                                    {errors.email && <p className="text-red-500 text-xs mt-2 ml-1">{errors.email.message}</p>}
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-2 ml-1">
                                        <label className="text-sm font-medium text-gray-700 block">Password</label>
                                        <Link href="/forgot-password" className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors">
                                            Forgot password?
                                        </Link>
                                    </div>
                                    <div className="relative">
                                        <input
                                            {...register('password')}
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="••••••••••••"
                                            className="block w-full px-5 py-3.5 pr-12 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                                            >
                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </div>
                                    {errors.password && <p className="text-red-500 text-xs mt-2 ml-1">{errors.password.message}</p>}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-gray-900 text-white h-12 rounded-xl font-medium text-sm hover:bg-gray-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-8"
                            >
                                {isSubmitting ? 'Signing in...' : 'Sign in'}
                                {!isSubmitting && <ArrowRight className="h-4 w-4" />}
                            </button>

                            <div className="pt-8 border-t border-gray-100 text-center">
                                <p className="text-gray-500 text-sm mb-3">Don&apos;t have an account?</p>
                                <Link href="/register" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm group/link">
                                    Create account
                                    <ArrowRight className="h-4 w-4 group-hover/link:translate-x-0.5 transition-transform" />
                                </Link>
                            </div>
                        </form>
                    </div>

                    <div className="mt-8 flex items-center justify-center gap-2 text-white/60">
                        <ShieldCheck className="h-4 w-4" />
                        <span className="text-xs">Secure connection</span>
                    </div>
                </motion.div>
            </div>
        </ShopLayout>
    );
}
