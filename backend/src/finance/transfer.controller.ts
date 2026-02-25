
import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request, ForbiddenException, BadRequestException, NotFoundException } from '@nestjs/common';
import { TransferService } from './transfer.service';
import { AuthGuard } from '../auth/auth.guard';
import { Public } from '../auth/public.decorator';

@Controller('finance/transfers')
@UseGuards(AuthGuard)
export class TransferController {
    constructor(private transferService: TransferService) { }

    @Public()
    @Get('rate')
    async getRate() {
        const rate = await this.transferService.getExchangeRate();
        return { rate_ghs_to_cny: rate };
    }

    @Public()
    @Get('track/:token')
    async trackByToken(@Param('token') token: string) {
        const transfer = await this.transferService.getTransferByToken(token);
        if (!transfer) throw new NotFoundException('Transfer not found');
        return transfer;
    }

    @Post()
    async createTransfer(@Request() req, @Body() body: any) {
        return this.transferService.createTransfer(req.user.sub, body);
    }

    @Get()
    async getHistory(@Request() req) {
        return this.transferService.getUserTransfers(req.user.sub);
    }

    @Get('admin/all')
    async getAllTransfers(@Request() req) {
        if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
            throw new ForbiddenException('Admin access required');
        }
        return this.transferService.getAllTransfers();
    }

    @Patch('admin/rate')
    async setExchangeRate(@Request() req, @Body() body: { rate_ghs_to_cny: number }) {
        if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
            throw new ForbiddenException('Admin access required');
        }
        if (body?.rate_ghs_to_cny == null || typeof body.rate_ghs_to_cny !== 'number') {
            throw new BadRequestException('rate_ghs_to_cny (number) is required');
        }
        return this.transferService.setExchangeRate(body.rate_ghs_to_cny);
    }

    @Get(':id')
    async getTransferById(@Request() req, @Param('id') id: string) {
        const transfer = await this.transferService.getTransferById(Number(id));
        const isAdmin = req.user.role === 'admin' || req.user.role === 'superadmin';
        if (!isAdmin && transfer.user_id !== req.user.sub) {
            throw new ForbiddenException('Access denied');
        }
        return transfer;
    }

    @Patch('admin/:id/status')
    async updateTransferStatus(@Request() req, @Param('id') id: string, @Body() body: any) {
        if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
            throw new ForbiddenException('Admin access required');
        }
        return this.transferService.updateTransferStatus(Number(id), body.status, body.admin_notes);
    }

    @Post(':id/confirm-payment')
    async confirmPayment(@Request() req, @Param('id') id: string, @Body() body: { paystack_reference: string }) {
        if (!body?.paystack_reference?.trim()) {
            throw new BadRequestException('paystack_reference is required');
        }
        return this.transferService.confirmTransferPayment(Number(id), req.user.sub, body.paystack_reference.trim());
    }

    @Post('admin/:id/reply-image')
    async addReplyImage(@Request() req, @Param('id') id: string, @Body() body: { imageUrl: string }) {
        if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
            throw new ForbiddenException('Admin access required');
        }
        if (!body?.imageUrl?.trim()) {
            throw new BadRequestException('imageUrl is required');
        }
        return this.transferService.addAdminReplyImage(Number(id), body.imageUrl.trim());
    }

    @Patch('admin/:id/fulfillment/:qrIndex')
    async updateQrFulfillment(
        @Request() req,
        @Param('id') id: string,
        @Param('qrIndex') qrIndex: string,
        @Body() body: { confirmation_image: string; admin_notes?: string }
    ) {
        if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
            throw new ForbiddenException('Admin access required');
        }
        const index = parseInt(qrIndex, 10);
        if (Number.isNaN(index) || index < 0) {
            throw new BadRequestException('Invalid qrIndex');
        }
        return this.transferService.updateQrFulfillment(Number(id), index, body);
    }
}
