import { Controller, Get, Post, Body, Query, UseGuards, Request, BadRequestException, Param, Patch, Delete, Inject, forwardRef } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { PaymentService } from './payment.service';
import { AuthGuard } from '../auth/auth.guard';
import { PermissionGuard } from '../auth/permission.guard';
import { RequirePermission } from '../auth/require-permission.decorator';
import { PERMISSION_MAP } from '../auth/permissions';
import { AuditService } from '../audit/audit.service';
import { ApproveWithdrawalDto, CreateWithdrawalDto, RejectWithdrawalDto } from './dto/wallet.dto';
import { ConsignmentService } from '../consignment/consignment.service';

@Controller('finance/wallet')
export class WalletController {
    constructor(
        private walletService: WalletService,
        private paymentService: PaymentService,
        private auditService: AuditService,
        @Inject(forwardRef(() => ConsignmentService)) private consignmentService: ConsignmentService,
    ) { }

    @Get()
    @UseGuards(AuthGuard)
    async getWallet(@Request() req) {
        await this.walletService.ensureWallet(req.user.sub);
        const [summary, escrow] = await Promise.all([
            this.walletService.getWalletSummary(req.user.sub),
            this.consignmentService.getPendingEscrowSummary(req.user.sub),
        ]);
        return {
            ...summary,
            pending_consignment_payout_ghs: escrow.pending_consignment_payout_ghs,
            pending_consignment_sales: escrow.items,
        };
    }

    @Get('transactions')
    @UseGuards(AuthGuard)
    async getTransactions(@Request() req) {
        const rows = await this.walletService.getLedger(req.user.sub);
        return rows.map((tx) => ({
            id: tx.id,
            type: tx.type,
            amount_ghs: Number(tx.amount_ghs),
            balance_after: Number(tx.balance_after),
            source: tx.source,
            description: tx.description,
            reference_id: tx.reference_id,
            status: tx.status,
            created_at: tx.created_at,
        }));
    }

    @Post('topup')
    @UseGuards(AuthGuard)
    async topUp(@Request() req, @Body() body: { amount: number }) {
        const amount = Number(body.amount);
        if (!Number.isFinite(amount) || amount <= 0) {
            throw new BadRequestException('Invalid amount');
        }
        const ref = `PAY-WLT-${Date.now()}-${req.user.sub}`;
        const payment = await this.paymentService.initializePayment(
            req.user.sub,
            amount,
            'wallet_topup',
            0,
            ref
        );
        return {
            status: 'pending',
            reference: payment.transaction_ref,
            amount,
            amount_pesewas: Math.round(amount * 100),
        };
    }

    @Post('confirm-topup')
    @UseGuards(AuthGuard)
    async confirmTopup(@Request() req, @Body() body: { reference: string }) {
        const reference = body?.reference?.trim();
        if (!reference) throw new BadRequestException('reference is required');
        const result = await this.paymentService.verifyWithPaystack(reference);
        if (!result) throw new BadRequestException('Payment verification failed');
        const { payment } = result;
        if (payment.service_type !== 'wallet_topup') {
            throw new BadRequestException('Invalid payment type');
        }
        if (payment.user_id !== req.user.sub) {
            throw new BadRequestException('Unauthorized');
        }
        if (!result.wasPending) {
            const summary = await this.walletService.getWalletSummary(req.user.sub);
            return { ...summary, credited: 0 };
        }
        const amount = Number(payment.amount);
        await this.walletService.credit(
            req.user.sub,
            amount,
            'wallet_topup',
            'Wallet top-up via Paystack',
            payment.id,
        );
        const summary = await this.walletService.getWalletSummary(req.user.sub);
        return { ...summary, credited: amount };
    }

    @Post('withdraw')
    @UseGuards(AuthGuard)
    async requestWithdraw(@Request() req, @Body() body: CreateWithdrawalDto) {
        const created = await this.walletService.requestWithdrawal(
            req.user.sub,
            body.amount,
            body.method,
            body.recipient_details,
        );
        return {
            id: created.id,
            status: created.status,
            amount_ghs: Number(created.amount_ghs),
            method: created.method,
        };
    }

