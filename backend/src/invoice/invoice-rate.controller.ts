import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, ParseIntPipe, Query } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { PermissionGuard } from '../auth/permission.guard';
import { InvoiceRateService } from './invoice-rate.service';
import { CreateInvoiceRateDto } from './dto/create-invoice-rate.dto';
import { UpdateInvoiceRateDto } from './dto/update-invoice-rate.dto';
import { RequirePermission } from '../auth/require-permission.decorator';
import { PERMISSION_MAP } from '../auth/permissions';
import { AuditService } from '../audit/audit.service';

@Controller('invoice-rates')
export class InvoiceRateController {
    constructor(
        private readonly invoiceRateService: InvoiceRateService,
        private readonly auditService: AuditService,
    ) {}

    @Get()
    @UseGuards(AuthGuard, PermissionGuard)
    @RequirePermission(PERMISSION_MAP.INVOICE_RATES_MANAGE)
    async findAll(@Request() req: any, @Query() query: { unit?: string; is_active?: string; mode?: string }) {
        return this.invoiceRateService.findAll(query);
    }

    @Get(':id')
    @UseGuards(AuthGuard, PermissionGuard)
    @RequirePermission(PERMISSION_MAP.INVOICE_RATES_MANAGE)
    async findOne(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
        return this.invoiceRateService.findOne(id);
    }

    @Post()
    @UseGuards(AuthGuard, PermissionGuard)
    @RequirePermission(PERMISSION_MAP.INVOICE_RATES_MANAGE)
    async create(@Request() req: any, @Body() dto: CreateInvoiceRateDto) {
        const created = await this.invoiceRateService.create(dto);
        await this.auditService.logAdminAction(req, 'invoice_rate.create', {
            tableName: 'invoice_rates',
            recordId: created.id,
        });
        return created;
    }

    @Patch(':id')
    @UseGuards(AuthGuard, PermissionGuard)
    @RequirePermission(PERMISSION_MAP.INVOICE_RATES_MANAGE)
    async update(@Request() req: any, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateInvoiceRateDto) {
        const updated = await this.invoiceRateService.update(id, dto);
        await this.auditService.logAdminAction(req, 'invoice_rate.update', {
            tableName: 'invoice_rates',
            recordId: id,
        });
        return updated;
    }

    @Delete(':id')
    @UseGuards(AuthGuard, PermissionGuard)
    @RequirePermission(PERMISSION_MAP.INVOICE_RATES_MANAGE)
    async remove(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
        const removed = await this.invoiceRateService.remove(id);
        await this.auditService.logAdminAction(req, 'invoice_rate.delete', {
            tableName: 'invoice_rates',
            recordId: id,
        });
        return removed;
    }
}
