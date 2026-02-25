
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from './wallet.service';
import { PaymentService } from './payment.service';
import { TransferDirection, RecipientType, PaymentMethod, PaymentStatus } from '@prisma/client';

@Injectable()
export class TransferService {
    constructor(
        private prisma: PrismaService,
        private walletService: WalletService,
        private paymentService: PaymentService
    ) { }

    private getPaystackSecret(): string {
        const key = process.env.PAYSTACK_SECRET_KEY;
        if (!key || key === 'your_paystack_secret') {
            throw new BadRequestException('Paystack is not configured');
        }
        return key;
    }

    async getExchangeRate() {
        const rate = await this.prisma.exchangeRate.findFirst({
            where: { is_active: true },
            orderBy: { created_at: 'desc' }
        });
        return rate ? Number(rate.rate_ghs_to_cny) : 0.055;
    }

    async setExchangeRate(rateGhsToCny: number) {
        const rate = Number(rateGhsToCny);
        if (!Number.isFinite(rate) || rate <= 0) {
            throw new BadRequestException('Invalid rate: must be a positive number');
        }
        const existing = await this.prisma.exchangeRate.findFirst({
            where: { is_active: true },
            orderBy: { created_at: 'desc' }
        });
        if (existing) {
            await this.prisma.exchangeRate.update({
                where: { id: existing.id },
                data: { rate_ghs_to_cny: rate }
            });
            return { rate_ghs_to_cny: rate };
        }
        await this.prisma.exchangeRate.create({
            data: { rate_ghs_to_cny: rate, is_active: true }
        });
        return { rate_ghs_to_cny: rate };
    }

