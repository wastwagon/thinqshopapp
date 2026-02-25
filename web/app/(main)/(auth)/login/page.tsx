'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import Link from 'next/link';
import ShopLayout from '@/components/layout/ShopLayout';
import { ShieldCheck, Lock, Mail, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const loginSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
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
            <div className="min-h-[90vh] flex items-center justify-center px-4 py-20 relative bg-[#fdfdfd] overflow-hidden">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-500/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/5 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2" />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="max-w-md w-full relative z-10"
                >
                    <div className="bg-white rounded-[2.5rem] p-10 md:p-14 border border-gray-100 shadow-xl shadow-gray-100/50 relative overflow-hidden">
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
                                            type="password"
                                            placeholder="••••••••••••"
                                            className="block w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                                        />
                                        <Lock className="absolute right-6 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-200" />
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

                    <div className="mt-8 flex items-center justify-center gap-2 text-gray-400">
                        <ShieldCheck className="h-4 w-4" />
                        <span className="text-xs text-gray-500">Secure connection</span>
                    </div>
                </motion.div>
            </div>
        </ShopLayout>
    );
}
