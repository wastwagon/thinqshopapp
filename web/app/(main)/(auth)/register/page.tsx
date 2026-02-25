'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ShopLayout from '@/components/layout/ShopLayout';
import { ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const ghanaPhoneRegex = /^(\+233|0)[0-9]{9}$/;
const registerSchema = z.object({
    first_name: z.string().min(2, "First name is required"),
    last_name: z.string().min(2, "Last name is required"),
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters long"),
    phone: z.string().optional().refine((v) => !v || v.trim() === '' || ghanaPhoneRegex.test(v.replace(/\s/g, '')), "Please enter a valid Ghana phone number (e.g. +233XXXXXXXXX or 0XXXXXXXXX)"),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
    const router = useRouter();
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
    });

    const onSubmit = async (data: RegisterFormData) => {
        try {
            const payload = { ...data, phone: data.phone?.trim() || undefined };
            await api.post('/auth/register', payload);
            toast.success('Registration successful! Please login.');
            router.push('/login');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Registration failed');
        }
    };

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
                                    <label className="text-sm font-medium text-gray-700 ml-1 mb-2 block">Phone number <span className="text-gray-400 font-normal">(optional)</span></label>
                                    <input
                                        {...register('phone')}
                                        type="tel"
                                        placeholder="+233XXXXXXXXX or 0XXXXXXXXX"
                                        className="block w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                                    />
                                    {errors.phone && <p className="text-red-500 text-xs mt-2 ml-1">{errors.phone.message}</p>}
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700 ml-1 mb-2 block">Password</label>
                                    <input
                                        {...register('password')}
                                        type="password"
                                        placeholder="At least 6 characters"
                                        className="block w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                                    />
                                    {errors.password && <p className="text-red-500 text-xs mt-2 ml-1">{errors.password.message}</p>}
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

                    <div className="mt-8 flex items-center justify-center gap-2 text-gray-400">
                        <ShieldCheck className="h-4 w-4 text-blue-500" />
                        <span className="text-xs text-gray-500">Your data is encrypted and secure</span>
                    </div>
                </motion.div>
            </div>
        </ShopLayout>
    );
}
