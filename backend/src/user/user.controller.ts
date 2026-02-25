import { Controller, Get, Patch, Body, UseGuards, Request, Query, ForbiddenException } from '@nestjs/common';
import { UserService } from './user.service';
import { AuthGuard } from '../auth/auth.guard';

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
}
