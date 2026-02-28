'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/axios';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Link from 'next/link';
import { ArrowLeft, Download, Printer, CheckCircle, Clock, Send, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

function downloadImage(url: string, filename: string) {
    fetch(url, { mode: 'cors' })
        .then((res) => res.blob())
        .then((blob) => {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = filename;
            a.click();
            URL.revokeObjectURL(a.href);
        })
        .catch(() => toast.error('Download failed'));
}

type QrEntry = { image: string; amount_ghs?: number; amount_cny?: number; recipient_name?: string };
type QrFulfillment = { qr_index: number; status: string; confirmation_image?: string; admin_notes?: string; fulfilled_at?: string };

interface Transfer {
    id: number;
    token: string;
    amount_ghs: string;
    amount_cny: string;
    status: string;
    recipient_name: string;
    recipient_type: string;
    created_at: string;
    admin_reply_images?: string[];
    admin_notes?: string;
    qr_codes?: string[] | QrEntry[];
    qr_fulfillments?: QrFulfillment[];
}

function normalizeQr(transfer: Transfer): QrEntry[] {
    const raw = transfer.qr_codes;
    if (!raw?.length) return [];
    if (typeof raw[0] === 'string') return (raw as string[]).map((url) => ({ image: url }));
    return raw as QrEntry[];
}

function getFulfillment(transfer: Transfer, index: number): QrFulfillment | undefined {
    const list = (transfer.qr_fulfillments || []) as QrFulfillment[];
    return list.find((f) => f.qr_index === index) || list[index];
}

export default function TransferConfirmationPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;
    const [transfer, setTransfer] = useState<Transfer | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        (async () => {
            try {
                const { data } = await api.get(`/finance/transfers/${id}`);
                setTransfer(data);
            } catch {
                toast.error('Transfer not found');
                router.replace('/dashboard/transfers');
            } finally {
                setLoading(false);
            }
        })();
    }, [id, router]);

    const handlePrint = () => {
        window.print();
    };

    if (loading || !transfer) {
        return (
            <DashboardLayout>
                <div className="max-w-3xl mx-auto py-12 flex flex-col items-center justify-center min-h-[40vh] print:hidden">
                    {loading && (
                        <>
                            <div className="animate-spin h-10 w-10 border-2 border-blue-600 border-t-transparent rounded-full mb-4" />
                            <p className="text-sm text-gray-500">Loading confirmation…</p>
                        </>
                    )}
                    {!loading && !transfer && (
                        <p className="text-sm text-gray-500">Transfer not found.</p>
                    )}
                </div>
            </DashboardLayout>
        );
    }

    const qrEntries = normalizeQr(transfer);

    return (
        <DashboardLayout>
            <div className="max-w-3xl mx-auto pb-6 md:pb-8">
                {/* Breadcrumb and actions - hidden when printing */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4 print:hidden">
                    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
                        <Link href="/dashboard" className="text-gray-500 hover:text-gray-900">Dashboard</Link>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                        <Link href="/dashboard/transfers" className="text-gray-500 hover:text-gray-900">Transfers</Link>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                        <span className="font-medium text-gray-900">Payment Confirmation</span>
                    </nav>
                    <div className="flex items-center gap-2">
                        <Link
                            href="/dashboard/transfers"
                            className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900"
                        >
                            <ArrowLeft className="h-4 w-4" /> Back
                        </Link>
                        <button
                            type="button"
                            onClick={handlePrint}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-blue-600 transition-colors"
                        >
                            <Printer className="h-4 w-4" /> Print / Save as PDF
                        </button>
                    </div>
                </div>

                {/* Printable content */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden print:shadow-none print:border print:rounded-lg">
                    <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                                <Send className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">Payment Confirmation</h1>
                                <p className="text-xs text-gray-500">Reference: {transfer.token}</p>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Generated on {new Date().toLocaleDateString(undefined, { dateStyle: 'long' })}. Use this document to confirm payment to your suppliers.
                        </p>
                    </div>

                    <div className="p-6 space-y-6">
                        <section>
                            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Transfer details</h2>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-500">Recipient</p>
                                    <p className="font-semibold text-gray-900">{transfer.recipient_name}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Amount (GHS)</p>
                                    <p className="font-semibold text-gray-900">₵{Number(transfer.amount_ghs).toFixed(2)}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Amount (CNY)</p>
                                    <p className="font-semibold text-gray-900">¥{Number(transfer.amount_cny).toFixed(2)}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Status</p>
                                    <p className="font-semibold text-gray-900 capitalize">{transfer.status.replace(/_/g, ' ')}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Date</p>
                                    <p className="font-semibold text-gray-900">{new Date(transfer.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                                </div>
                            </div>
                        </section>

                        {transfer.admin_notes && (
                            <section>
                                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Admin notes</h2>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{transfer.admin_notes}</p>
                            </section>
                        )}

                        {transfer.admin_reply_images && transfer.admin_reply_images.length > 0 && (
                            <section>
                                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Proof of transfer</h2>
                                <div className="flex flex-wrap gap-2">
                                    {transfer.admin_reply_images.map((img, i) => (
                                        <div key={i} className="group relative w-24 h-24 rounded-lg border border-gray-200 overflow-hidden bg-gray-50">
                                            <img src={img} alt={`Proof ${i + 1}`} className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => downloadImage(img, `proof-${i + 1}.png`)}
                                                className="absolute bottom-1 right-1 p-1.5 rounded-md bg-gray-900/80 text-white opacity-0 group-hover:opacity-100 transition-opacity print:hidden"
                                                title="Download"
                                            >
                                                <Download className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {qrEntries.length > 0 && (
                            <section>
                                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Per-recipient confirmation</h2>
                                <div className="space-y-4">
                                    {qrEntries.map((entry, i) => {
                                        const fulfillment = getFulfillment(transfer, i);
                                        const fulfilled = fulfillment?.status === 'fulfilled';
                                        return (
                                            <div key={i} className="rounded-lg border border-gray-200 bg-gray-50/50 overflow-hidden">
                                                <div className="p-4 flex flex-wrap items-center gap-4 border-b border-gray-100 bg-white">
                                                    <div className="group relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 bg-white shrink-0">
                                                        <img src={entry.image} alt={`QR ${i + 1}`} className="w-full h-full object-contain" />
                                                        <button
                                                            type="button"
                                                            onClick={() => downloadImage(entry.image, `qr-${entry.recipient_name || i + 1}.png`)}
                                                            className="absolute bottom-0.5 right-0.5 p-1 rounded bg-gray-900/80 text-white opacity-0 group-hover:opacity-100 transition-opacity print:hidden"
                                                            title="Download"
                                                        >
                                                            <Download className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                    <div>
                                                        {entry.recipient_name && (
                                                            <>
                                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Recipient</p>
                                                                <p className="text-sm font-semibold text-gray-900 mb-1">{entry.recipient_name}</p>
                                                            </>
                                                        )}
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Amount</p>
                                                        <p className="text-lg font-bold text-gray-900">¥{(entry.amount_cny ?? entry.amount_ghs) != null ? Number(entry.amount_cny ?? entry.amount_ghs).toFixed(2) : '—'}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {fulfilled ? (
                                                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 px-3 py-1.5 rounded-lg">
                                                                <CheckCircle className="h-3.5 w-3.5" /> Fulfilled
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg">
                                                                <Clock className="h-3.5 w-3.5" /> Pending
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                {fulfilled && (fulfillment!.confirmation_image || fulfillment!.admin_notes) && (
                                                    <div className="p-4 flex flex-wrap gap-4">
                                                        {fulfillment!.confirmation_image && (
                                                            <div className="group relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200 bg-white shrink-0">
                                                                <img src={fulfillment!.confirmation_image} alt="Confirmation" className="w-full h-full object-cover" />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => downloadImage(fulfillment!.confirmation_image!, `confirmation-${entry.recipient_name || i + 1}.png`)}
                                                                    className="absolute bottom-1 right-1 p-1.5 rounded-md bg-gray-900/80 text-white opacity-0 group-hover:opacity-100 transition-opacity print:hidden"
                                                                    title="Download"
                                                                >
                                                                    <Download className="h-3.5 w-3.5" />
                                                                </button>
                                                            </div>
                                                        )}
                                                        {fulfillment!.admin_notes && (
                                                            <p className="text-sm text-gray-700 flex-1 min-w-0">{fulfillment!.admin_notes}</p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
