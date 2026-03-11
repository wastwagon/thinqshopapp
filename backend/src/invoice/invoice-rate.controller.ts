import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, ParseIntPipe, Query, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { InvoiceRateService } from './invoice-rate.service';
import { CreateInvoiceRateDto } from './dto/create-invoice-rate.dto';
import { UpdateInvoiceRateDto } from './dto/update-invoice-rate.dto';

@Controller('invoice-rates')
export class InvoiceRateController {
    constructor(private readonly invoiceRateService: InvoiceRateService) {}

    private guardAdmin(req: any) {
        if (req.user?.role !== 'admin' && req.user?.role !== 'superadmin') {
            throw new ForbiddenException('Admin access required');
        }
    }

    @Get()
    @UseGuards(AuthGuard)
    async findAll(@Request() req: any, @Query() query: { unit?: string; is_active?: string; mode?: string }) {
        this.guardAdmin(req);
        return this.invoiceRateService.findAll(query);
    }

    @Get(':id')
    @UseGuards(AuthGuard)
    async findOne(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
        this.guardAdmin(req);
        return this.invoiceRateService.findOne(id);
    }

    @Post()
    @UseGuards(AuthGuard)
    async create(@Request() req: any, @Body() dto: CreateInvoiceRateDto) {
        this.guardAdmin(req);
        return this.invoiceRateService.create(dto);
    }

    @Patch(':id')
    @UseGuards(AuthGuard)
    async update(@Request() req: any, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateInvoiceRateDto) {
        this.guardAdmin(req);
        return this.invoiceRateService.update(id, dto);
    }

    @Delete(':id')
    @UseGuards(AuthGuard)
    async remove(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
        this.guardAdmin(req);
        return this.invoiceRateService.remove(id);
    }
}
