import { Controller, Get, Post, Body, Query, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { PaymentService } from './payment.service';
import { AuthGuard } from '../auth/auth.guard';
import { RequirePermission } from '../auth/require-permission.decorator';
import { PERMISSION_MAP } from '../auth/permissions';
import { AuditService } from '../audit/audit.service';

@Controller('finance/wallet')
export class WalletController {
    constructor(
        private walletService: WalletService,
        private paymentService: PaymentService,
        private auditService: AuditService,
    ) { }

    @Get()
    @UseGuards(AuthGuard)
    async getWallet(@Request() req) {
        let wallet = await this.walletService.getBalance(req.user.sub);
        if (!wallet) {
            wallet = await this.walletService.createWallet(req.user.sub);
        }
        return wallet;
    }

    @Get('transactions')
    @UseGuards(AuthGuard)
    async getTransactions(@Request() req) {
        return this.walletService.getTransactions(req.user.sub);
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
            amount_pesewas: Math.round(amount * 100), // GHS to pesewas for Paystack
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
            const wallet = await this.walletService.getBalance(req.user.sub);
            return { balance_ghs: Number(wallet?.balance_ghs ?? 0), credited: 0 };
        }
        const amount = Number(payment.amount);
        await this.walletService.topUp(req.user.sub, amount);
        const wallet = await this.walletService.getBalance(req.user.sub);
        return { balance_ghs: Number(wallet?.balance_ghs ?? 0), credited: amount };
    }

    @Get('admin/list')
    @UseGuards(AuthGuard)
    @RequirePermission(PERMISSION_MAP.WALLETS_MANAGE)
    async listAdmin(@Request() req: any, @Query() query: { page?: number; limit?: number; search?: string }) {
        return this.walletService.listAllForAdmin(query);
    }

    @Post('admin/adjust')
    @UseGuards(AuthGuard)
    @RequirePermission(PERMISSION_MAP.WALLETS_MANAGE)
    async adminAdjust(@Request() req: any, @Body() body: { user_id: number; amount: number }) {
        const userId = Number(body.user_id);
        const amount = Number(body.amount);
        if (!userId || !Number.isFinite(userId)) {
            throw new BadRequestException('user_id is required');
        }
        const wallet = await this.walletService.adminAdjust(userId, amount);
        await this.auditService.logAdminAction(req, 'wallet.adjust', {
            tableName: 'user_wallet',
            details: { user_id: userId, amount },
        });
        return { balance_ghs: Number(wallet.balance_ghs) };
    }
}
