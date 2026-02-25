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
    ForbiddenException,
    Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '../auth/auth.guard';
import { MediaService } from './media.service';
import { memoryStorage } from 'multer';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

@Controller('media')
export class MediaController {
    constructor(private readonly mediaService: MediaService) {}

    @Post('upload')
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
    async upload(@Request() req: any, @UploadedFile() file: Express.Multer.File) {
        if (req.user?.role !== 'admin' && req.user?.role !== 'superadmin') {
            throw new ForbiddenException('Admin access required');
        }
        if (!file) {
            return { error: 'No file uploaded' };
        }
        return this.mediaService.createFromFile(file);
    }

    @Get()
    @UseGuards(AuthGuard)
    async list(
        @Request() req: any,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('search') search?: string,
    ) {
        if (req.user?.role !== 'admin' && req.user?.role !== 'superadmin') {
            throw new ForbiddenException('Admin access required');
        }
        return this.mediaService.findAll({
            page: page ? parseInt(page, 10) : undefined,
            limit: limit ? parseInt(limit, 10) : undefined,
            search,
        });
    }

    @Get(':id')
    @UseGuards(AuthGuard)
    async getOne(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
        if (req.user?.role !== 'admin' && req.user?.role !== 'superadmin') {
            throw new ForbiddenException('Admin access required');
        }
        return this.mediaService.findOne(id);
    }

    @Delete(':id')
    @UseGuards(AuthGuard)
    async remove(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
        if (req.user?.role !== 'admin' && req.user?.role !== 'superadmin') {
            throw new ForbiddenException('Admin access required');
        }
        await this.mediaService.remove(id);
    }
}
