import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdminLog, Prisma } from '@prisma/client';

@Injectable()
export class AuditService {
    constructor(private prisma: PrismaService) {}

    async logAdminAction(
        req: any,
        action: string,
        options?: {
            tableName?: string;
            recordId?: number | null;
            details?: Record<string, unknown>;
        },
    ) {
        try {
            await this.prisma.adminLog.create({
                data: {
                    admin_id: req?.user?.sub ?? null,
                    action,
                    table_name: options?.tableName ?? null,
                    record_id: options?.recordId ?? null,
                    ip_address: req?.ip || req?.headers?.['x-forwarded-for'] || null,
                    details: {
                        route: req?.originalUrl || req?.url,
                        method: req?.method,
                        actor_role: req?.user?.role,
                        ...options?.details,
                    },
                },
            });
        } catch {
            // Do not block requests on audit failures.
        }
    }

    private buildListWhere(query: {
        action?: string;
        admin_id?: number;
        table_name?: string;
        from?: string;
        to?: string;
    }): Prisma.AdminLogWhereInput {
        const where: Prisma.AdminLogWhereInput = {};
        if (query.action?.trim()) {
            where.action = { contains: query.action.trim(), mode: 'insensitive' };
        }
        if (query.table_name?.trim()) {
            where.table_name = { contains: query.table_name.trim(), mode: 'insensitive' };
        }
        if (query.admin_id && Number.isFinite(Number(query.admin_id))) {
            where.admin_id = Number(query.admin_id);
        }
        const from = query.from ? new Date(query.from) : null;
        const to = query.to ? new Date(query.to) : null;
        if (from && !Number.isNaN(from.getTime())) {
            where.created_at = { ...(where.created_at as Prisma.DateTimeFilter), gte: from };
        }
        if (to && !Number.isNaN(to.getTime())) {
            where.created_at = { ...(where.created_at as Prisma.DateTimeFilter), lte: to };
        }
        return where;
    }

    private async attachAdminDetails(rows: AdminLog[]) {
        const adminIds = Array.from(new Set(rows.map((r) => r.admin_id).filter((id): id is number => typeof id === 'number')));
        const admins = adminIds.length > 0
            ? await this.prisma.user.findMany({
                where: { id: { in: adminIds } },
                select: { id: true, email: true, profile: { select: { first_name: true, last_name: true } } },
            })
            : [];
        const adminMap = new Map(admins.map((a) => [a.id, a]));

        return rows.map((row) => {
            const actor = row.admin_id ? adminMap.get(row.admin_id) : undefined;
            const actorName = actor?.profile
                ? [actor.profile.first_name, actor.profile.last_name].filter(Boolean).join(' ').trim()
                : undefined;
            return {
                ...row,
                admin: row.admin_id
                    ? {
                        id: row.admin_id,
                        email: actor?.email || null,
                        name: actorName || null,
                    }
                    : null,
            };
        });
    }

    async listAdminLogs(query: {
        page?: number;
        limit?: number;
        action?: string;
        admin_id?: number;
        table_name?: string;
        from?: string;
        to?: string;
    }) {
        const page = Math.max(1, Number(query.page || 1));
        const limit = Math.min(100, Math.max(1, Number(query.limit || 50)));
        const skip = (page - 1) * limit;
        const where = this.buildListWhere(query);

        const [rows, total] = await Promise.all([
            this.prisma.adminLog.findMany({
                where,
                orderBy: { created_at: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.adminLog.count({ where }),
        ]);
        const data = await this.attachAdminDetails(rows);

        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async exportAdminLogsCsv(query: {
        action?: string;
        admin_id?: number;
        table_name?: string;
        from?: string;
        to?: string;
        limit?: number;
    }) {
        const where = this.buildListWhere(query);
        const limit = Math.min(5000, Math.max(1, Number(query.limit || 2000)));
        const rows = await this.prisma.adminLog.findMany({
            where,
            orderBy: { created_at: 'desc' },
            take: limit,
        });
        const enriched = await this.attachAdminDetails(rows);

        const escapeCsv = (value: unknown): string => {
            const raw = value == null ? '' : String(value);
            return `"${raw.replace(/"/g, '""')}"`;
        };

        const header = [
            'id',
            'created_at',
            'action',
            'table_name',
            'record_id',
            'admin_id',
            'admin_name',
            'admin_email',
            'ip_address',
            'details',
        ];

        const lines = enriched.map((row) => [
            row.id,
            row.created_at?.toISOString?.() || '',
            row.action,
            row.table_name || '',
            row.record_id ?? '',
            row.admin_id ?? '',
            row.admin?.name || '',
            row.admin?.email || '',
            row.ip_address || '',
            row.details ? JSON.stringify(row.details) : '',
        ].map(escapeCsv).join(','));

        return [header.join(','), ...lines].join('\n');
    }
}
