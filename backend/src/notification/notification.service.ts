import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationService {
    constructor(private prisma: PrismaService) { }

    async createNotification(data: {
        userId: number;
        type: string;
        title: string;
        message: string;
        link?: string;
    }) {
        return this.prisma.notification.create({
            data: {
                user_id: data.userId,
                type: data.type,
                title: data.title,
                message: data.message,
                link: data.link,
                is_read: false
            }
        });
    }

    async getUserNotifications(userId: number) {
        return this.prisma.notification.findMany({
            where: { user_id: userId },
            orderBy: { created_at: 'desc' },
            take: 50 // Keep the payload reasonable
        });
    }

    async markAsRead(notificationId: number, userId: number) {
        return this.prisma.notification.updateMany({
            where: { id: notificationId, user_id: userId },
            data: { is_read: true }
        });
    }

    async markAllAsRead(userId: number) {
        return this.prisma.notification.updateMany({
            where: { user_id: userId, is_read: false },
            data: { is_read: true }
        });
    }
}
