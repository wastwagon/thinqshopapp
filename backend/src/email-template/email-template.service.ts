import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EmailTemplateService {
    constructor(private prisma: PrismaService) { }

    /** Replace {{key}} in str with values from data */
    private replacePlaceholders(str: string, data: Record<string, string>): string {
        let out = str;
        for (const [key, value] of Object.entries(data)) {
            out = out.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value ?? '');
        }
        return out;
    }

    async findAll() {
        return this.prisma.emailTemplate.findMany({
            orderBy: { trigger_key: 'asc' },
        });
    }

    async findOne(id: number) {
        const t = await this.prisma.emailTemplate.findUnique({ where: { id } });
        if (!t) throw new NotFoundException('Email template not found');
        return t;
    }

    async update(id: number, data: { name?: string; subject?: string; body?: string; is_enabled?: boolean }) {
        await this.findOne(id);
        return this.prisma.emailTemplate.update({
            where: { id },
            data: {
                ...(data.name != null && { name: data.name }),
                ...(data.subject != null && { subject: data.subject }),
                ...(data.body != null && { body: data.body }),
                ...(data.is_enabled != null && { is_enabled: data.is_enabled }),
            },
        });
    }

    /** Queue an email using a template. Data keys replace {{key}} in subject and body. */
    async queueFromTemplate(triggerKey: string, recipient: string, data: Record<string, string>) {
        const template = await this.prisma.emailTemplate.findUnique({
            where: { trigger_key: triggerKey },
        });
        if (!template || !template.is_enabled) return null;
        const subject = this.replacePlaceholders(template.subject, data);
        const body = this.replacePlaceholders(template.body, data);
        return this.prisma.emailQueue.create({
            data: { recipient, subject, body, status: 'pending' },
        });
    }
}
