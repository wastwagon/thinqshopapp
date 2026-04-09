import { Controller, Get, Patch, Body, Param, UseGuards, Request, ParseIntPipe } from '@nestjs/common';
import { EmailTemplateService } from './email-template.service';
import { AuthGuard } from '../auth/auth.guard';
import { PermissionGuard } from '../auth/permission.guard';
import { RequirePermission } from '../auth/require-permission.decorator';
import { PERMISSION_MAP } from '../auth/permissions';
import { AuditService } from '../audit/audit.service';

@Controller('admin/email-templates')
@UseGuards(AuthGuard, PermissionGuard)
export class EmailTemplateController {
    constructor(
        private emailTemplateService: EmailTemplateService,
        private auditService: AuditService,
    ) { }

    @Get()
    @RequirePermission(PERMISSION_MAP.EMAIL_TEMPLATES_MANAGE)
    async findAll(@Request() req: any) {
        return this.emailTemplateService.findAll();
    }

    @Patch(':id')
    @RequirePermission(PERMISSION_MAP.EMAIL_TEMPLATES_MANAGE)
    async update(
        @Request() req: any,
        @Param('id', ParseIntPipe) id: number,
        @Body() body: { name?: string; subject?: string; body?: string; is_enabled?: boolean },
    ) {
        const updated = await this.emailTemplateService.update(id, body);
        await this.auditService.logAdminAction(req, 'email_template.update', {
            tableName: 'email_templates',
            recordId: id,
        });
        return updated;
    }
}
