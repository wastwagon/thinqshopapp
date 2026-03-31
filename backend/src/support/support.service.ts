import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { CreateSupportTicketDto } from './dto/create-support-ticket.dto';

const DEFAULT_SUPPORT_EMAIL = 'info@thinqshopping.app';

@Injectable()
export class SupportService {
    constructor(
        private prisma: PrismaService,
        private notificationService: NotificationService,
    ) {}

    async createTicket(userId: number, dto: CreateSupportTicketDto) {
        const [user, supportEmailSetting, admins] = await Promise.all([
            this.prisma.user.findUnique({
                where: { id: userId },
                include: { profile: true },
            }),
            this.prisma.setting.findUnique({ where: { setting_key: 'support_email' } }),
            this.prisma.user.findMany({
                where: { role: { in: ['admin', 'superadmin'] } },
                select: { id: true },
            }),
        ]);

        const supportEmail = supportEmailSetting?.setting_value?.trim() || DEFAULT_SUPPORT_EMAIL;
        const reference = dto.reference?.trim();
        const userName = [user?.profile?.first_name, user?.profile?.last_name].filter(Boolean).join(' ') || user?.email || `User#${userId}`;
        const subject = `[Support] ${dto.category.toUpperCase()}${reference ? ` (${reference})` : ''}`;
        const body = [
            `Category: ${dto.category}`,
            `Reference: ${reference || 'N/A'}`,
            `User ID: ${userId}`,
            `User: ${userName}`,
            `Email: ${user?.email || 'N/A'}`,
            '',
            'Message:',
            dto.message,
        ].join('\n');

        await this.prisma.emailQueue.create({
            data: {
                recipient: supportEmail,
                subject,
                body,
                status: 'pending',
            },
        });

        await this.notificationService.createNotification({
            userId,
            type: 'support',
            title: 'Support ticket received',
            message: 'We received your request and our team will respond shortly.',
            link: '/dashboard/support',
        });

        await Promise.all(
            admins.map((admin) =>
                this.notificationService.createNotification({
                    userId: admin.id,
                    type: 'support_ticket',
                    title: `New support ticket (${dto.category})`,
                    message: reference ? `${userName} submitted ticket for ${reference}` : `${userName} submitted a new ticket`,
                    link: '/admin',
                }),
            ),
        );

        return { message: 'Support ticket submitted successfully' };
    }
}
