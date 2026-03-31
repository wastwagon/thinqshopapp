'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion } from 'framer-motion';
import {
    LifeBuoy,
    MessageSquare,
    PhoneCall,
    Mail,
    FileText,
    Send,
    ChevronRight,
    Search,
    ShieldAlert,
    Clock
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/axios';

export default function SupportPage() {
    const [isCreatingTicket, setIsCreatingTicket] = useState(false);
    const [ticketCategory, setTicketCategory] = useState('logistics');
    const [ticketMessage, setTicketMessage] = useState('');
    const [ticketReference, setTicketReference] = useState('');
    const [submittingTicket, setSubmittingTicket] = useState(false);

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.6, staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    const handleSubmitTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ticketMessage.trim()) return;
        setSubmittingTicket(true);
        try {
            await api.post('/support/tickets', {
                category: ticketCategory,
                message: ticketMessage.trim(),
                reference: ticketReference.trim() || undefined,
            });
            toast.success('Ticket submitted. We\'ll respond shortly.');
            setTicketMessage('');
            setTicketReference('');
            setIsCreatingTicket(false);
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Could not submit ticket');
        } finally {
            setSubmittingTicket(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="pb-6 md:pb-8">
            <motion.div
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4"
            >
                <div className="flex items-center gap-3">
                    <LifeBuoy className="h-8 w-8 text-blue-600" />
                    <div>
                        <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 tracking-tight leading-tight">Support</h1>
                        <p className="text-xs text-green-600 flex items-center gap-1.5 mt-0.5">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                            Agents available
                        </p>
                    </div>
                </div>
                <div className="relative group max-w-xs w-full md:w-auto">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search help..."
                        className="w-full h-9 pl-9 pr-4 bg-white border border-gray-100 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                </div>
            </motion.div>

            {/* Assistance Grid (Bento Style) */}
            <motion.div
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6"
            >
                {/* Main Action - New Ticket */}
                <motion.div
                    variants={itemVariants}
                    className="lg:col-span-8 bg-gray-900 rounded-2xl p-6 lg:p-8 text-white relative overflow-hidden border border-white/5"
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[80px]" />

                    {!isCreatingTicket ? (
                        <div className="relative z-10 flex flex-col h-full justify-center">
                            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/10 mb-4">
                                <MessageSquare className="h-6 w-6 text-blue-400" />
                            </div>
                            <p className="text-blue-300 text-xs font-semibold uppercase tracking-wider mb-1">Contact</p>
                            <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 tracking-tight">New support request</h2>
                            <p className="text-gray-400 text-sm mb-6 max-w-md leading-relaxed">
                                Open a ticket and our team will respond within 2–4 hours.
                            </p>
                            <button
                                onClick={() => setIsCreatingTicket(true)}
                                className="w-fit h-10 px-5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-white hover:text-gray-900 transition-all flex items-center gap-2"
                            >
                                Open ticket <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    ) : (
                        <div className="relative z-10 animate-fade-in-up">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-bold tracking-tight">New ticket</h2>
                                <button
                                    type="button"
                                    onClick={() => setIsCreatingTicket(false)}
                                    className="min-h-[44px] min-w-[44px] px-3 text-xs font-medium text-gray-400 hover:text-white transition-colors flex items-center justify-center -m-2"
                                >
                                    Cancel
                                </button>
                            </div>
                            <form onSubmit={handleSubmitTicket} className="space-y-4">
                                <div>
                                    <label className="text-xs font-medium text-gray-400 uppercase tracking-wider ml-1 mb-1.5 block">Category</label>
                                    <select
                                        value={ticketCategory}
                                        onChange={(e) => setTicketCategory(e.target.value)}
                                        className="w-full h-10 px-4 bg-white/5 border border-white/10 rounded-xl text-sm font-medium text-white focus:bg-white/10 focus:border-blue-500 transition-all outline-none appearance-none"
                                    >
                                        <option value="logistics" className="bg-gray-900">Logistics</option>
                                        <option value="procurement" className="bg-gray-900">Procurement</option>
                                        <option value="wallet" className="bg-gray-900">Payments</option>
                                        <option value="account" className="bg-gray-900">Account</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-400 uppercase tracking-wider ml-1 mb-1.5 block">Message</label>
                                    <textarea
                                        value={ticketMessage}
                                        onChange={(e) => setTicketMessage(e.target.value)}
                                        placeholder="Describe your issue and include order or reference IDs if relevant..."
                                        className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-sm font-medium text-white focus:bg-white/10 focus:border-blue-500 transition-all outline-none min-h-[100px] resize-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-400 uppercase tracking-wider ml-1 mb-1.5 block">Reference (optional)</label>
                                    <input
                                        value={ticketReference}
                                        onChange={(e) => setTicketReference(e.target.value)}
                                        placeholder="Order or tracking ID (e.g. ORD-..., SHP-...)"
                                        className="w-full h-10 px-4 bg-white/5 border border-white/10 rounded-xl text-sm font-medium text-white placeholder:text-gray-500 focus:bg-white/10 focus:border-blue-500 transition-all outline-none"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={submittingTicket}
                                    className="w-full min-h-[44px] h-10 flex items-center justify-center gap-2 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-white hover:text-gray-900 transition-all disabled:opacity-60"
                                >
                                    {submittingTicket ? 'Submitting...' : 'Submit'}
                                    {!submittingTicket && <Send className="h-3.5 w-3.5" />}
                                </button>
                            </form>
                        </div>
                    )}
                </motion.div>

                {/* Side Contacts */}
                <div className="lg:col-span-4 flex flex-col gap-4">
                    <motion.div
                        variants={itemVariants}
                        className="flex-1 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all"
                    >
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100 mb-3">
                            <PhoneCall className="h-5 w-5 text-blue-600" />
                        </div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Phone & WhatsApp</p>
                        <a href="tel:+8618320709024" className="text-base font-bold text-gray-900 tracking-tight mb-0.5 block hover:text-blue-600 transition-colors">+86 183 2070 9024</a>
                        <a href="https://wa.me/8618320709024" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:text-blue-700 font-medium">Chat on WhatsApp →</a>
                    </motion.div>

                    <motion.div
                        variants={itemVariants}
                        className="flex-1 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all"
                    >
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100 mb-3">
                            <Mail className="h-5 w-5 text-indigo-600" />
                        </div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Email</p>
                        <a href="mailto:info@thinqshopping.app" className="text-sm font-bold text-gray-900 tracking-tight mb-0.5 block truncate hover:text-blue-600">info@thinqshopping.app</a>
                        <p className="text-xs text-gray-400 flex items-center gap-1"><Clock className="h-3 w-3" /> 24h response</p>
                    </motion.div>
                </div>
            </motion.div>

            {/* Knowledge Base & FAQs */}
            <motion.div
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
            >
                <div className="px-5 py-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 flex items-center">
                        <FileText className="h-4 w-4 mr-2 text-blue-600" />
                        Help articles
                    </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-50">
                    {[
                        { title: 'Your order ID', desc: 'How your unique ID is used for tracking across warehouses and delivery.', icon: ShieldAlert },
                        { title: 'Procurement guide', desc: 'Timelines and costs when using our sourcing service.', icon: FileText },
                        { title: 'Shipping & delivery', desc: 'Set your address and track shipments in real time.', icon: LifeBuoy },
                        { title: 'Payments & deposits', desc: 'Paystack and mobile money; typical clearing times.', icon: ShieldAlert }
                    ].map((article, idx) => (
                        <div key={idx} className="p-5 hover:bg-gray-50/50 transition-all cursor-pointer group">
                            <div className="flex flex-col gap-3">
                                <article.icon className="h-5 w-5 text-gray-300 group-hover:text-blue-600 transition-colors" />
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">{article.title}</h4>
                                    <p className="text-xs text-gray-500 leading-relaxed">{article.desc}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>
            </div>
        </DashboardLayout>
    );
}
