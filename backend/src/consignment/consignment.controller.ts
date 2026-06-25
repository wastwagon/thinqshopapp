import {
    Controller,
    Post,
    Get,
    Patch,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
    BadRequestException,
    UseInterceptors,
    UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ConsignmentService } from './consignment.service';
import { AuthGuard } from '../auth/auth.guard';
import { MediaService } from '../media/media.service';
import { PermissionGuard } from '../auth/permission.guard';
import { RequirePermission } from '../auth/require-permission.decorator';
import { PERMISSION_MAP } from '../auth/permissions';
import { AuditService } from '../audit/audit.service';
import {
    ApproveConsignmentDto,
    CreateConsignmentSubmissionDto,
    RejectConsignmentDto,
    RequestChangesConsignmentDto,
    UpdateConsignmentSettingsDto,
    UpdateConsignmentSubmissionDto,
} from './dto/consignment.dto';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

@Controller('consignment')
export class ConsignmentController {
    constructor(
        private consignmentService: ConsignmentService,
        private mediaService: MediaService,
        private auditService: AuditService,
    ) { }

    @Get('settings')
    async publicSettings() {
        return this.consignmentService.getPublicSettings();
    }

    @Post('upload-image')
    @UseGuards(AuthGuard)
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
    async uploadImage(@UploadedFile() file: Express.Multer.File) {
        if (!file) throw new BadRequestException('No file uploaded');
        const result = await this.mediaService.createFromFile(file);
        return { url: result.url, path: result.path };
    }

    @Post('submissions')
    @UseGuards(AuthGuard)
    async createSubmission(@Request() req: any, @Body() body: CreateConsignmentSubmissionDto) {
        return this.consignmentService.createSubmission(req.user.sub, body);
    }

    @Get('submissions')
    @UseGuards(AuthGuard)
    async listUserSubmissions(@Request() req: any) {
        return this.consignmentService.findUserSubmissions(req.user.sub);
    }

    @Get('submissions/:id')
    @UseGuards(AuthGuard)
    async getUserSubmission(@Request() req: any, @Param('id') id: string) {
        return this.consignmentService.findUserSubmission(req.user.sub, Number(id));
    }

    @Patch('submissions/:id')
    @UseGuards(AuthGuard)
    async updateUserSubmission(
        @Request() req: any,
        @Param('id') id: string,
        @Body() body: UpdateConsignmentSubmissionDto,
    ) {
        return this.consignmentService.updateUserSubmission(req.user.sub, Number(id), body);
    }

    @Get('admin/list')
    @UseGuards(AuthGuard, PermissionGuard)
    @RequirePermission(PERMISSION_MAP.CONSIGNMENT_READ_ALL)
    async adminList(@Query('status') status?: string) {
        return this.consignmentService.findAllForAdmin(status);
    }

    @Get('admin/pending-count')
    @UseGuards(AuthGuard, PermissionGuard)
    @RequirePermission(PERMISSION_MAP.CONSIGNMENT_READ_ALL)
    async pendingCount() {
        const count = await this.consignmentService.countPendingForAdmin();
        return { count };
    }

    @Get('admin/settings')
    @UseGuards(AuthGuard, PermissionGuard)
    @RequirePermission(PERMISSION_MAP.CONSIGNMENT_MANAGE)
    async adminSettings() {
        return this.consignmentService.getAdminSettings();
    }

    @Patch('admin/settings')
    @UseGuards(AuthGuard, PermissionGuard)
    @RequirePermission(PERMISSION_MAP.CONSIGNMENT_MANAGE)
    async updateAdminSettings(@Request() req: any, @Body() body: UpdateConsignmentSettingsDto) {
        const updated = await this.consignmentService.updateAdminSettings(body);
        await this.auditService.logAdminAction(req, 'consignment.settings.update', {
            tableName: 'settings',
            details: body as Record<string, unknown>,
        });
        return updated;
    }

    @Get('admin/:id')
    @UseGuards(AuthGuard, PermissionGuard)
    @RequirePermission(PERMISSION_MAP.CONSIGNMENT_READ_ALL)
    async adminDetail(@Param('id') id: string) {
        return this.consignmentService.findOneForAdmin(Number(id));
    }

    @Patch('admin/:id/review')
    @UseGuards(AuthGuard, PermissionGuard)
    @RequirePermission(PERMISSION_MAP.CONSIGNMENT_MANAGE)
    async markReview(@Request() req: any, @Param('id') id: string) {
        const updated = await this.consignmentService.markUnderReview(Number(id), req.user.sub);
        await this.auditService.logAdminAction(req, 'consignment.review', {
            tableName: 'consignment_submissions',
            recordId: Number(id),
        });
        return updated;
    }

    @Patch('admin/:id/approve')
    @UseGuards(AuthGuard, PermissionGuard)
    @RequirePermission(PERMISSION_MAP.CONSIGNMENT_MANAGE)
    async approve(@Request() req: any, @Param('id') id: string, @Body() body: ApproveConsignmentDto) {
        const result = await this.consignmentService.approveSubmission(Number(id), req.user.sub, body);
        await this.auditService.logAdminAction(req, 'consignment.approve', {
            tableName: 'consignment_submissions',
            recordId: Number(id),
            details: { product_id: result.product.id },
        });
        return result;
    }

    @Patch('admin/:id/reject')
    @UseGuards(AuthGuard, PermissionGuard)
    @RequirePermission(PERMISSION_MAP.CONSIGNMENT_MANAGE)
    async reject(@Request() req: any, @Param('id') id: string, @Body() body: RejectConsignmentDto) {
        const updated = await this.consignmentService.rejectSubmission(
            Number(id),
            req.user.sub,
            body.rejection_reason,
        );
        await this.auditService.logAdminAction(req, 'consignment.reject', {
            tableName: 'consignment_submissions',
            recordId: Number(id),
        });
        return updated;
    }

    @Patch('admin/:id/request-changes')
    @UseGuards(AuthGuard, PermissionGuard)
    @RequirePermission(PERMISSION_MAP.CONSIGNMENT_MANAGE)
    async requestChanges(@Request() req: any, @Param('id') id: string, @Body() body: RequestChangesConsignmentDto) {
        const updated = await this.consignmentService.requestChanges(
            Number(id),
            req.user.sub,
            body.admin_notes,
        );
        await this.auditService.logAdminAction(req, 'consignment.request_changes', {
            tableName: 'consignment_submissions',
            recordId: Number(id),
        });
        return updated;
    }

    @Patch('admin/:id/delist')
    @UseGuards(AuthGuard, PermissionGuard)
    @RequirePermission(PERMISSION_MAP.CONSIGNMENT_MANAGE)
    async delist(@Request() req: any, @Param('id') id: string, @Body() body: { reason?: string }) {
        const updated = await this.consignmentService.delistSubmission(Number(id), req.user.sub, body?.reason);
        await this.auditService.logAdminAction(req, 'consignment.delist', {
            tableName: 'consignment_submissions',
            recordId: Number(id),
        });
        return updated;
    }
}
