import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WalletService {
    constructor(private prisma: PrismaService) { }

    async getBalance(userId: number) {
        return this.prisma.userWallet.findUnique({
            where: { user_id: userId },
        });
    }

    async topUp(userId: number, amount: number) {
        let wallet = await this.prisma.userWallet.findUnique({ where: { user_id: userId } });
        if (!wallet) {
            wallet = await this.prisma.userWallet.create({
                data: { user_id: userId, balance_ghs: 0 },
            });
        }
        return this.prisma.userWallet.update({
            where: { user_id: userId },
            data: { balance_ghs: { increment: amount } },
        });
    }

    /** Admin: list all users with wallet balances */
    async listAllForAdmin(query: { page?: number; limit?: number; search?: string }) {
        const { page = 1, limit = 50, search } = query;
        const skip = (Number(page) - 1) * Number(limit);
        const where: any = {};
        if (search?.trim()) {
            where.OR = [
                { user: { email: { contains: search.trim(), mode: 'insensitive' } } },
                { user: { phone: { contains: search.trim() } } },
            ];
        }
        const [wallets, total] = await Promise.all([
            this.prisma.userWallet.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            phone: true,
                            role: true,
                            profile: { select: { first_name: true, last_name: true } },
                        },
                    },
                },
                skip,
                take: Number(limit),
                orderBy: { updated_at: 'desc' },
            }),
            this.prisma.userWallet.count({ where }),
        ]);
        return {
            data: wallets.map((w) => ({
                id: w.id,
                user_id: w.user_id,
                balance_ghs: Number(w.balance_ghs),
                updated_at: w.updated_at,
                user: w.user,
            })),
            meta: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) },
        };
    }

    /** Admin: credit (amount > 0) or debit (amount < 0) user wallet */
    async adminAdjust(userId: number, amount: number) {
        const amt = Number(amount);
        if (!Number.isFinite(amt) || amt === 0) {
            throw new BadRequestException('Amount must be non-zero');
        }
        let wallet = await this.prisma.userWallet.findUnique({ where: { user_id: userId } });
        if (!wallet) {
            wallet = await this.prisma.userWallet.create({
                data: { user_id: userId, balance_ghs: 0 },
            });
        }
        const current = Number(wallet.balance_ghs);
        if (amt < 0 && current + amt < 0) {
            throw new BadRequestException(`Insufficient balance. Current: ₵${current.toFixed(2)}`);
        }
        return this.prisma.userWallet.update({
            where: { user_id: userId },
            data: { balance_ghs: { increment: amt } },
        });
    }

    async getTransactions(userId: number) {
        return this.prisma.payment.findMany({
            where: {
                OR: [
                    { user_id: userId }, // Payments made by user
                    // { service_type: 'wallet_topup', service_id: ... } // If we link specifically
                ]
            },
            orderBy: { created_at: 'desc' }
        });
    }

    async createWallet(userId: number) {
        return this.prisma.userWallet.create({
            data: {
                user_id: userId,
                balance_ghs: 0.00
            }
        });
    }
}
