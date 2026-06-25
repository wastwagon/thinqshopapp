import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Prisma, WalletTransactionSource, WalletWithdrawalMethod } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const MIN_WITHDRAWAL_GHS = 50;

type TxClient = Prisma.TransactionClient;

@Injectable()
export class WalletService {
    constructor(private prisma: PrismaService) { }

    async ensureWallet(userId: number, tx?: TxClient) {
        const db = tx ?? this.prisma;
        let wallet = await db.userWallet.findUnique({ where: { user_id: userId } });
        if (!wallet) {
            wallet = await db.userWallet.create({
                data: { user_id: userId, balance_ghs: 0 },
            });
        }
        return wallet;
    }

    async getBalance(userId: number) {
        return this.prisma.userWallet.findUnique({ where: { user_id: userId } });
    }

    async getPendingWithdrawalTotal(userId: number, tx?: TxClient) {
        const db = tx ?? this.prisma;
        const agg = await db.walletWithdrawal.aggregate({
            where: { user_id: userId, status: 'pending' },
            _sum: { amount_ghs: true },
        });
        return Number(agg._sum.amount_ghs ?? 0);
    }

    async getAvailableBalance(userId: number) {
        const wallet = await this.ensureWallet(userId);
        const pending = await this.getPendingWithdrawalTotal(userId);
        const balance = Number(wallet.balance_ghs);
        return Math.max(0, balance - pending);
    }

    async getWalletSummary(userId: number) {
        const wallet = await this.ensureWallet(userId);
        const pending = await this.getPendingWithdrawalTotal(userId);
        const balance = Number(wallet.balance_ghs);
        return {
            balance_ghs: balance,
            pending_withdrawal_ghs: pending,
            /** Withdrawable now — excludes in-escrow consignment sales and pending withdrawal requests */
            available_balance_ghs: Math.max(0, balance - pending),
        };
    }

    private async recordTransaction(
        userId: number,
        type: 'credit' | 'debit',
        amount: number,
        balanceAfter: number,
        source: WalletTransactionSource,
        description?: string,
        referenceId?: number,
        tx?: TxClient,
    ) {
        const db = tx ?? this.prisma;
        return db.walletTransaction.create({
            data: {
                user_id: userId,
                type,
                amount_ghs: amount,
                balance_after: balanceAfter,
                source,
                description: description ?? null,
                reference_id: referenceId ?? null,
                status: 'success',
            },
        });
    }

    async credit(
        userId: number,
        amount: number,
        source: WalletTransactionSource,
        description?: string,
        referenceId?: number,
        tx?: TxClient,
    ) {
        const amt = Number(amount);
        if (!Number.isFinite(amt) || amt <= 0) {
            throw new BadRequestException('Credit amount must be positive');
        }
        const run = async (client: TxClient) => {
            const wallet = await this.ensureWallet(userId, client);
            const updated = await client.userWallet.update({
                where: { user_id: userId },
                data: { balance_ghs: { increment: amt } },
            });
            await this.recordTransaction(
                userId,
                'credit',
                amt,
                Number(updated.balance_ghs),
                source,
                description,
                referenceId,
                client,
            );
            return updated;
        };
        return tx ? run(tx) : this.prisma.$transaction(run);
    }

    async debit(
        userId: number,
        amount: number,
        source: WalletTransactionSource,
        description?: string,
        referenceId?: number,
        tx?: TxClient,
    ) {
        const amt = Number(amount);
        if (!Number.isFinite(amt) || amt <= 0) {
            throw new BadRequestException('Debit amount must be positive');
        }
        const run = async (client: TxClient) => {
            const wallet = await this.ensureWallet(userId, client);
            const available = Number(wallet.balance_ghs) - await this.getPendingWithdrawalTotal(userId, client);
            if (available < amt) {
                throw new BadRequestException(
                    `Insufficient available balance. Available: ₵${Math.max(0, available).toFixed(2)}`,
                );
            }
            const current = Number(wallet.balance_ghs);
            if (current < amt) {
                throw new BadRequestException(`Insufficient wallet balance. Current: ₵${current.toFixed(2)}`);
            }
            const updated = await client.userWallet.update({
                where: { user_id: userId },
                data: { balance_ghs: { decrement: amt } },
            });
            await this.recordTransaction(
                userId,
                'debit',
                amt,
                Number(updated.balance_ghs),
                source,
                description,
                referenceId,
                client,
            );
            return updated;
        };
        return tx ? run(tx) : this.prisma.$transaction(run);
    }

    /** @deprecated Use credit/debit for ledger-aware changes */
    async topUp(userId: number, amount: number) {
        const amt = Number(amount);
        if (amt > 0) {
            return this.credit(userId, amt, 'other', 'Balance adjustment');
        }
        if (amt < 0) {
            return this.debit(userId, Math.abs(amt), 'other', 'Balance adjustment');
        }
        return this.ensureWallet(userId);
    }

    async getLedger(userId: number, limit = 50) {
        return this.prisma.walletTransaction.findMany({
            where: { user_id: userId },
            orderBy: { created_at: 'desc' },
            take: limit,
        });
    }

    async getTransactions(userId: number) {
        return this.getLedger(userId);
    }

