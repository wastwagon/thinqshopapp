'use client';

import { CheckCircle } from 'lucide-react';

type CheckoutProgressProps = {
    step: 1 | 2;
};

const STEPS = [
    { id: 1, label: 'Shipping' },
    { id: 2, label: 'Payment' },
] as const;

export default function CheckoutProgress({ step }: CheckoutProgressProps) {
    return (
        <div className="mb-6" aria-hidden>
            <div className="flex items-center gap-2">
                {STEPS.map((s, index) => {
                    const done = step > s.id;
                    const active = step === s.id;
                    return (
                        <div key={s.id} className="flex items-center flex-1 min-w-0">
                            <div className="flex items-center gap-2 min-w-0">
                                <div
                                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold transition-colors ${
                                        done
                                            ? 'bg-emerald-500 text-white'
                                            : active
                                              ? 'bg-blue-600 text-white shadow-[0_4px_14px_-4px_rgba(2,39,79,0.45)]'
                                              : 'bg-gray-100 text-gray-400'
                                    }`}
                                >
                                    {done ? <CheckCircle className="h-4 w-4" /> : s.id}
                                </div>
                                <span className={`text-xs font-semibold truncate ${active ? 'text-gray-900' : done ? 'text-emerald-700' : 'text-gray-400'}`}>
                                    {s.label}
                                </span>
                            </div>
                            {index < STEPS.length - 1 && (
                                <div className={`flex-1 h-0.5 mx-2 rounded-full ${done ? 'bg-emerald-400' : 'bg-gray-200'}`} />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
