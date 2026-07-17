import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SmsService } from '../sms/sms.service';
import { TransferDirection, RecipientType, PaymentMethod, PaymentStatus, Prisma } from '@prisma/client';
import { CreateTransferDto, UpdateTransferPaymentDetailsDto } from './dto/transfer.dto';

export type TransferPaymentDetails = {
    momo_agent_number: string;
    momo_name_primary: string;
    momo_name_alternate: string;
    momo_network: string;
    bank_name: string;
    bank_account_name: string;
    bank_account_number: string;
    bank_branch: string;
};

const PAYMENT_DETAIL_KEYS = [
    'transfer_momo_agent_number',
    'transfer_momo_name_primary',
    'transfer_momo_name_alternate',
    'transfer_momo_network',
    'transfer_bank_name',
    'transfer_bank_account_name',
    'transfer_bank_account_number',
    'transfer_bank_branch',
] as const;

const PAYMENT_DETAIL_DEFAULTS: TransferPaymentDetails = {
    momo_agent_number: '0539761297',
    momo_name_primary: 'Gohdit Print and Computers',
    momo_name_alternate: 'Emmanuel ASIEDU',
    momo_network: 'MTN',
    bank_name: 'GCB Bank',
    bank_account_name: 'ThinQShop Ltd',
    bank_account_number: '1234567890123',
    bank_branch: 'Accra Main',
};

const KEY_TO_FIELD: Record<(typeof PAYMENT_DETAIL_KEYS)[number], keyof TransferPaymentDetails> = {
    transfer_momo_agent_number: 'momo_agent_number',
    transfer_momo_name_primary: 'momo_name_primary',
    transfer_momo_name_alternate: 'momo_name_alternate',
    transfer_momo_network: 'momo_network',
    transfer_bank_name: 'bank_name',
    transfer_bank_account_name: 'bank_account_name',
    transfer_bank_account_number: 'bank_account_number',
    transfer_bank_branch: 'bank_branch',
};

@Injectable()
export class TransferService {
    constructor(
        private prisma: PrismaService,
        private smsService: SmsService,
    ) { }

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

    async getPaymentDetails(): Promise<TransferPaymentDetails> {
        const rows = await this.prisma.setting.findMany({
            where: { setting_key: { in: [...PAYMENT_DETAIL_KEYS] } },
        });
        const map = { ...PAYMENT_DETAIL_DEFAULTS };
        for (const row of rows) {
            const field = KEY_TO_FIELD[row.setting_key as (typeof PAYMENT_DETAIL_KEYS)[number]];
            if (field && row.setting_value?.trim()) {
                map[field] = row.setting_value.trim();
            }
        }
        return map;
    }

    async updatePaymentDetails(dto: UpdateTransferPaymentDetailsDto): Promise<TransferPaymentDetails> {
        const pairs: Array<{ key: (typeof PAYMENT_DETAIL_KEYS)[number]; value?: string }> = [
            { key: 'transfer_momo_agent_number', value: dto.momo_agent_number },
            { key: 'transfer_momo_name_primary', value: dto.momo_name_primary },
            { key: 'transfer_momo_name_alternate', value: dto.momo_name_alternate },
            { key: 'transfer_momo_network', value: dto.momo_network },
            { key: 'transfer_bank_name', value: dto.bank_name },
            { key: 'transfer_bank_account_name', value: dto.bank_account_name },
            { key: 'transfer_bank_account_number', value: dto.bank_account_number },
            { key: 'transfer_bank_branch', value: dto.bank_branch },
        ];

        await Promise.all(
            pairs
                .filter((p) => p.value !== undefined)
                .map((p) =>
                    this.prisma.setting.upsert({
                        where: { setting_key: p.key },
                        update: { setting_value: String(p.value ?? '').trim(), updated_at: new Date() },
                        create: {
                            setting_key: p.key,
                            setting_value: String(p.value ?? '').trim(),
                            description: 'Transfer offline payment detail',
                            updated_at: new Date(),
                        },
                    }),
                ),
        );

        return this.getPaymentDetails();
    }

