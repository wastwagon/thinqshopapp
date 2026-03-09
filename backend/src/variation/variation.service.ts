import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVariationOptionDto, UpdateVariationOptionDto } from './dto/variation-option.dto';
import { CreateVariationValueDto, UpdateVariationValueDto } from './dto/variation-value.dto';

@Injectable()
export class VariationService {
    constructor(private prisma: PrismaService) {}

    private slugify(s: string): string {
        return s
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '') || 'opt-' + Date.now();
    }

    // --- Options (admin) ---
    async getOptions() {
        return this.prisma.variationOption.findMany({
            include: { values: { orderBy: { sort_order: 'asc' } } },
            orderBy: { sort_order: 'asc' },
        });
    }

    async getOptionsPublic() {
        return this.prisma.variationOption.findMany({
            where: {},
            include: { values: { orderBy: { sort_order: 'asc' } } },
            orderBy: { sort_order: 'asc' },
        });
    }

    async createOption(dto: CreateVariationOptionDto) {
        const slug = dto.slug || this.slugify(dto.name);
        return this.prisma.variationOption.create({
            data: {
                name: dto.name,
                slug,
                sort_order: dto.sort_order ?? 0,
            },
        });
    }

    async updateOption(id: number, dto: UpdateVariationOptionDto) {
        await this.prisma.variationOption.findFirstOrThrow({ where: { id } });
        const data: any = { ...dto };
        if (dto.name && !dto.slug) data.slug = this.slugify(dto.name);
        return this.prisma.variationOption.update({
            where: { id },
            data,
        });
    }

    async deleteOption(id: number) {
        await this.prisma.variationOption.findFirstOrThrow({ where: { id } });
        return this.prisma.variationOption.delete({ where: { id } });
    }

    // --- Values (admin) ---
    async createValue(dto: CreateVariationValueDto) {
        await this.prisma.variationOption.findFirstOrThrow({ where: { id: dto.variation_option_id } });
        return this.prisma.variationValue.create({
            data: {
                variation_option_id: dto.variation_option_id,
                value: dto.value.trim(),
                sort_order: dto.sort_order ?? 0,
            },
        });
    }

    async updateValue(id: number, dto: UpdateVariationValueDto) {
        await this.prisma.variationValue.findFirstOrThrow({ where: { id } });
        return this.prisma.variationValue.update({
            where: { id },
            data: dto,
        });
    }

    async deleteValue(id: number) {
        await this.prisma.variationValue.findFirstOrThrow({ where: { id } });
        return this.prisma.variationValue.delete({ where: { id } });
    }
}
