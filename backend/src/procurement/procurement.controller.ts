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

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

@Controller('procurement')
@UseGuards(AuthGuard)
export class ProcurementController {
    constructor(
        private procurementService: ProcurementService,
        private mediaService: MediaService,
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
    async createRequest(@Request() req, @Body() body: any) {
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
    async acceptQuote(@Request() req, @Body() body: { quoteId: number }) {
        return this.procurementService.createOrderFromQuote(req.user.sub, body.quoteId);
    }

    @Get('admin/requests')
    async getAllRequests(@Request() req) {
        if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
            throw new ForbiddenException('Admin access required');
        }
        return this.procurementService.getAllRequests();
    }

    @Get('admin/:id')
    async getRequestForAdmin(@Request() req, @Param('id') id: string) {
        if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
            throw new ForbiddenException('Admin access required');
        }
        return this.procurementService.getRequestForAdmin(Number(id));
    }

    @Patch('admin/:id/status')
    async updateRequestStatus(@Request() req, @Param('id') id: string, @Body() body: { status: any }) {
        if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
            throw new ForbiddenException('Admin access required');
        }
        return this.procurementService.updateRequestStatus(Number(id), body.status);
    }

    @Post('admin/:id/quote')
    async createQuote(@Request() req, @Param('id') id: string, @Body() body: { amount: number, details: string }) {
        if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
            throw new ForbiddenException('Admin access required');
        }
        return this.procurementService.createQuote(Number(id), body);
    }
}
