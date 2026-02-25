import { Injectable } from '@nestjs/common';
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
        return this.prisma.userWallet.update({
            where: { user_id: userId },
            data: {
                balance_ghs: { increment: amount },
            },
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
