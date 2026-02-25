import { Controller, Get, Patch, Body, Param, UseGuards, Request, ForbiddenException, ParseIntPipe } from '@nestjs/common';
import { EmailTemplateService } from './email-template.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('admin/email-templates')
@UseGuards(AuthGuard)
export class EmailTemplateController {
    constructor(private emailTemplateService: EmailTemplateService) { }

    @Get()
    async findAll(@Request() req: any) {
        if (req.user?.role !== 'admin' && req.user?.role !== 'superadmin') {
            throw new ForbiddenException('Admin access required');
        }
        return this.emailTemplateService.findAll();
    }

    @Patch(':id')
    async update(
        @Request() req: any,
        @Param('id', ParseIntPipe) id: number,
        @Body() body: { name?: string; subject?: string; body?: string; is_enabled?: boolean },
    ) {
        if (req.user?.role !== 'admin' && req.user?.role !== 'superadmin') {
            throw new ForbiddenException('Admin access required');
        }
        return this.emailTemplateService.update(id, body);
    }
}
