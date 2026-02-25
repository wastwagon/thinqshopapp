import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { AuthGuard } from '../auth/auth.guard';

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

    @Post('webhook')
    async handleWebhook(@Body() body: any) {
        // Basic Paystack webhook structure: data.reference, data.status
        const { reference, status } = body.data;
        return this.paymentService.verifyWebhook(reference, status, body);
    }
}
