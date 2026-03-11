import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceRateDto } from './dto/create-invoice-rate.dto';
import { UpdateInvoiceRateDto } from './dto/update-invoice-rate.dto';

@Injectable()
export class InvoiceRateService {
    constructor(private prisma: PrismaService) {}

    async create(dto: CreateInvoiceRateDto) {
        return this.prisma.invoiceRate.create({
            data: {
                name: dto.name,
                unit: dto.unit,
                rate_per_unit: dto.rate_per_unit,
                mode: dto.mode ?? null,
                sort_order: dto.sort_order ?? 0,
                is_active: dto.is_active ?? true,
            },
        });
    }

    async findAll(query: { unit?: string; is_active?: string; mode?: string }) {
        const where: any = {};
        if (query.unit) where.unit = query.unit;
        if (query.is_active !== undefined) {
            where.is_active = query.is_active === 'true';
        }
        if (query.mode && query.mode.trim()) {
            where.mode = query.mode.trim().toLowerCase();
        }
        return this.prisma.invoiceRate.findMany({
            where,
            orderBy: [{ sort_order: 'asc' }, { id: 'asc' }],
        });
    }

    async findOne(id: number) {
        const rate = await this.prisma.invoiceRate.findUnique({ where: { id } });
        if (!rate) throw new NotFoundException('Invoice rate not found');
        return rate;
    }

    async update(id: number, dto: UpdateInvoiceRateDto) {
        await this.findOne(id);
        return this.prisma.invoiceRate.update({
            where: { id },
            data: {
                ...(dto.name !== undefined && { name: dto.name }),
                ...(dto.unit !== undefined && { unit: dto.unit }),
                ...(dto.rate_per_unit !== undefined && { rate_per_unit: dto.rate_per_unit }),
                ...(dto.mode !== undefined && { mode: dto.mode ?? null }),
                ...(dto.sort_order !== undefined && { sort_order: dto.sort_order }),
                ...(dto.is_active !== undefined && { is_active: dto.is_active }),
            },
        });
    }

    async remove(id: number) {
        await this.findOne(id);
        return this.prisma.invoiceRate.delete({ where: { id } });
    }
}
