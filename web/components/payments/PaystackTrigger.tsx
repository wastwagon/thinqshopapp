'use client';

import { useEffect, useRef } from 'react';
import { usePaystackPayment } from 'react-paystack';

export type PaystackTriggerConfig = {
    reference: string;
    /** Amount in pesewas (Paystack minor units for GHS) */
    amount: number;
};

export type PaystackTriggerProps = {
    config: PaystackTriggerConfig;
    userEmail?: string;
    onSuccess: (ref: { reference: string }) => void | Promise<void>;
    onClose: () => void;
};

export default function PaystackTrigger({ config, userEmail, onSuccess, onClose }: PaystackTriggerProps) {
    const opened = useRef(false);

    const initializePaystack = usePaystackPayment({
        reference: config.reference,
        amount: config.amount,
        email: userEmail ?? 'customer@example.com',
        publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || 'pk_test_placeholder',
        currency: 'GHS',
    });

    useEffect(() => {
        if (opened.current) return;
        opened.current = true;
        initializePaystack({ onSuccess, onClose } as Parameters<typeof initializePaystack>[0]);
        // Intentionally run once when mounted with this config (parent unmounts on close).
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
}
