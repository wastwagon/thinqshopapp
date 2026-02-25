import { Controller, Get, Post, Body, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { PaymentService } from './payment.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('finance/wallet')
@UseGuards(AuthGuard)
export class WalletController {
    constructor(
        private walletService: WalletService,
        private paymentService: PaymentService
    ) { }

    @Get()
    async getWallet(@Request() req) {
        let wallet = await this.walletService.getBalance(req.user.sub);
        if (!wallet) {
            wallet = await this.walletService.createWallet(req.user.sub);
        }
        return wallet;
    }

    @Get('transactions')
    async getTransactions(@Request() req) {
        return this.walletService.getTransactions(req.user.sub);
    }

    @Post('topup')
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
}
