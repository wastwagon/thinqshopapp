import {
    Injectable,
    NotFoundException,
    ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
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

    private async ensureOptionExists(optionId: number) {
        const option = await this.prisma.variationOption.findUnique({
            where: { id: optionId },
        });
        if (!option) {
            throw new NotFoundException(`Variation option ${optionId} not found`);
        }
        return option;
    }

    private handlePrismaError(e: unknown, message: string): never {
        if (e instanceof Prisma.PrismaClientKnownRequestError) {
            if (e.code === 'P2002') {
                throw new ConflictException(message);
            }
            if (e.code === 'P2025') {
                throw new NotFoundException(message);
            }
        }
        throw e;
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
        try {
            return await this.prisma.variationOption.create({
                data: {
                    name: dto.name,
                    slug,
                    sort_order: dto.sort_order ?? 0,
                },
            });
        } catch (e) {
            this.handlePrismaError(e, `Option "${dto.name}" already exists`);
        }
    }

    async updateOption(id: number, dto: UpdateVariationOptionDto) {
        await this.ensureOptionExists(id);
        const data: Record<string, unknown> = { ...dto };
        if (dto.name && !dto.slug) data.slug = this.slugify(dto.name);
        try {
            return await this.prisma.variationOption.update({
                where: { id },
                data,
            });
        } catch (e) {
            this.handlePrismaError(e, 'Option update');
        }
    }

    async deleteOption(id: number) {
        await this.ensureOptionExists(id);
        return this.prisma.variationOption.delete({ where: { id } });
    }

    // --- Values (admin) ---
    async createValue(dto: CreateVariationValueDto) {
        await this.ensureOptionExists(dto.variation_option_id);
        const value = dto.value.trim();
        try {
            return await this.prisma.variationValue.create({
                data: {
                    variation_option_id: dto.variation_option_id,
                    value,
                    sort_order: dto.sort_order ?? 0,
                },
            });
        } catch (e) {
            this.handlePrismaError(
                e,
                `Value "${value}" already exists for this option`,
            );
        }
    }

    async updateValue(id: number, dto: UpdateVariationValueDto) {
        const existing = await this.prisma.variationValue.findUnique({ where: { id } });
        if (!existing) {
            throw new NotFoundException(`Variation value ${id} not found`);
        }
        const data: { value?: string; sort_order?: number } = {};
        if (dto.value !== undefined) data.value = dto.value.trim();
        if (dto.sort_order !== undefined) data.sort_order = dto.sort_order;
        try {
            return await this.prisma.variationValue.update({
                where: { id },
                data,
            });
        } catch (e) {
            const label = dto.value?.trim();
            this.handlePrismaError(
                e,
                label
                    ? `Value "${label}" already exists for this option`
                    : 'Value update failed',
            );
        }
    }

    async deleteValue(id: number) {
        const existing = await this.prisma.variationValue.findUnique({ where: { id } });
        if (!existing) {
            throw new NotFoundException(`Variation value ${id} not found`);
        }
        return this.prisma.variationValue.delete({ where: { id } });
    }
}
