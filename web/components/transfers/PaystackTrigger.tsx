'use client';

import { useEffect } from 'react';
import { usePaystackPayment } from 'react-paystack';

interface PaystackTriggerProps {
    config: { reference: string; amount: number; transferId: number };
    onSuccess: (ref: { reference: string }) => void | Promise<void>;
    onClose: () => void;
    userEmail?: string;
}

export default function PaystackTrigger({ config, onSuccess, onClose, userEmail }: PaystackTriggerProps) {
    const initializePaystack = usePaystackPayment({
        reference: config.reference,
        amount: config.amount,
        email: userEmail ?? 'customer@example.com',
        publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || 'pk_test_placeholder',
        currency: 'GHS',
    });

    useEffect(() => {
        initializePaystack({ onSuccess, onClose } as any);
    }, []);

    return null;
}