    async createTransfer(userId: number, dto: any) {
        const { amount_ghs, transfer_direction, recipient_type, recipient_details, purpose, payment_method, qr_codes: rawQrCodes } = dto;

        // Normalize and validate QR codes (array of { image, amount_ghs, recipient_name? })
        let qr_codes: Array<{ image: string; amount_ghs: number; recipient_name?: string }> = [];
        if (Array.isArray(rawQrCodes) && rawQrCodes.length > 0) {
            qr_codes = rawQrCodes
                .filter((q: any) => q && (q.image || q.image_base64) && typeof q.amount_ghs === 'number')
                .map((q: any) => ({
                    image: q.image || q.image_base64,
                    amount_ghs: Number(q.amount_ghs),
                    recipient_name: typeof q.recipient_name === 'string' ? q.recipient_name.trim() : undefined
                }));
            const sumQr = qr_codes.reduce((s, q) => s + q.amount_ghs, 0);
            const mainAmount = Number(amount_ghs);
            if (Math.abs(sumQr - mainAmount) > 0.01) {
                throw new BadRequestException(
                    `QR code amounts (₵${sumQr.toFixed(2)}) must equal transfer amount (₵${mainAmount.toFixed(2)}). Please match the totals.`
                );
            }
        }

        // Fetch User Details for Sender Info
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { profile: true }
        });

        if (!user) throw new BadRequestException('User not found');

        const senderName = user.profile ? `${user.profile.first_name} ${user.profile.last_name}` : 'Unknown User';

        const rate = await this.getExchangeRate();
        const amount_cny = amount_ghs * rate;
        const transfer_fee = 0; // Or calculate based on amount
        const total_amount = Number(amount_ghs) + transfer_fee;

        const isWallet = payment_method === 'wallet';
        const isPaystack = payment_method === 'card' || payment_method === 'mobile_money';

        // Payment Logic - wallet: deduct now; card/mobile_money: create pending, pay via Paystack
        if (isWallet) {
            const wallet = await this.walletService.getBalance(userId);
            if (!wallet || Number(wallet.balance_ghs) < total_amount) {
                throw new BadRequestException('Insufficient wallet balance');
            }
            await this.walletService.topUp(userId, -total_amount);
        }

        const token = `TRF-${Date.now()}`;
        const paystackRef = isPaystack ? `PAY-TRF-${Date.now()}-${userId}` : null;

        // Create Transfer Record
        const transfer = await this.prisma.moneyTransfer.create({
            data: {
                user_id: userId,
                transfer_type: transfer_direction as TransferDirection || TransferDirection.send_to_china,
                token,
                amount_ghs,
                amount_cny,
                exchange_rate: rate,
                transfer_fee,
                total_amount,
                status: isWallet ? 'payment_received' : 'payment_received',
                sender_name: senderName,
                sender_phone: user.phone,
                sender_email: user.email,
                recipient_name: recipient_details.name,
                recipient_phone: recipient_details.phone || '',
                recipient_type: recipient_type as RecipientType,
                recipient_details: recipient_details,
                payment_method: payment_method as PaymentMethod,
                payment_status: isWallet ? 'success' : 'pending',
                paystack_reference: paystackRef,
                purpose,
                qr_codes,
                admin_reply_images: []
            }
        });

        // Create Payment record for Paystack (reference used in Paystack popup)
        if (isPaystack && paystackRef) {
            await this.paymentService.initializePayment(
                userId,
                Number(total_amount),
                'money_transfer',
                transfer.id,
                paystackRef
            );
        }

        return { ...transfer, paystack_reference: paystackRef };
    }

    async getTransferByToken(token: string) {
        return this.prisma.moneyTransfer.findUnique({
            where: { token },
            include: {
                tracking: { orderBy: { created_at: 'asc' } }
            }
        });
    }

    async getUserTransfers(userId: number) {
        return this.prisma.moneyTransfer.findMany({
            where: { user_id: userId },
            orderBy: { created_at: 'desc' }
        });
    }

    async getAllTransfers() {
        return this.prisma.moneyTransfer.findMany({
            include: {
                user: {
                    select: {
                        email: true,
                        profile: {
                            select: {
                                first_name: true,
                                last_name: true
                            }
                        }
                    }
                }
            },
            orderBy: { created_at: 'desc' }
        });
    }

    async updateTransferStatus(id: number, status: string, notes?: string) {
        const data: { status: any; admin_notes?: string } = {
            status: status as any,
        };
        if (notes !== undefined && notes !== null) {
            data.admin_notes = notes;
        }
        return this.prisma.moneyTransfer.update({
            where: { id },
            data,
        });
    }

    async getTransferById(id: number) {
        const transfer = await this.prisma.moneyTransfer.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        email: true,
                        profile: {
                            select: { first_name: true, last_name: true }
                        }
                    }
                }
            }
        });
        if (!transfer) throw new NotFoundException('Transfer not found');
        return transfer;
    }

    async addAdminReplyImage(id: number, imageUrl: string) {
        const transfer = await this.prisma.moneyTransfer.findUnique({ where: { id } });
        if (!transfer) return null;

        const currentImages = (transfer.admin_reply_images as string[]) || [];
        const newImages = [...currentImages, imageUrl];

        return this.prisma.moneyTransfer.update({
            where: { id },
            data: { admin_reply_images: newImages }
        });
    }

    async updateQrFulfillment(transferId: number, qrIndex: number, body: { confirmation_image: string; admin_notes?: string }) {
        const transfer = await this.prisma.moneyTransfer.findUnique({ where: { id: transferId } });
        if (!transfer) throw new NotFoundException('Transfer not found');

        const qrCodes = (transfer.qr_codes as Array<{ image: string; amount_ghs?: number; recipient_name?: string }>) || [];
        if (qrIndex < 0 || qrIndex >= qrCodes.length) {
            throw new BadRequestException('Invalid QR index');
        }
        if (!body?.confirmation_image?.trim()) {
            throw new BadRequestException('confirmation_image is required');
        }

        type Fulfillment = { qr_index: number; status: string; confirmation_image?: string; admin_notes?: string; fulfilled_at?: string };
        let fulfillments: Fulfillment[] = Array.isArray(transfer.qr_fulfillments) ? (transfer.qr_fulfillments as Fulfillment[]) : [];
        while (fulfillments.length < qrCodes.length) {
            fulfillments.push({ qr_index: fulfillments.length, status: 'pending' });
        }
        fulfillments[qrIndex] = {
            qr_index: qrIndex,
            status: 'fulfilled',
            confirmation_image: body.confirmation_image.trim(),
            admin_notes: body.admin_notes?.trim() || undefined,
            fulfilled_at: new Date().toISOString()
        };

        return this.prisma.moneyTransfer.update({
            where: { id: transferId },
            data: { qr_fulfillments: fulfillments }
        });
    }

    async confirmTransferPayment(transferId: number, userId: number, paystackReference: string) {
        const transfer = await this.prisma.moneyTransfer.findUnique({
            where: { id: transferId }
        });
        if (!transfer) throw new BadRequestException('Transfer not found');
        if (transfer.user_id !== userId) throw new BadRequestException('Unauthorized');
        if (transfer.payment_status === 'success') return transfer;

        const secret = this.getPaystackSecret();
        const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(paystackReference)}`, {
            headers: { Authorization: `Bearer ${secret}` }
        });
        const json = await res.json();
        if (!json.status || json.data?.status !== 'success') {
            throw new BadRequestException('Payment verification failed');
        }

        await this.prisma.moneyTransfer.update({
            where: { id: transferId },
            data: {
                paystack_reference: paystackReference,
                payment_status: 'success'
            }
        });

        await this.prisma.payment.updateMany({
            where: { transaction_ref: paystackReference, service_type: 'money_transfer', service_id: transferId },
            data: { status: 'success', paystack_reference: paystackReference, paystack_response: json }
        });

        return this.prisma.moneyTransfer.findUnique({ where: { id: transferId } });
    }
}
