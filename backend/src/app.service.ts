import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
    constructor(private readonly prisma: PrismaService) {}

    getHello(): string {
        return 'ThinQShop API is running!';
    }

    getHealth(): { status: string; timestamp: string } {
        return { status: 'ok', timestamp: new Date().toISOString() };
    }

    async getReady(): Promise<{
        status: 'ready' | 'degraded';
        timestamp: string;
        database: 'ok' | 'error';
        checks: Record<string, boolean>;
    }> {
        const checks: Record<string, boolean> = {
            jwt_secret: !!process.env.JWT_SECRET,
            frontend_url: !!(process.env.FRONTEND_URL || process.env.CORS_ORIGIN),
            smtp: !!(process.env.SMTP_HOST && process.env.SMTP_FROM),
        };

        let database: 'ok' | 'error' = 'error';
        try {
            await this.prisma.$queryRaw`SELECT 1`;
            database = 'ok';
        } catch {
            database = 'error';
        }

        const coreOk = database === 'ok' && checks.jwt_secret;
        return {
            status: coreOk ? 'ready' : 'degraded',
            timestamp: new Date().toISOString(),
            database,
            checks,
        };
    }
}
