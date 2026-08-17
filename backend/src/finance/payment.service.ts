import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { paystackAmountMatches } from './paystack-amount';
import { randomPublicId } from '../common/secure-id';

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
        const transaction_ref = transactionRef ?? randomPublicId('PAY');
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

    /**
     * Verify with Paystack API. Amount and currency must match the stored payment.
     * wasPending is true only if this caller atomically claimed pending → success.
     */
    async verifyWithPaystack(reference: string): Promise<{ payment: any; paystackData: any; wasPending: boolean } | null> {
        const payment = await this.prisma.payment.findFirst({
            where: { transaction_ref: reference },
        });
        if (!payment) return null;
        if (payment.status === 'success') {
            return { payment, paystackData: (payment as any).paystack_response, wasPending: false };
        }
        if (payment.status !== 'pending') return null;

        const secret = this.getPaystackSecret();
        const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
            headers: { Authorization: `Bearer ${secret}` },
        });
        const json = await res.json();
        if (!json.status || json.data?.status !== 'success') return null;
        if (!paystackAmountMatches(payment.amount, json.data?.amount, json.data?.currency)) {
            return null;
        }

        const claimed = await this.prisma.payment.updateMany({
            where: { id: payment.id, status: 'pending' },
            data: {
                status: 'success',
                paystack_reference: reference,
                paystack_response: json,
            },
        });
        const updated = await this.prisma.payment.findUnique({ where: { id: payment.id } });
        if (!updated) return null;
        return { payment: updated, paystackData: json, wasPending: claimed.count === 1 };
    }
}
