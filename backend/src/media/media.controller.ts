import {
    Controller,
    Get,
    Post,
    Delete,
    Param,
    Query,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    ParseIntPipe,
    Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '../auth/auth.guard';
import { MediaService } from './media.service';
import { memoryStorage } from 'multer';
import { RequirePermission } from '../auth/require-permission.decorator';
import { PERMISSION_MAP } from '../auth/permissions';
import { AuditService } from '../audit/audit.service';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

@Controller('media')
export class MediaController {
    constructor(
        private readonly mediaService: MediaService,
        private readonly auditService: AuditService,
    ) {}

    @Post('upload')
    @UseGuards(AuthGuard)
    @RequirePermission(PERMISSION_MAP.MEDIA_MANAGE)
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
    async upload(@Request() req: any, @UploadedFile() file: Express.Multer.File) {
        if (!file) {
            return { error: 'No file uploaded' };
        }
        const created = await this.mediaService.createFromFile(file);
        await this.auditService.logAdminAction(req, 'media.upload', {
            tableName: 'media',
            recordId: created.id,
        });
        return created;
    }

    @Get()
    @UseGuards(AuthGuard)
    @RequirePermission(PERMISSION_MAP.MEDIA_MANAGE)
    async list(
        @Request() req: any,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('search') search?: string,
    ) {
        return this.mediaService.findAll({
            page: page ? parseInt(page, 10) : undefined,
            limit: limit ? parseInt(limit, 10) : undefined,
            search,
        });
    }

    @Get(':id')
    @UseGuards(AuthGuard)
    @RequirePermission(PERMISSION_MAP.MEDIA_MANAGE)
    async getOne(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
        return this.mediaService.findOne(id);
    }

    @Delete(':id')
    @UseGuards(AuthGuard)
    @RequirePermission(PERMISSION_MAP.MEDIA_MANAGE)
    async remove(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
        await this.mediaService.remove(id);
        await this.auditService.logAdminAction(req, 'media.delete', {
            tableName: 'media',
            recordId: id,
        });
    }
}
