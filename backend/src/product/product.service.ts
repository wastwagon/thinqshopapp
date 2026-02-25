import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@Injectable()
export class ProductService {
    constructor(private prisma: PrismaService) { }

    async create(createProductDto: CreateProductDto) {
        const slug = createProductDto.slug || this.slugify(createProductDto.name);
        const data = { ...createProductDto, slug };
        return this.prisma.product.create({
            data: data as any,
        });
    }

    private slugify(s: string): string {
        return s
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '') || 'product-' + Date.now();
    }

    async findAllForAdmin(query: { page?: number; limit?: number; search?: string }) {
        const { page = 1, limit = 100, search } = query;
        const skip = (page - 1) * limit;
        const where: any = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { sku: { contains: search, mode: 'insensitive' } },
            ];
        }
        const [products, total] = await Promise.all([
            this.prisma.product.findMany({
                where,
                include: { category: true },
                skip: Number(skip),
                take: Number(limit),
                orderBy: { created_at: 'desc' },
            }),
            this.prisma.product.count({ where }),
        ]);
        return { data: products, meta: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) } };
    }

    async findAll(query: { category?: string; search?: string; page?: number; limit?: number }) {
        const { category, search, page = 1, limit = 20 } = query;
        const skip = (page - 1) * limit;

        const where: any = { is_active: true };

        if (category) {
            const categoryRecord = await this.prisma.category.findUnique({ where: { slug: category } });
            if (categoryRecord) {
                where.category_id = categoryRecord.id;
            }
        }

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [products, total] = await Promise.all([
            this.prisma.product.findMany({
                where,
                include: { category: true },
                skip: Number(skip),
                take: Number(limit),
                orderBy: { created_at: 'desc' },
            }),
            this.prisma.product.count({ where }),
        ]);

        return {
            data: products,
            meta: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit)),
            },
        };
    }

    async findOne(slug: string) {
        const product = await this.prisma.product.findUnique({
            where: { slug },
            include: { category: true, variants: true, reviews: true },
        });
        if (!product) throw new NotFoundException(`Product with slug ${slug} not found`);
        return product;
    }

    async update(id: number, updateProductDto: UpdateProductDto) {
        return this.prisma.product.update({
            where: { id },
            data: updateProductDto,
        });
    }

    async remove(id: number) {
        return this.prisma.product.delete({ where: { id } });
    }

    async getCategories() {
        return this.prisma.category.findMany({
            where: { is_active: true },
            orderBy: { sort_order: 'asc' }
        });
    }

    async getCategoriesForAdmin() {
        return this.prisma.category.findMany({
            orderBy: [{ sort_order: 'asc' }, { name: 'asc' }]
        });
    }

    async createCategory(dto: CreateCategoryDto) {
        const slug = dto.slug || this.slugify(dto.name);
        return this.prisma.category.create({
            data: { ...dto, slug } as any
        });
    }

    async updateCategory(id: number, dto: UpdateCategoryDto) {
        const data: any = { ...dto };
        if (dto.name && !dto.slug) data.slug = this.slugify(dto.name);
        return this.prisma.category.update({
            where: { id },
            data
        });
    }

    async removeCategory(id: number) {
        const count = await this.prisma.product.count({ where: { category_id: id } });
        if (count > 0) {
            throw new NotFoundException(`Cannot delete: ${count} product(s) use this category`);
        }
        return this.prisma.category.delete({ where: { id } });
    }
}
