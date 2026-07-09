'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DashboardPageHeader from '@/components/dashboard/DashboardPageHeader';
import DashboardContent from '@/components/dashboard/DashboardContent';
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
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/axios';
import { GroupedListSection, GroupedListItem } from '@/components/ui/GroupedList';
import { authInputClass, authLabelClass } from '@/components/auth/AuthScreen';

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

    const inputClass = authInputClass;
    const labelClass = authLabelClass;

    const helpArticles = [
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
    ];

    return (
        <DashboardLayout>
            <DashboardContent wide>
                <DashboardPageHeader
                    title="Support"
                    subtitle={
                        <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full" aria-hidden />
                            Agents available
                        </span>
                    }
                    accent="green"
                    action={
                        <div className="relative w-full md:w-48">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                            <input
                                type="search"
                                placeholder="Search help..."
                                className="w-full h-10 pl-10 pr-4 bg-white border border-gray-200/90 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                        </div>
                    }
                />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 mb-6">
                    <div className="lg:col-span-8 flat-card border-l-4 border-l-blue-600 p-6 lg:p-8">
                        {!isCreatingTicket ? (
                            <div>
                                <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                                    <MessageSquare className="h-5 w-5 text-blue-600" />
                                </div>
                                <p className="text-blue-600 text-xs font-medium mb-1">Contact</p>
                                <h2 className="text-lg font-semibold text-gray-900 mb-2 tracking-tight">New support request</h2>
                                <p className="text-sm text-gray-500 mb-6 max-w-md leading-relaxed">
                                    Open a ticket and our team will respond within 2–4 hours.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setIsCreatingTicket(true)}
                                    className="h-10 px-5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors flex items-center gap-2"
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
                                        className="w-full min-h-[44px] h-11 flex items-center justify-center gap-2 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors disabled:opacity-60"
                                    >
                                        {submittingTicket ? 'Submitting...' : 'Submit'}
                                        {!submittingTicket && <Send className="h-4 w-4" />}
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>

                    <div className="lg:col-span-4">
                        <GroupedListSection title="Contact us">
                            <GroupedListItem
                                href="tel:+8618320709024"
                                icon={PhoneCall}
                                title="Phone"
                                subtitle="+86 183 2070 9024"
                            />
                            <GroupedListItem
                                href="https://wa.me/8618320709024"
                                icon={MessageSquare}
                                title="WhatsApp"
                                subtitle="Chat with support"
                                external
                            />
                            <GroupedListItem
                                href="mailto:info@thinqshopping.app"
                                icon={Mail}
                                title="Email"
                                subtitle="info@thinqshopping.app · 24h response"
                            />
                        </GroupedListSection>
                    </div>
                </div>

                <GroupedListSection title="Help articles">
                    {helpArticles.map((article) => (
                        <GroupedListItem
                            key={article.title}
                            icon={article.icon}
                            title={article.title}
                            subtitle={article.desc}
                            onClick={() => toast('Full help article coming soon.')}
                        />
                    ))}
                </GroupedListSection>
            </DashboardContent>
        </DashboardLayout>
    );
}
