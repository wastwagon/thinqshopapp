'use client';

import { useEffect } from 'react';
import { usePaystackPayment } from 'react-paystack';

interface WalletPaystackTriggerProps {
    config: { reference: string; amount_pesewas: number };
    userEmail?: string;
    onSuccess: (ref: { reference: string }) => void | Promise<void>;
    onClose: () => void;
}

export default function WalletPaystackTrigger({ config, userEmail, onSuccess, onClose }: WalletPaystackTriggerProps) {
    const initializePaystack = usePaystackPayment({
        reference: config.reference,
        amount: config.amount_pesewas,
        email: userEmail ?? 'customer@example.com',
        publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || 'pk_test_placeholder',
        currency: 'GHS',
    });

    useEffect(() => {
        initializePaystack({ onSuccess, onClose } as any);
    }, []);

    return null;
}