    async listAllForAdmin(query: { page?: number; limit?: number; search?: string }) {
        const { page = 1, limit = 50, search } = query;
        const skip = (Number(page) - 1) * Number(limit);
        const where: Prisma.UserWalletWhereInput = {};
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

    async adminAdjust(userId: number, amount: number, adminNote?: string) {
        const amt = Number(amount);
        if (!Number.isFinite(amt) || amt === 0) {
            throw new BadRequestException('Amount must be non-zero');
        }
        const desc = adminNote?.trim() || 'Admin wallet adjustment';
        if (amt > 0) {
            const wallet = await this.credit(userId, amt, 'admin_adjust', desc);
            return wallet;
        }
        const wallet = await this.debit(userId, Math.abs(amt), 'admin_adjust', desc);
        return wallet;
    }

    async createWallet(userId: number) {
        return this.ensureWallet(userId);
    }

    // --- Withdrawals ---

    async requestWithdrawal(
        userId: number,
        amount: number,
        method: WalletWithdrawalMethod,
        recipientDetails: Record<string, unknown>,
    ) {
        const amt = Number(amount);
        if (!Number.isFinite(amt) || amt < MIN_WITHDRAWAL_GHS) {
            throw new BadRequestException(`Minimum withdrawal is ₵${MIN_WITHDRAWAL_GHS}`);
        }
        const accountName = String(recipientDetails.account_name ?? '').trim();
        if (!accountName) {
            throw new BadRequestException('recipient_details.account_name is required');
        }
        if (method === 'mobile_money') {
            const phone = String(recipientDetails.phone ?? '').trim();
            if (!phone) throw new BadRequestException('recipient_details.phone is required for mobile money');
        }
        if (method === 'bank_transfer') {
            const bank = String(recipientDetails.bank_name ?? '').trim();
            const acct = String(recipientDetails.account_number ?? '').trim();
            if (!bank || !acct) {
                throw new BadRequestException('bank_name and account_number are required for bank transfer');
            }
        }

        const fee = 0;
        const net = amt - fee;
        return this.prisma.$transaction(async (tx) => {
            const wallet = await this.ensureWallet(userId, tx);
            const pending = await this.getPendingWithdrawalTotal(userId, tx);
            const available = Math.max(0, Number(wallet.balance_ghs) - pending);
            if (amt > available) {
                throw new BadRequestException(
                    `Insufficient available balance. Available: ₵${available.toFixed(2)}`,
                );
            }
            return tx.walletWithdrawal.create({
                data: {
                    user_id: userId,
                    amount_ghs: amt,
                    fee_ghs: fee,
                    net_amount_ghs: net,
                    method,
                    recipient_details: recipientDetails as Prisma.InputJsonValue,
                    status: 'pending',
                },
            });
        });
    }

    async listUserWithdrawals(userId: number) {
        return this.prisma.walletWithdrawal.findMany({
            where: { user_id: userId },
            orderBy: { created_at: 'desc' },
        });
    }

    async cancelWithdrawal(userId: number, withdrawalId: number) {
        const row = await this.prisma.walletWithdrawal.findUnique({ where: { id: withdrawalId } });
        if (!row) throw new NotFoundException('Withdrawal not found');
        if (row.user_id !== userId) throw new ForbiddenException('Not your withdrawal');
        if (row.status !== 'pending') {
            throw new BadRequestException('Only pending withdrawals can be cancelled');
        }
        return this.prisma.walletWithdrawal.update({
            where: { id: withdrawalId },
            data: { status: 'cancelled' },
        });
    }

    async listWithdrawalsForAdmin(query: { status?: string; page?: number; limit?: number }) {
        const { status, page = 1, limit = 50 } = query;
        const skip = (Number(page) - 1) * Number(limit);
        const where: Prisma.WalletWithdrawalWhereInput = {};
        if (status?.trim()) {
            where.status = status.trim() as any;
        }
        const [data, total] = await Promise.all([
            this.prisma.walletWithdrawal.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            phone: true,
                            profile: { select: { first_name: true, last_name: true } },
                        },
                    },
                },
                skip,
                take: Number(limit),
                orderBy: { created_at: 'desc' },
            }),
            this.prisma.walletWithdrawal.count({ where }),
        ]);
        return {
            data: data.map((w) => ({
                ...w,
                amount_ghs: Number(w.amount_ghs),
                fee_ghs: Number(w.fee_ghs),
                net_amount_ghs: Number(w.net_amount_ghs),
            })),
            meta: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) },
        };
    }

    async approveWithdrawal(withdrawalId: number, adminId: number, adminNote?: string) {
        return this.prisma.$transaction(async (tx) => {
            const row = await tx.walletWithdrawal.findUnique({ where: { id: withdrawalId } });
            if (!row) throw new NotFoundException('Withdrawal not found');
            if (row.status !== 'pending') {
                throw new BadRequestException('Withdrawal is not pending');
            }
            const amount = Number(row.amount_ghs);
            await this.debit(
                row.user_id,
                amount,
                'withdrawal',
                `Withdrawal payout (${row.method.replace(/_/g, ' ')})`,
                row.id,
                tx,
            );
            return tx.walletWithdrawal.update({
                where: { id: withdrawalId },
                data: {
                    status: 'paid',
                    admin_id: adminId,
                    admin_note: adminNote?.trim() || null,
                    paid_at: new Date(),
                },
            });
        });
    }

    async rejectWithdrawal(withdrawalId: number, adminId: number, rejectionReason: string) {
        const reason = rejectionReason?.trim();
        if (!reason) throw new BadRequestException('rejection_reason is required');
        const row = await this.prisma.walletWithdrawal.findUnique({ where: { id: withdrawalId } });
        if (!row) throw new NotFoundException('Withdrawal not found');
        if (row.status !== 'pending') {
            throw new BadRequestException('Withdrawal is not pending');
        }
        return this.prisma.walletWithdrawal.update({
            where: { id: withdrawalId },
            data: {
                status: 'rejected',
                admin_id: adminId,
                rejection_reason: reason,
            },
        });
    }

    async countPendingWithdrawals() {
        return this.prisma.walletWithdrawal.count({ where: { status: 'pending' } });
    }
}
