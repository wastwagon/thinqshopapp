'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
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
    Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/axios';

export default function SupportPage() {
    const [isCreatingTicket, setIsCreatingTicket] = useState(false);
    const [ticketCategory, setTicketCategory] = useState('logistics');
    const [ticketMessage, setTicketMessage] = useState('');
    const [ticketReference, setTicketReference] = useState('');
    const [submittingTicket, setSubmittingTicket] = useState(false);

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
            toast.success("Ticket submitted. We'll respond shortly.");
            setTicketMessage('');
            setTicketReference('');
            setIsCreatingTicket(false);
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(err?.response?.data?.message || 'Could not submit ticket');
        } finally {
            setSubmittingTicket(false);
        }
    };

    const inputClass =
        'w-full px-4 py-2.5 bg-gray-50 border border-gray-200/90 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-colors';
    const labelClass = 'text-sm font-medium text-gray-600 mb-1.5 block';

    return (
        <DashboardLayout>
            <div className="pb-6 md:pb-8">
                <header className="mb-5 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                    <div>
                        <h1 className="page-title">Support</h1>
                        <p className="page-subtitle flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full" aria-hidden />
                            Agents available
                        </p>
                    </div>
                    <div className="relative w-full md:max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                        <input
                            type="search"
                            placeholder="Search help..."
                            className="w-full h-10 pl-10 pr-4 bg-white border border-gray-200/90 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                        />
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 mb-6">
                    <div className="lg:col-span-8 flat-card border-l-4 border-l-brand p-6 lg:p-8">
                        {!isCreatingTicket ? (
                            <div>
                                <div className="w-11 h-11 bg-brand/10 rounded-xl flex items-center justify-center mb-4">
                                    <MessageSquare className="h-5 w-5 text-brand" />
                                </div>
                                <p className="text-brand text-xs font-medium mb-1">Contact</p>
                                <h2 className="text-lg font-semibold text-gray-900 mb-2 tracking-tight">New support request</h2>
                                <p className="text-sm text-gray-500 mb-6 max-w-md leading-relaxed">
                                    Open a ticket and our team will respond within 2–4 hours.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setIsCreatingTicket(true)}
                                    className="h-10 px-5 bg-brand text-white rounded-xl font-semibold text-sm hover:bg-brand/90 transition-colors flex items-center gap-2"
                                >
                                    Open ticket
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        ) : (
                            <div>
                                <div className="flex items-center justify-between mb-5">
                                    <h2 className="text-lg font-semibold text-gray-900">New ticket</h2>
                                    <button
                                        type="button"
                                        onClick={() => setIsCreatingTicket(false)}
                                        className="text-sm font-medium text-gray-500 hover:text-gray-700 min-h-[44px] px-2"
                                    >
                                        Cancel
                                    </button>
                                </div>
                                <form onSubmit={handleSubmitTicket} className="space-y-4">
                                    <div>
                                        <label className={labelClass}>Category</label>
                                        <select
                                            value={ticketCategory}
                                            onChange={(e) => setTicketCategory(e.target.value)}
                                            className={inputClass}
                                        >
                                            <option value="logistics">Logistics</option>
                                            <option value="procurement">Procurement</option>
                                            <option value="wallet">Payments</option>
                                            <option value="account">Account</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Message</label>
                                        <textarea
                                            value={ticketMessage}
                                            onChange={(e) => setTicketMessage(e.target.value)}
                                            placeholder="Describe your issue and include order or reference IDs if relevant..."
                                            className={`${inputClass} min-h-[100px] resize-none py-3`}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Reference (optional)</label>
                                        <input
                                            value={ticketReference}
                                            onChange={(e) => setTicketReference(e.target.value)}
                                            placeholder="Order or tracking ID (e.g. ORD-..., SHP-...)"
                                            className={inputClass}
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={submittingTicket}
                                        className="w-full min-h-[44px] h-11 flex items-center justify-center gap-2 bg-brand text-white rounded-xl font-semibold text-sm hover:bg-brand/90 transition-colors disabled:opacity-60"
                                    >
                                        {submittingTicket ? 'Submitting...' : 'Submit'}
                                        {!submittingTicket && <Send className="h-4 w-4" />}
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>

                    <div className="lg:col-span-4 flex flex-col gap-4">
                        <div className="flat-card p-5 flex-1">
                            <div className="w-10 h-10 bg-brand/5 rounded-xl flex items-center justify-center mb-3">
                                <PhoneCall className="h-5 w-5 text-brand" />
                            </div>
                            <p className="text-xs font-medium text-gray-500 mb-1">Phone & WhatsApp</p>
                            <a
                                href="tel:+8618320709024"
                                className="text-base font-semibold text-gray-900 block hover:text-brand transition-colors"
                            >
                                +86 183 2070 9024
                            </a>
                            <a
                                href="https://wa.me/8618320709024"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-brand hover:text-brand/90 font-medium mt-1 inline-block"
                            >
                                Chat on WhatsApp →
                            </a>
                        </div>

                        <div className="flat-card p-5 flex-1">
                            <div className="w-10 h-10 bg-brand/5 rounded-xl flex items-center justify-center mb-3">
                                <Mail className="h-5 w-5 text-brand" />
                            </div>
                            <p className="text-xs font-medium text-gray-500 mb-1">Email</p>
                            <a
                                href="mailto:info@thinqshopping.app"
                                className="text-sm font-semibold text-gray-900 block truncate hover:text-brand transition-colors"
                            >
                                info@thinqshopping.app
                            </a>
                            <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                                <Clock className="h-3 w-3" />
                                24h response
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flat-card overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-brand" />
                        <h3 className="text-sm font-semibold text-gray-900">Help articles</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                        {[
                            {
                                title: 'Your order ID',
                                desc: 'How your unique ID is used for tracking across warehouses and delivery.',
                                icon: ShieldAlert,
                            },
                            {
                                title: 'Procurement guide',
                                desc: 'Timelines and costs when using our sourcing service.',
                                icon: FileText,
                            },
                            {
                                title: 'Shipping & delivery',
                                desc: 'Set your address and track shipments in real time.',
                                icon: LifeBuoy,
                            },
                            {
                                title: 'Payments & deposits',
                                desc: 'Paystack and mobile money; typical clearing times.',
                                icon: ShieldAlert,
                            },
                        ].map((article) => (
                            <button
                                key={article.title}
                                type="button"
                                className="p-5 text-left hover:bg-gray-50/80 transition-colors group"
                            >
                                <article.icon className="h-5 w-5 text-gray-300 group-hover:text-brand transition-colors mb-3" />
                                <h4 className="text-sm font-semibold text-gray-900 group-hover:text-brand transition-colors mb-1">
                                    {article.title}
                                </h4>
                                <p className="text-xs text-gray-500 leading-relaxed">{article.desc}</p>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
