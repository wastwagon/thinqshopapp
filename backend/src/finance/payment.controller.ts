import { Controller, Post, Body, UseGuards, Request, Headers, UnauthorizedException } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import { PaymentService } from './payment.service';
import { AuthGuard } from '../auth/auth.guard';
import { Public } from '../auth/public.decorator';

@Controller('payments')
export class PaymentController {
    constructor(private paymentService: PaymentService) { }

    @Post('init')
    @UseGuards(AuthGuard)
    async initPayment(@Request() req: any, @Body() body: { amount: number; serviceType: string; serviceId: number }) {
        return this.paymentService.initializePayment(
            req.user.sub,
            body.amount,
            body.serviceType,
            body.serviceId,
        );
    }

    @Public()
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
        // Basic Paystack webhook structure: data.reference, data.status
        const reference = body?.data?.reference;
        const status = body?.data?.status;
        if (!reference || !status) {
            throw new UnauthorizedException('Invalid webhook payload');
        }
        return this.paymentService.verifyWebhook(reference, status, body);
    }
}
