import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { VariationService } from './variation.service';
import { CreateVariationOptionDto, UpdateVariationOptionDto } from './dto/variation-option.dto';
import { CreateVariationValueDto, UpdateVariationValueDto } from './dto/variation-value.dto';
import { AuthGuard } from '../auth/auth.guard';
import { PermissionGuard } from '../auth/permission.guard';
import { RequirePermission } from '../auth/require-permission.decorator';
import { PERMISSION_MAP } from '../auth/permissions';
import { AuditService } from '../audit/audit.service';

@Controller('variations')
export class VariationController {
    constructor(
        private variationService: VariationService,
        private auditService: AuditService,
    ) {}

    @Get('options')
    async getOptions() {
        return this.variationService.getOptionsPublic();
    }

    @Get('admin/options')
    @UseGuards(AuthGuard, PermissionGuard)
    @RequirePermission(PERMISSION_MAP.VARIATIONS_MANAGE)
    async getOptionsAdmin(@Request() req: any) {
        return this.variationService.getOptions();
    }

    @Post('admin/options')
    @UseGuards(AuthGuard, PermissionGuard)
    @RequirePermission(PERMISSION_MAP.VARIATIONS_MANAGE)
    async createOption(@Request() req: any, @Body() dto: CreateVariationOptionDto) {
        const created = await this.variationService.createOption(dto);
        await this.auditService.logAdminAction(req, 'variation_option.create', {
            tableName: 'variation_options',
            recordId: created.id,
        });
        return created;
    }

    @Patch('admin/options/:id')
    @UseGuards(AuthGuard, PermissionGuard)
    @RequirePermission(PERMISSION_MAP.VARIATIONS_MANAGE)
    async updateOption(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateVariationOptionDto) {
        const updated = await this.variationService.updateOption(Number(id), dto);
        await this.auditService.logAdminAction(req, 'variation_option.update', {
            tableName: 'variation_options',
            recordId: Number(id),
        });
        return updated;
    }

    @Delete('admin/options/:id')
    @UseGuards(AuthGuard, PermissionGuard)
    @RequirePermission(PERMISSION_MAP.VARIATIONS_MANAGE)
    async deleteOption(@Request() req: any, @Param('id') id: string) {
        const deleted = await this.variationService.deleteOption(Number(id));
        await this.auditService.logAdminAction(req, 'variation_option.delete', {
            tableName: 'variation_options',
            recordId: Number(id),
        });
        return deleted;
    }

    @Post('admin/values')
    @UseGuards(AuthGuard, PermissionGuard)
    @RequirePermission(PERMISSION_MAP.VARIATIONS_MANAGE)
    async createValue(@Request() req: any, @Body() dto: CreateVariationValueDto) {
        const created = await this.variationService.createValue(dto);
        await this.auditService.logAdminAction(req, 'variation_value.create', {
            tableName: 'variation_values',
            recordId: created.id,
        });
        return created;
    }

    @Patch('admin/values/:id')
    @UseGuards(AuthGuard, PermissionGuard)
    @RequirePermission(PERMISSION_MAP.VARIATIONS_MANAGE)
    async updateValue(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateVariationValueDto) {
        const updated = await this.variationService.updateValue(Number(id), dto);
        await this.auditService.logAdminAction(req, 'variation_value.update', {
            tableName: 'variation_values',
            recordId: Number(id),
        });
        return updated;
    }

    @Delete('admin/values/:id')
    @UseGuards(AuthGuard, PermissionGuard)
    @RequirePermission(PERMISSION_MAP.VARIATIONS_MANAGE)
    async deleteValue(@Request() req: any, @Param('id') id: string) {
        const deleted = await this.variationService.deleteValue(Number(id));
        await this.auditService.logAdminAction(req, 'variation_value.delete', {
            tableName: 'variation_values',
            recordId: Number(id),
        });
        return deleted;
    }
}
