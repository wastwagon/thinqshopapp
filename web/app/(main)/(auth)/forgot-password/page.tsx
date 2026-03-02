'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import Link from 'next/link';
import ShopLayout from '@/components/layout/ShopLayout';
import { ShieldCheck, Mail, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

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
        } catch (error: any) {
            // Always show success for security (prevents email enumeration)
            setSubmitted(true);
        }
    };

    if (submitted) {
        return (
            <ShopLayout>
                <div className="min-h-[90vh] flex items-center justify-center px-4 py-20 relative bg-[#fdfdfd] overflow-hidden">
                    <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-500/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/5 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2" />

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="max-w-md w-full relative z-10"
                    >
                        <div className="bg-white rounded-[2.5rem] p-10 md:p-14 border border-gray-100 shadow-xl shadow-gray-100/50 text-center">
                            <div className="mb-8 flex justify-center">
                                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                                    <Mail className="h-7 w-7 text-green-600" />
                                </div>
                            </div>
                            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight mb-3">Check your email</h1>
                            <p className="text-gray-500 text-sm mb-10">
                                If an account exists with that email, we&apos;ve sent password reset instructions. Please check your inbox and spam folder.
                            </p>
                            <Link
                                href="/login"
                                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm group"
                            >
                                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
                                Back to sign in
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </ShopLayout>
        );
    }

    return (
        <ShopLayout>
            <div className="min-h-[90vh] flex items-center justify-center px-4 py-20 relative bg-[#fdfdfd] overflow-hidden">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-500/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/5 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2" />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="max-w-md w-full relative z-10"
                >
                    <div className="bg-white rounded-[2.5rem] p-10 md:p-14 border border-gray-100 shadow-xl shadow-gray-100/50">
                        <div className="mb-12 text-center">
                            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight mb-3">Forgot password?</h1>
                            <p className="text-gray-500 text-sm">
                                Enter your email and we&apos;ll send you instructions to reset your password.
                            </p>
                        </div>

                        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                            <div>
                                <label className="text-sm font-medium text-gray-700 ml-1 mb-2 block">Email</label>
                                <div className="relative">
                                    <input
                                        {...register('email')}
                                        type="email"
                                        placeholder="you@example.com"
                                        className="block w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                                    />
                                    <Mail className="absolute right-6 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                                </div>
                                {errors.email && <p className="text-red-500 text-xs mt-2 ml-1">{errors.email.message}</p>}
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full min-h-[44px] bg-gray-900 text-white h-12 rounded-xl font-medium text-sm hover:bg-gray-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-8"
                            >
                                {isSubmitting ? 'Sending...' : 'Send reset instructions'}
                            </button>

                            <div className="pt-8 border-t border-gray-100 text-center">
                                <Link href="/login" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm font-medium group">
                                    <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
                                    Back to sign in
                                </Link>
                            </div>
                        </form>
                    </div>

                    <div className="mt-8 flex items-center justify-center gap-2 text-gray-400">
                        <ShieldCheck className="h-4 w-4 text-blue-500" />
                        <span className="text-xs text-gray-500">Secure connection</span>
                    </div>
                </motion.div>
            </div>
        </ShopLayout>
    );
}
