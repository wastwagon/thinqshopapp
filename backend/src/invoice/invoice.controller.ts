import { Controller, Get, Post, Body, Patch, Param, UseGuards, Request, ParseIntPipe, Query, ForbiddenException, StreamableFile } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { InvoiceService } from './invoice.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';

@Controller('invoices')
export class InvoiceController {
    constructor(private readonly invoiceService: InvoiceService) {}

    @Get()
    @UseGuards(AuthGuard)
    async findAll(@Request() req: any, @Query() query: { page?: number; limit?: number; status?: string }) {
        if (req.user?.role !== 'admin' && req.user?.role !== 'superadmin') {
            throw new ForbiddenException('Admin access required');
        }
        return this.invoiceService.findAll(query);
    }

    @Get(':id/pdf')
    @UseGuards(AuthGuard)
    async getPdf(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
        if (req.user?.role !== 'admin' && req.user?.role !== 'superadmin') {
            throw new ForbiddenException('Admin access required');
        }
        const invoice = await this.invoiceService.findOne(id);
        const buffer = await this.invoiceService.generatePdf(id, invoice);
        const filename = `invoice-${(invoice as any).invoice_number}.pdf`;
        return new StreamableFile(buffer, {
            type: 'application/pdf',
            disposition: `attachment; filename="${filename}"`,
        });
    }

    @Get(':id')
    @UseGuards(AuthGuard)
    async findOne(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
        if (req.user?.role !== 'admin' && req.user?.role !== 'superadmin') {
            throw new ForbiddenException('Admin access required');
        }
        return this.invoiceService.findOne(id);
    }

    @Post()
    @UseGuards(AuthGuard)
    async create(@Request() req: any, @Body() dto: CreateInvoiceDto) {
        if (req.user?.role !== 'admin' && req.user?.role !== 'superadmin') {
            throw new ForbiddenException('Admin access required');
        }
        return this.invoiceService.create(dto, req.user.sub);
    }

    @Patch(':id')
    @UseGuards(AuthGuard)
    async update(@Request() req: any, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateInvoiceDto) {
        if (req.user?.role !== 'admin' && req.user?.role !== 'superadmin') {
            throw new ForbiddenException('Admin access required');
        }
        return this.invoiceService.update(id, dto);
    }

    @Patch(':id/status')
    @UseGuards(AuthGuard)
    async updateStatus(@Request() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: { status: string }) {
        if (req.user?.role !== 'admin' && req.user?.role !== 'superadmin') {
            throw new ForbiddenException('Admin access required');
        }
        return this.invoiceService.updateStatus(id, body.status);
    }

    @Post(':id/send-sms')
    @UseGuards(AuthGuard)
    async sendInvoiceSms(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
        if (req.user?.role !== 'admin' && req.user?.role !== 'superadmin') {
            throw new ForbiddenException('Admin access required');
        }
        return this.invoiceService.sendInvoiceSummarySms(id);
    }
}
