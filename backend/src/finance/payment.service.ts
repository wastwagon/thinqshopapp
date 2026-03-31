import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentService {
    constructor(private prisma: PrismaService) { }

    private getPaystackSecret(): string {
        const key = process.env.PAYSTACK_SECRET_KEY;
        if (!key || key === 'your_paystack_secret') {
            throw new BadRequestException('Paystack is not configured');
        }
        return key;
    }

    async initializePayment(userId: number, amount: number, serviceType: any, serviceId: number, transactionRef?: string) {
        const transaction_ref = transactionRef ?? `PAY-${Date.now()}`;
        return this.prisma.payment.create({
            data: {
                user_id: userId,
                amount,
                transaction_ref,
                service_type: serviceType,
                service_id: serviceId,
                status: 'pending',
                payment_method: 'card', // default
            },
        });
    }

    /** Verify with Paystack API using reference (transaction_ref we gave to frontend). Returns updated payment or null. wasPending: true if we just transitioned from pending to success (for idempotent credit). */
    async verifyWithPaystack(reference: string): Promise<{ payment: any; paystackData: any; wasPending: boolean } | null> {
        const payment = await this.prisma.payment.findFirst({
            where: { transaction_ref: reference },
        });
        if (!payment) return null;
        if (payment.status === 'success') {
            return { payment, paystackData: (payment as any).paystack_response, wasPending: false };
        }

        const secret = this.getPaystackSecret();
        const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
            headers: { Authorization: `Bearer ${secret}` },
        });
        const json = await res.json();
        if (!json.status || json.data?.status !== 'success') return null;

        const updated = await this.prisma.payment.update({
            where: { id: payment.id },
            data: {
                status: 'success',
                paystack_reference: reference,
                paystack_response: json,
            },
        });
        return { payment: updated, paystackData: json, wasPending: true };
    }

    async verifyWebhook(reference: string, status: any, response: any) {
        const payment = await this.prisma.payment.findFirst({
            where: { transaction_ref: reference },
        });

        if (!payment) return null;
        if (payment.status === 'success') return payment;

        return this.prisma.payment.update({
            where: { id: payment.id },
            data: {
                status: status === 'success' ? 'success' : 'failed',
                paystack_reference: reference,
                paystack_response: response,
            },
        });
    }
}
