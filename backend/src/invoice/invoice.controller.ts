import { Controller, Get, Post, Body, Patch, Param, UseGuards, Request, ParseIntPipe, Query, StreamableFile } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { PermissionGuard } from '../auth/permission.guard';
import { InvoiceService } from './invoice.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { RequirePermission } from '../auth/require-permission.decorator';
import { PERMISSION_MAP } from '../auth/permissions';
import { AuditService } from '../audit/audit.service';

@Controller('invoices')
export class InvoiceController {
    constructor(
        private readonly invoiceService: InvoiceService,
        private readonly auditService: AuditService,
    ) {}

    @Get()
    @UseGuards(AuthGuard, PermissionGuard)
    @RequirePermission(PERMISSION_MAP.INVOICES_MANAGE)
    async findAll(@Request() req: any, @Query() query: { page?: number; limit?: number; status?: string }) {
        return this.invoiceService.findAll(query);
    }

    @Get(':id/pdf')
    @UseGuards(AuthGuard, PermissionGuard)
    @RequirePermission(PERMISSION_MAP.INVOICES_MANAGE)
    async getPdf(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
        const invoice = await this.invoiceService.findOne(id);
        const buffer = await this.invoiceService.generatePdf(id, invoice);
        const filename = `invoice-${(invoice as any).invoice_number}.pdf`;
        return new StreamableFile(buffer, {
            type: 'application/pdf',
            disposition: `attachment; filename="${filename}"`,
        });
    }

    @Get(':id')
    @UseGuards(AuthGuard, PermissionGuard)
    @RequirePermission(PERMISSION_MAP.INVOICES_MANAGE)
    async findOne(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
        return this.invoiceService.findOne(id);
    }

    @Post()
    @UseGuards(AuthGuard, PermissionGuard)
    @RequirePermission(PERMISSION_MAP.INVOICES_MANAGE)
    async create(@Request() req: any, @Body() dto: CreateInvoiceDto) {
        const created = await this.invoiceService.create(dto, req.user.sub);
        await this.auditService.logAdminAction(req, 'invoice.create', {
            tableName: 'invoices',
            recordId: created.id,
        });
        return created;
    }

    @Patch(':id')
    @UseGuards(AuthGuard, PermissionGuard)
    @RequirePermission(PERMISSION_MAP.INVOICES_MANAGE)
    async update(@Request() req: any, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateInvoiceDto) {
        const updated = await this.invoiceService.update(id, dto);
        await this.auditService.logAdminAction(req, 'invoice.update', {
            tableName: 'invoices',
            recordId: id,
        });
        return updated;
    }

    @Patch(':id/status')
    @UseGuards(AuthGuard, PermissionGuard)
    @RequirePermission(PERMISSION_MAP.INVOICES_MANAGE)
    async updateStatus(@Request() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: { status: string }) {
        const updated = await this.invoiceService.updateStatus(id, body.status);
        await this.auditService.logAdminAction(req, 'invoice.status.update', {
            tableName: 'invoices',
            recordId: id,
            details: { status: body.status },
        });
        return updated;
    }

    @Post(':id/send-sms')
    @UseGuards(AuthGuard, PermissionGuard)
    @RequirePermission(PERMISSION_MAP.INVOICES_MANAGE)
    async sendInvoiceSms(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
        const sent = await this.invoiceService.sendInvoiceSummarySms(id);
        await this.auditService.logAdminAction(req, 'invoice.sms.send', {
            tableName: 'invoices',
            recordId: id,
        });
        return sent;
    }
}
