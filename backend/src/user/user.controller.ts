import {
    Controller,
    Get,
    Patch,
    Post,
    Body,
    Param,
    UseGuards,
    Request,
    Query,
    ForbiddenException,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UserService } from './user.service';
import { AuthGuard } from '../auth/auth.guard';

const AVATAR_MAX_BYTES = 5 * 1024 * 1024;
const AVATAR_MIMES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

@Controller('users')
export class UserController {
    constructor(private readonly userService: UserService) { }

    @Get('admin/list')
    @UseGuards(AuthGuard)
    async findAllAdmin(@Request() req: any, @Query() query: { page?: number; limit?: number; search?: string }) {
        if (req.user?.role !== 'admin' && req.user?.role !== 'superadmin') {
            throw new ForbiddenException('Admin access required');
        }
        return this.userService.findAllForAdmin(query);
    }

    @Get('admin/:id')
    @UseGuards(AuthGuard)
    async findOneAdmin(@Request() req: any, @Param('id') id: string) {
        if (req.user?.role !== 'admin' && req.user?.role !== 'superadmin') {
            throw new ForbiddenException('Admin access required');
        }
        return this.userService.findOneForAdmin(Number(id));
    }

    @Get('profile')
    @UseGuards(AuthGuard)
    async getProfile(@Request() req) {
        return this.userService.findOne(req.user.sub);
    }

    @Patch('profile')
    @UseGuards(AuthGuard)
    async updateProfile(@Request() req, @Body() body: any) {
        return this.userService.updateProfile(req.user.sub, body);
    }

    @Post('profile/avatar')
    @UseGuards(AuthGuard)
    @UseInterceptors(
        FileInterceptor('file', {
            storage: memoryStorage(),
            limits: { fileSize: AVATAR_MAX_BYTES },
            fileFilter: (_req, file, cb) => {
                if (file.mimetype && AVATAR_MIMES.includes(file.mimetype)) {
                    cb(null, true);
                } else {
                    cb(new Error('Invalid file type. Allowed: JPEG, PNG, GIF, WebP'), false);
                }
            },
        }),
    )
    async uploadProfileAvatar(@Request() req: any, @UploadedFile() file: Express.Multer.File) {
        if (!file) throw new BadRequestException('No file uploaded');
        return this.userService.saveProfileAvatar(req.user.sub, file);
    }
}
