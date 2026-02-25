import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../finance/wallet.service';
import { ProcurementStatus, QuoteStatus } from '@prisma/client';

@Injectable()
export class ProcurementService {
    constructor(
        private prisma: PrismaService,
        private walletService: WalletService
    ) { }

    async createRequest(userId: number, data: any) {
        const request_number = `PRQ-${Date.now()}`;
        return this.prisma.procurementRequest.create({
            data: {
                user_id: userId,
                ...data,
                request_number,
                status: 'submitted',
            },
        });
    }

    async findUserRequests(userId: number) {
        return this.prisma.procurementRequest.findMany({
            where: { user_id: userId },
            include: { quotes: true, orders: true },
        });
    }

    async findRequest(requestNumber: string) {
        return this.prisma.procurementRequest.findUnique({
            where: { request_number: requestNumber },
            include: { quotes: { orderBy: { created_at: 'desc' } }, orders: { include: { tracking: true } } },
        });
    }

    async findUserRequestById(userId: number, requestId: number) {
        const req = await this.prisma.procurementRequest.findFirst({
            where: { id: requestId, user_id: userId },
            include: { quotes: { orderBy: { created_at: 'desc' } }, orders: { include: { tracking: true } } },
        });
        if (!req) throw new NotFoundException('Request not found');
        return req;
    }

    async getAllRequests() {
        return this.prisma.procurementRequest.findMany({
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
                },
                quotes: true
            },
            orderBy: { created_at: 'desc' }
        });
    }

    async updateRequestStatus(id: number, status: ProcurementStatus) {
        return this.prisma.procurementRequest.update({
            where: { id },
            data: { status }
        });
    }

    async createQuote(requestId: number, dto: { amount: number, details: string }) {
        return this.prisma.procurementQuote.create({
            data: {
                request_id: requestId,
                quote_amount: dto.amount,
                quote_details: dto.details,
                status: 'pending'
            }
        });
    }

    async createOrderFromQuote(userId: number, quoteId: number) {
        const quote = await this.prisma.procurementQuote.findUnique({
            where: { id: quoteId },
            include: { request: true }
        });

        if (!quote) throw new BadRequestException('Quote not found');
        if (quote.status !== 'pending') throw new BadRequestException('Quote is not valid for acceptance');

        // Check Wallet Balance
        const wallet = await this.walletService.getBalance(userId);
        if (!wallet || Number(wallet.balance_ghs) < Number(quote.quote_amount)) {
            throw new BadRequestException('Insufficient wallet balance');
        }

        return this.prisma.$transaction(async (prisma) => {
            // Deduct Funds
            await prisma.userWallet.update({
                where: { user_id: userId },
                data: { balance_ghs: { decrement: quote.quote_amount } }
            });

            // Update Quote Status
            await prisma.procurementQuote.update({
                where: { id: quoteId },
                data: { status: 'accepted' }
            });

            // Update Request Status
            await prisma.procurementRequest.update({
                where: { id: quote.request_id },
                data: { status: 'accepted' }
            });

            // Create Order
            const order = await prisma.procurementOrder.create({
                data: {
                    user_id: userId,
                    request_id: quote.request_id,
                    quote_id: quote.id,
                    order_number: `POR-${Date.now()}`,
                    amount: quote.quote_amount,
                    payment_method: 'wallet',
                    payment_status: 'success',
                    status: 'payment_received'
                }
            });

            // Create Payment Ledgers
            await prisma.payment.create({
                data: {
                    user_id: userId,
                    transaction_ref: `PUR-${Date.now()}`,
                    amount: quote.quote_amount,
                    payment_method: 'wallet',
                    service_type: 'procurement',
                    service_id: order.id,
                    status: 'success'
                }
            });

            return order;
        });
    }
}
