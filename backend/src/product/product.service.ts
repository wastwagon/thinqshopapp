import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { CreateReviewDto } from './dto/review.dto';

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
            include: { category: true, variants: true },
        });
        if (!product) throw new NotFoundException(`Product with slug ${slug} not found`);
        return product;
    }

    async getReviewsByProductSlug(slug: string, page: number | string = 1, limit: number | string = 10) {
        const product = await this.prisma.product.findUnique({ where: { slug }, select: { id: true } });
        if (!product) throw new NotFoundException(`Product with slug ${slug} not found`);
        const p = Number(page) || 1;
        const l = Number(limit) || 10;
        const skip = (p - 1) * l;
        const [reviews, total] = await Promise.all([
            this.prisma.productReview.findMany({
                where: { product_id: product.id, is_approved: true },
                include: { user: { select: { profile: { select: { first_name: true, last_name: true } } } } },
                orderBy: { created_at: 'desc' },
                skip,
                take: l,
            }),
            this.prisma.productReview.count({ where: { product_id: product.id, is_approved: true } }),
        ]);
        const list = reviews.map((r) => ({
            id: r.id,
            rating: r.rating,
            review_text: r.review_text,
            review_images: r.review_images,
            display_name: r.display_name || (r.user?.profile ? [r.user.profile.first_name, r.user.profile.last_name].filter(Boolean).join(' ').trim() || 'Customer' : 'Customer'),
            created_at: r.created_at,
        }));
        return { data: list, meta: { total, page: p, limit: l, totalPages: Math.ceil(total / l) } };
    }

    async createReview(productId: number, userId: number, dto: CreateReviewDto) {
        const product = await this.prisma.product.findUnique({ where: { id: productId } });
        if (!product) throw new NotFoundException('Product not found');
        const existing = await this.prisma.productReview.findFirst({ where: { product_id: productId, user_id: userId } });
        if (existing) throw new ForbiddenException('You have already reviewed this product');
        const review = await this.prisma.productReview.create({
            data: {
                product_id: productId,
                user_id: userId,
                rating: dto.rating,
                review_text: dto.review_text,
                review_images: dto.review_images as any,
                display_name: dto.display_name,
                is_approved: false,
                updated_at: new Date(),
            },
        });
        return review;
    }

    async getReviewsAdmin(query: { page?: number; limit?: number; product_id?: number; is_approved?: string }) {
        const { page = 1, limit = 50, product_id, is_approved } = query;
        const skip = (page - 1) * limit;
        const where: any = {};
        if (product_id != null) where.product_id = Number(product_id);
        if (is_approved === 'true') where.is_approved = true;
        if (is_approved === 'false') where.is_approved = false;
        const [reviews, total] = await Promise.all([
            this.prisma.productReview.findMany({
                where,
                include: { product: { select: { id: true, name: true, slug: true } }, user: { select: { id: true, email: true, profile: { select: { first_name: true, last_name: true } } } } },
                orderBy: { created_at: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.productReview.count({ where }),
        ]);
        return { data: reviews, meta: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) } };
    }

    async updateReviewAdmin(reviewId: number, dto: { is_approved?: boolean; rating?: number; review_text?: string }) {
        const review = await this.prisma.productReview.findUnique({ where: { id: reviewId }, include: { product: true } });
        if (!review) throw new NotFoundException('Review not found');
        const updated = await this.prisma.productReview.update({
            where: { id: reviewId },
            data: { ...dto, updated_at: new Date() },
        });
        await this.updateProductReviewAggregate(review.product_id);
        return updated;
    }

    async updateProductReviewAggregate(productId: number) {
        const result = await this.prisma.productReview.aggregate({
            where: { product_id: productId, is_approved: true },
            _avg: { rating: true },
            _count: true,
        });
        const rating_aggregate = result._avg.rating != null ? Number(result._avg.rating.toFixed(2)) : null;
        const review_count = result._count ?? 0;
        await this.prisma.product.update({
            where: { id: productId },
            data: { rating_aggregate, review_count },
        });
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
