import { Controller, Post, Body, UseGuards, Request, Headers, UnauthorizedException, Inject, forwardRef, BadRequestException } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { createHmac, timingSafeEqual } from 'crypto';
import { PaymentService } from './payment.service';
import { WalletService } from './wallet.service';
import { AuthGuard } from '../auth/auth.guard';
import { Public } from '../auth/public.decorator';
import { OrderService } from '../order/order.service';

@Controller('payments')
export class PaymentController {
    constructor(
        private paymentService: PaymentService,
        private walletService: WalletService,
        @Inject(forwardRef(() => OrderService)) private orderService: OrderService,
    ) { }

    @Post('init')
    @UseGuards(AuthGuard)
    async initPayment() {
        throw new BadRequestException('Start payment from checkout or wallet top-up.');
    }

    @Public()
    @SkipThrottle()
    @Post('webhook')
    async handleWebhook(
        @Request() req: any,
        @Body() body: any,
        @Headers('x-paystack-signature') signature?: string,
    ) {
        const secret = process.env.PAYSTACK_SECRET_KEY;
        if (!secret || secret === 'your_paystack_secret') {
            throw new UnauthorizedException('Webhook secret not configured');
        }
        if (!signature) {
            throw new UnauthorizedException('Missing webhook signature');
        }
        const payload = req.rawBody || JSON.stringify(body ?? {});
        const digest = createHmac('sha512', secret).update(payload).digest('hex');
        const sigBuf = Buffer.from(signature);
        const digestBuf = Buffer.from(digest);
        if (sigBuf.length !== digestBuf.length || !timingSafeEqual(sigBuf, digestBuf)) {
            throw new UnauthorizedException('Invalid webhook signature');
        }
        const reference = body?.data?.reference;
        if (!reference) {
            throw new UnauthorizedException('Invalid webhook payload');
        }
        const result = await this.paymentService.verifyWithPaystack(reference);
        if (!result) return { received: true };
        if (result.wasPending && result.payment.service_type === 'ecommerce') {
            await this.orderService.completeEcommercePaymentFromWebhook(result.payment);
        }
        if (result.wasPending && result.payment.service_type === 'wallet_topup') {
            await this.walletService.credit(
                result.payment.user_id,
                Number(result.payment.amount),
                'wallet_topup',
                'Wallet top-up via Paystack',
                result.payment.id,
            );
        }
        return result.payment;
    }
}