    @Get('withdrawals')
    @UseGuards(AuthGuard)
    async listUserWithdrawals(@Request() req) {
        const rows = await this.walletService.listUserWithdrawals(req.user.sub);
        return rows.map((w) => ({
            ...w,
            amount_ghs: Number(w.amount_ghs),
            fee_ghs: Number(w.fee_ghs),
            net_amount_ghs: Number(w.net_amount_ghs),
        }));
    }

    @Delete('withdrawals/:id')
    @UseGuards(AuthGuard)
    async cancelWithdrawal(@Request() req, @Param('id') id: string) {
        return this.walletService.cancelWithdrawal(req.user.sub, Number(id));
    }

    @Get('admin/list')
    @UseGuards(AuthGuard, PermissionGuard)
    @RequirePermission(PERMISSION_MAP.WALLETS_MANAGE)
    async listAdmin(@Request() req: any, @Query() query: { page?: number; limit?: number; search?: string }) {
        return this.walletService.listAllForAdmin(query);
    }

    @Post('admin/adjust')
    @UseGuards(AuthGuard, PermissionGuard)
    @RequirePermission(PERMISSION_MAP.WALLETS_MANAGE)
    async adminAdjust(@Request() req: any, @Body() body: { user_id: number; amount: number; note?: string }) {
        const userId = Number(body.user_id);
        const amount = Number(body.amount);
        if (!userId || !Number.isFinite(userId)) {
            throw new BadRequestException('user_id is required');
        }
        const wallet = await this.walletService.adminAdjust(userId, amount, body.note);
        await this.auditService.logAdminAction(req, 'wallet.adjust', {
            tableName: 'user_wallet',
            details: { user_id: userId, amount, note: body.note },
        });
        return { balance_ghs: Number(wallet.balance_ghs) };
    }

    @Get('admin/withdrawals')
    @UseGuards(AuthGuard, PermissionGuard)
    @RequirePermission(PERMISSION_MAP.WALLETS_MANAGE)
    async listAdminWithdrawals(
        @Query() query: { status?: string; page?: number; limit?: number },
    ) {
        return this.walletService.listWithdrawalsForAdmin(query);
    }

    @Get('admin/withdrawals/pending-count')
    @UseGuards(AuthGuard, PermissionGuard)
    @RequirePermission(PERMISSION_MAP.WALLETS_MANAGE)
    async pendingWithdrawalCount() {
        const count = await this.walletService.countPendingWithdrawals();
        return { count };
    }

    @Patch('admin/withdrawals/:id/approve')
    @UseGuards(AuthGuard, PermissionGuard)
    @RequirePermission(PERMISSION_MAP.WALLETS_MANAGE)
    async approveWithdrawal(
        @Request() req: any,
        @Param('id') id: string,
        @Body() body: ApproveWithdrawalDto,
    ) {
        const updated = await this.walletService.approveWithdrawal(
            Number(id),
            req.user.sub,
            body.admin_note,
        );
        await this.auditService.logAdminAction(req, 'wallet.withdrawal.approve', {
            tableName: 'wallet_withdrawals',
            recordId: Number(id),
            details: { admin_note: body.admin_note },
        });
        return updated;
    }

    @Patch('admin/withdrawals/:id/reject')
    @UseGuards(AuthGuard, PermissionGuard)
    @RequirePermission(PERMISSION_MAP.WALLETS_MANAGE)
    async rejectWithdrawal(
        @Request() req: any,
        @Param('id') id: string,
        @Body() body: RejectWithdrawalDto,
    ) {
        const updated = await this.walletService.rejectWithdrawal(
            Number(id),
            req.user.sub,
            body.rejection_reason,
        );
        await this.auditService.logAdminAction(req, 'wallet.withdrawal.reject', {
            tableName: 'wallet_withdrawals',
            recordId: Number(id),
            details: { rejection_reason: body.rejection_reason },
        });
        return updated;
    }
}