    async createTransfer(userId: number, dto: CreateTransferDto) {
        const {
            amount_ghs,
            transfer_direction,
            recipient_type,
            recipient_details,
            purpose,
            payment_method,
            proof_of_transfer,
            payment_transaction_id,
            payment_sender_name,
            qr_codes: rawQrCodes,
        } = dto;

        if (payment_method !== 'mobile_money' && payment_method !== 'bank_transfer') {
            throw new BadRequestException('Only mobile money or bank transfer payment is supported');
        }

        const proofUrl = String(proof_of_transfer || '').trim();
        const txnId = String(payment_transaction_id || '').trim();
        const paySender = String(payment_sender_name || '').trim();
        if (!proofUrl) throw new BadRequestException('Payment confirmation screenshot is required');
        if (!txnId) throw new BadRequestException('Transaction ID is required');
        if (!paySender) throw new BadRequestException('Sender name is required');

        const recipientName = String((recipient_details as any)?.name || '').trim();
        const recipientPhone = String((recipient_details as any)?.phone || '').trim();
        if (!recipientName) {
            throw new BadRequestException('recipient_details.name is required');
        }

        const rate = await this.getExchangeRate();
        const amount_cny = Number(amount_ghs) * rate;
        let qr_codes: Array<{ image: string; amount_cny: number; recipient_name?: string }> = [];
        if (Array.isArray(rawQrCodes) && rawQrCodes.length > 0) {
            qr_codes = rawQrCodes
                .filter((q: any) => q && (q.image || q.image_base64) && typeof (q.amount_cny ?? q.amount_ghs) === 'number')
                .map((q: any) => ({
                    image: q.image || q.image_base64,
                    amount_cny: Number(q.amount_cny ?? q.amount_ghs),
                    recipient_name: typeof q.recipient_name === 'string' ? q.recipient_name.trim() : undefined
                }));
            const sumQr = qr_codes.reduce((s, q) => s + q.amount_cny, 0);
            if (Math.abs(sumQr - amount_cny) > 0.01) {
                throw new BadRequestException(
                    `QR code amounts (¥${sumQr.toFixed(2)}) must equal converted amount (¥${amount_cny.toFixed(2)}). Recipients receive CNY.`
                );
            }
        }

        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { profile: true }
        });

        if (!user) throw new BadRequestException('User not found');

        const senderName = user.profile ? `${user.profile.first_name} ${user.profile.last_name}` : 'Unknown User';

        const transfer_fee = 0;
        const total_amount = Number(amount_ghs) + transfer_fee;
        const token = `TRF-${Date.now()}`;

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
                // Awaiting admin payment review
                status: 'processing',
                sender_name: senderName,
                sender_phone: user.phone,
                sender_email: user.email,
                recipient_name: recipientName,
                recipient_phone: recipientPhone,
                recipient_type: recipient_type as RecipientType,
                recipient_details: recipient_details as Prisma.InputJsonValue,
                payment_method: payment_method as PaymentMethod,
                payment_status: PaymentStatus.pending,
                proof_of_transfer: proofUrl,
                payment_transaction_id: txnId,
                payment_sender_name: paySender,
                purpose,
                qr_codes,
                admin_reply_images: []
            }
        });

        this.smsService
            .sendToUser(
                userId,
                `ThinQShop Transfer: GHS ${amount_ghs} (Token: ${token}) submitted. We will verify your payment and process your transfer.`,
            )
            .catch(() => {});

        return transfer;
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
        const data: {
            status: any;
            admin_notes?: string;
            payment_status?: PaymentStatus;
        } = {
            status: status as any,
        };
        if (notes !== undefined && notes !== null) {
            data.admin_notes = notes;
        }
        if (status === 'payment_received') {
            data.payment_status = PaymentStatus.success;
        } else if (status === 'failed' || status === 'cancelled') {
            data.payment_status = PaymentStatus.failed;
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

    /** Legacy Paystack path — transfers now use offline payment only. */
    async confirmTransferPayment(_transferId: number, _userId: number, _paystackReference: string) {
        throw new BadRequestException(
            'Online payment is no longer available for transfers. Please use mobile money or bank transfer and submit your payment proof.',
        );
    }
}
