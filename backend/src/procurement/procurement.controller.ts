import {
    Controller,
    Post,
    Get,
    Patch,
    Body,
    Param,
    UseGuards,
    Request,
    ForbiddenException,
    BadRequestException,
    UseInterceptors,
    UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ProcurementService } from './procurement.service';
import { AuthGuard } from '../auth/auth.guard';
import { MediaService } from '../media/media.service';
import { PermissionGuard } from '../auth/permission.guard';
import { RequirePermission } from '../auth/require-permission.decorator';
import { PERMISSION_MAP } from '../auth/permissions';
import { AuditService } from '../audit/audit.service';
import {
    AcceptQuoteDto,
    CreateProcurementQuoteDto,
    CreateProcurementRequestDto,
    UpdateProcurementRequestStatusDto,
} from './dto/procurement.dto';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

@Controller('procurement')
@UseGuards(AuthGuard)
export class ProcurementController {
    constructor(
        private procurementService: ProcurementService,
        private mediaService: MediaService,
        private auditService: AuditService,
    ) {}

    @Post('upload-image')
    @UseInterceptors(
        FileInterceptor('file', {
            storage: memoryStorage(),
            limits: { fileSize: MAX_FILE_SIZE },
            fileFilter: (_req, file, cb) => {
                if (!file.mimetype || ALLOWED_MIMES.includes(file.mimetype)) {
                    cb(null, true);
                } else {
                    cb(new Error('Invalid file type. Allowed: JPEG, PNG, GIF, WebP, SVG'), false);
                }
            },
        }),
    )
    async uploadImage(@Request() req: any, @UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }
        const result = await this.mediaService.createFromFile(file);
        return { url: result.url, path: result.path };
    }

    @Post('request')
    async createRequest(@Request() req, @Body() body: CreateProcurementRequestDto) {
        return this.procurementService.createRequest(req.user.sub, body);
    }

    @Get('user')
    async findUserRequests(@Request() req) {
        return this.procurementService.findUserRequests(req.user.sub);
    }

    @Get('user/request/:id')
    async findUserRequestById(@Request() req, @Param('id') id: string) {
        return this.procurementService.findUserRequestById(req.user.sub, Number(id));
    }

    @Get(':requestNumber')
    async findRequest(@Param('requestNumber') requestNumber: string) {
        return this.procurementService.findRequest(requestNumber);
    }

    @Post('accept-quote')
    async acceptQuote(@Request() req, @Body() body: AcceptQuoteDto) {
        return this.procurementService.createOrderFromQuote(req.user.sub, body.quoteId);
    }

    @Get('admin/requests')
    @UseGuards(AuthGuard, PermissionGuard)
    @RequirePermission(PERMISSION_MAP.PROCUREMENT_READ_ALL)
    async getAllRequests(@Request() req) {
        return this.procurementService.getAllRequests();
    }

    @Get('admin/:id')
    @UseGuards(AuthGuard, PermissionGuard)
    @RequirePermission(PERMISSION_MAP.PROCUREMENT_READ_ALL)
    async getRequestForAdmin(@Request() req, @Param('id') id: string) {
        return this.procurementService.getRequestForAdmin(Number(id));
    }

    @Patch('admin/:id/status')
    @UseGuards(AuthGuard, PermissionGuard)
    @RequirePermission(PERMISSION_MAP.PROCUREMENT_MANAGE)
    async updateRequestStatus(@Request() req, @Param('id') id: string, @Body() body: UpdateProcurementRequestStatusDto) {
        const updated = await this.procurementService.updateRequestStatus(Number(id), body.status as any);
        await this.auditService.logAdminAction(req, 'procurement_request.status.update', {
            tableName: 'procurement_requests',
            recordId: Number(id),
            details: { status: body.status },
        });
        return updated;
    }

    @Post('admin/:id/quote')
    @UseGuards(AuthGuard, PermissionGuard)
    @RequirePermission(PERMISSION_MAP.PROCUREMENT_MANAGE)
    async createQuote(@Request() req, @Param('id') id: string, @Body() body: CreateProcurementQuoteDto) {
        const created = await this.procurementService.createQuote(Number(id), body);
        await this.auditService.logAdminAction(req, 'procurement_quote.create', {
            tableName: 'procurement_quotes',
            recordId: created.id,
            details: { request_id: Number(id) },
        });
        return created;
    }
}
