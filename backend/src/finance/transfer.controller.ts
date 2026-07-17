
import {
    Controller,
    Get,
    Post,
    Patch,
    Body,
    Param,
    UseGuards,
    Request,
    ForbiddenException,
    BadRequestException,
    NotFoundException,
    UseInterceptors,
    UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { TransferService } from './transfer.service';
import { MediaService } from '../media/media.service';
import { AuthGuard } from '../auth/auth.guard';
import { Public } from '../auth/public.decorator';
import { PermissionGuard } from '../auth/permission.guard';
import { RequirePermission } from '../auth/require-permission.decorator';
import { PERMISSION_MAP } from '../auth/permissions';
import { AuditService } from '../audit/audit.service';
import {
    AddTransferReplyImageDto,
    ConfirmTransferPaymentDto,
    CreateTransferDto,
    UpdateTransferFulfillmentDto,
    UpdateTransferPaymentDetailsDto,
    UpdateTransferStatusDto,
} from './dto/transfer.dto';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

@Controller('finance/transfers')
@UseGuards(AuthGuard)
export class TransferController {
    constructor(
        private transferService: TransferService,
        private mediaService: MediaService,
        private auditService: AuditService,
    ) { }

    @Public()
    @Get('rate')
    async getRate() {
        const rate = await this.transferService.getExchangeRate();
        return { rate_ghs_to_cny: rate };
    }

    @Get('payment-details')
    async getPaymentDetails() {
        return this.transferService.getPaymentDetails();
    }

    @Public()
    @Get('track/:token')
    async trackByToken(@Param('token') token: string) {
        const transfer = await this.transferService.getTransferByToken(token);
        if (!transfer) throw new NotFoundException('Transfer not found');
        return transfer;
    }

    @Post('upload-payment-proof')
    @UseInterceptors(
        FileInterceptor('file', {
            storage: memoryStorage(),
            limits: { fileSize: MAX_FILE_SIZE },
            fileFilter: (_req, file, cb) => {
                if (!file.mimetype || ALLOWED_MIMES.includes(file.mimetype)) {
                    cb(null, true);
                } else {
                    cb(new Error('Invalid file type. Allowed: JPEG, PNG, GIF, WebP'), false);
                }
            },
        }),
    )
    async uploadPaymentProof(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }
        const result = await this.mediaService.createFromFile(file);
        return { url: result.url, path: result.path };
    }

    @Post()
    async createTransfer(@Request() req, @Body() body: CreateTransferDto) {
        return this.transferService.createTransfer(req.user.sub, body);
    }

    @Get()
    async getHistory(@Request() req) {
        return this.transferService.getUserTransfers(req.user.sub);
    }

    @Get('admin/all')
    @UseGuards(AuthGuard, PermissionGuard)
    @RequirePermission(PERMISSION_MAP.TRANSFERS_READ_ALL)
    async getAllTransfers(@Request() req) {
        return this.transferService.getAllTransfers();
    }

    @Get('admin/payment-details')
    @UseGuards(AuthGuard, PermissionGuard)
    @RequirePermission(PERMISSION_MAP.TRANSFERS_MANAGE)
    async getPaymentDetailsAdmin() {
        return this.transferService.getPaymentDetails();
    }

    @Patch('admin/payment-details')
    @UseGuards(AuthGuard, PermissionGuard)
    @RequirePermission(PERMISSION_MAP.TRANSFERS_MANAGE)
    async updatePaymentDetails(@Request() req, @Body() body: UpdateTransferPaymentDetailsDto) {
        const updated = await this.transferService.updatePaymentDetails(body);
        await this.auditService.logAdminAction(req, 'transfer.payment_details.update', {
            tableName: 'settings',
            details: body as Record<string, unknown>,
        });
        return updated;
    }

    @Patch('admin/rate')
    @UseGuards(AuthGuard, PermissionGuard)
    @RequirePermission(PERMISSION_MAP.TRANSFERS_RATE_MANAGE)
    async setExchangeRate(@Request() req, @Body() body: { rate_ghs_to_cny: number }) {
        if (body?.rate_ghs_to_cny == null || typeof body.rate_ghs_to_cny !== 'number') {
            throw new BadRequestException('rate_ghs_to_cny (number) is required');
        }
        const updated = await this.transferService.setExchangeRate(body.rate_ghs_to_cny);
        await this.auditService.logAdminAction(req, 'transfer.exchange_rate.update', {
            tableName: 'exchange_rates',
            details: { rate_ghs_to_cny: body.rate_ghs_to_cny },
        });
        return updated;
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
    @UseGuards(AuthGuard, PermissionGuard)
    @RequirePermission(PERMISSION_MAP.TRANSFERS_MANAGE)
    async updateTransferStatus(@Request() req, @Param('id') id: string, @Body() body: UpdateTransferStatusDto) {
        const updated = await this.transferService.updateTransferStatus(Number(id), body.status, body.admin_notes);
        await this.auditService.logAdminAction(req, 'transfer.status.update', {
            tableName: 'money_transfers',
            recordId: Number(id),
            details: { status: body.status },
        });
        return updated;
    }

    @Post(':id/confirm-payment')
    async confirmPayment(@Request() req, @Param('id') id: string, @Body() body: ConfirmTransferPaymentDto) {
        if (!body?.paystack_reference?.trim()) {
            throw new BadRequestException('paystack_reference is required');
        }
        return this.transferService.confirmTransferPayment(Number(id), req.user.sub, body.paystack_reference.trim());
    }

    @Post('admin/:id/reply-image')
    @UseGuards(AuthGuard, PermissionGuard)
    @RequirePermission(PERMISSION_MAP.TRANSFERS_MANAGE)
    async addReplyImage(@Request() req, @Param('id') id: string, @Body() body: AddTransferReplyImageDto) {
        if (!body?.imageUrl?.trim()) {
            throw new BadRequestException('imageUrl is required');
        }
        const updated = await this.transferService.addAdminReplyImage(Number(id), body.imageUrl.trim());
        await this.auditService.logAdminAction(req, 'transfer.reply_image.add', {
            tableName: 'money_transfers',
            recordId: Number(id),
        });
        return updated;
    }

    @Patch('admin/:id/fulfillment/:qrIndex')
    @UseGuards(AuthGuard, PermissionGuard)
    @RequirePermission(PERMISSION_MAP.TRANSFERS_MANAGE)
    async updateQrFulfillment(
        @Request() req,
        @Param('id') id: string,
        @Param('qrIndex') qrIndex: string,
        @Body() body: UpdateTransferFulfillmentDto
    ) {
        const index = parseInt(qrIndex, 10);
        if (Number.isNaN(index) || index < 0) {
            throw new BadRequestException('Invalid qrIndex');
        }
        const updated = await this.transferService.updateQrFulfillment(Number(id), index, body);
        await this.auditService.logAdminAction(req, 'transfer.fulfillment.update', {
            tableName: 'money_transfers',
            recordId: Number(id),
            details: { qrIndex: index },
        });
        return updated;
    }
}
