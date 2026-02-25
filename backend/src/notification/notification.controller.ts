import { Controller, Get, Patch, Param, UseGuards, Request, Post } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('notifications')
@UseGuards(AuthGuard)
export class NotificationController {
    constructor(private readonly notificationService: NotificationService) { }

    @Get()
    getNotifications(@Request() req) {
        return this.notificationService.getUserNotifications(req.user.sub);
    }

    @Patch(':id/read')
    markAsRead(@Request() req, @Param('id') id: string) {
        return this.notificationService.markAsRead(Number(id), req.user.sub);
    }

    @Post('read-all')
    markAllAsRead(@Request() req) {
        return this.notificationService.markAllAsRead(req.user.sub);
    }
}
