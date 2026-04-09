import { Controller, Get, Header, Query, Request, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { PermissionGuard } from '../auth/permission.guard';
import { RequirePermission } from '../auth/require-permission.decorator';
import { PERMISSION_MAP } from '../auth/permissions';
import { AuditService } from './audit.service';
import { Response } from 'express';

@Controller('admin/audit-logs')
@UseGuards(AuthGuard, PermissionGuard)
export class AuditController {
    constructor(private readonly auditService: AuditService) {}

    @Get()
    @RequirePermission(PERMISSION_MAP.AUDIT_READ)
    listLogs(
        @Request() _req: any,
        @Query() query: {
            page?: number;
            limit?: number;
            action?: string;
            admin_id?: number;
            table_name?: string;
            from?: string;
            to?: string;
        },
    ) {
        return this.auditService.listAdminLogs(query);
    }

    @Get('export.csv')
    @RequirePermission(PERMISSION_MAP.AUDIT_READ)
    @Header('Content-Type', 'text/csv; charset=utf-8')
    async exportCsv(
        @Request() _req: any,
        @Query() query: {
            limit?: number;
            action?: string;
            admin_id?: number;
            table_name?: string;
            from?: string;
            to?: string;
        },
        @Res({ passthrough: true }) res: Response,
    ) {
        const ts = new Date().toISOString().replace(/[:.]/g, '-');
        res.setHeader('Content-Disposition', `attachment; filename="admin-audit-logs-${ts}.csv"`);
        return this.auditService.exportAdminLogsCsv(query);
    }
}
