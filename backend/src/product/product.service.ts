import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { CreateReviewDto } from './dto/review.dto';

/**
 * Legacy flat categories rolled into shop URLs (no product reassignment).
 * New-* inherits legacy/flat catalog; used-* stays empty until assigned in Admin.
 */
const LEGACY_CHILD_SLUGS: Record<string, string[]> = {
    cameras: ['photography'],
    'new-cameras': ['photography'],
    'used-cameras': [],
    drones: [],
    'new-drones': ['drones'],
    'used-drones': [],
    computers: [],
    'new-computers': ['computers'],
    'used-computers': [],
    gaming: [],
    'new-gaming': ['gaming'],
    'used-gaming': [],
    'pro-audio': ['audio-studio'],
    'new-pro-audio': ['audio-studio', 'pro-audio'],
    'used-pro-audio': [],
    electronics: [],
    'new-electronics': ['electronics'],
    'used-electronics': [],
    lighting: [],
    'new-lighting': ['lighting'],
    'used-lighting': [],
    'pro-video': [],
    'new-pro-video': ['pro-video'],
    'used-pro-video': [],
};

/** Legacy root URLs that should return the same product set as a New/Used tree root */
const LEGACY_MIRROR_TO_ROOT: Record<string, string> = {
    photography: 'cameras',
    'audio-studio': 'pro-audio',
};

@Injectable()
export class ProductService {
    constructor(private prisma: PrismaService) { }

    private readonly categoryIncludePublic = {
        parent: { select: { id: true, name: true, slug: true } },
        children: {
            where: { is_active: true },
            orderBy: { sort_order: 'asc' as const },
        },
    };

    private readonly categoryIncludeAdmin = {
        parent: { select: { id: true, name: true, slug: true } },
        children: { orderBy: { sort_order: 'asc' as const } },
    };

    async create(createProductDto: CreateProductDto) {
        await this.assertLeafCategory(createProductDto.category_id);
        const slug = createProductDto.slug || this.slugify(createProductDto.name);
        const { variants, ...rest } = createProductDto as CreateProductDto & { variants?: Array<{ variant_type: string; variant_value: string; sku?: string; price_adjust?: number; stock_quantity?: number; image?: string }> };
        const data = { ...rest, slug } as any;
        const product = await this.prisma.product.create({
            data,
        });
        if (variants?.length) {
            await this.prisma.productVariant.createMany({
                data: variants.map((v) => ({
                    product_id: product.id,
                    variant_type: v.variant_type,
                    variant_value: v.variant_value,
                    sku: v.sku ?? null,
                    price_adjust: v.price_adjust ?? 0,
                    stock_quantity: v.stock_quantity ?? 0,
                    image: v.image ?? null,
                })),
            });
        }
        return this.prisma.product.findUnique({
            where: { id: product.id },
            include: { category: true, variants: true },
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
                include: { category: true, variants: true },
                skip: Number(skip),
                take: Number(limit),
                orderBy: { created_at: 'desc' },
            }),
            this.prisma.product.count({ where }),
        ]);
        return { data: products, meta: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) } };
    }

    async findAll(query: { category?: string; search?: string; page?: number; limit?: number }) {
        const { category, search, page = 1, limit = 100 } = query;
        const skip = (page - 1) * limit;

        const where: any = { is_active: true };

        if (category) {
            const categoryRecord = await this.prisma.category.findUnique({ where: { slug: category } });
            if (categoryRecord) {
                const ids = await this.resolveCategoryIdsForFilter(categoryRecord);
                where.category_id = ids.length === 1 ? ids[0] : { in: ids };
            } else {
                // Unknown slug — do not return unfiltered catalog
                where.category_id = -1;
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
                include: { category: true, variants: true },
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
        const pageNum = Math.max(1, Number(query.page) || 1);
        const limitNum = Math.min(100, Math.max(1, Number(query.limit) || 50));
        const skip = (pageNum - 1) * limitNum;
        const where: any = {};
        if (query.product_id != null) where.product_id = Number(query.product_id);
        if (query.is_approved === 'true') where.is_approved = true;
        if (query.is_approved === 'false') where.is_approved = false;
        const [reviews, total] = await Promise.all([
            this.prisma.productReview.findMany({
                where,
                include: { product: { select: { id: true, name: true, slug: true } }, user: { select: { id: true, email: true, profile: { select: { first_name: true, last_name: true } } } } },
                orderBy: { created_at: 'desc' },
                skip,
                take: limitNum,
            }),
            this.prisma.productReview.count({ where }),
        ]);
        const totalPages = limitNum > 0 ? Math.ceil(total / limitNum) : 0;
        return {
            data: reviews.map((r) => ({
                id: r.id,
                product_id: r.product_id,
                user_id: r.user_id,
                order_id: r.order_id,
                rating: r.rating,
                review_text: r.review_text,
                review_images: r.review_images,
                display_name: r.display_name,
                is_approved: r.is_approved,
                created_at: r.created_at.toISOString ? r.created_at.toISOString() : r.created_at,
                updated_at: r.updated_at.toISOString ? r.updated_at.toISOString() : r.updated_at,
                product: r.product,
                user: r.user,
            })),
            meta: { total, page: pageNum, limit: limitNum, totalPages },
        };
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
        const existing = await this.prisma.product.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('Product not found');

        if (updateProductDto.category_id != null) {
            await this.assertLeafCategory(updateProductDto.category_id);
        }
        const { variants, ...rest } = updateProductDto as UpdateProductDto & { variants?: Array<{ variant_type: string; variant_value: string; sku?: string; price_adjust?: number; stock_quantity?: number; image?: string }> };

        if (existing.is_consignment) {
            const dto = updateProductDto as Record<string, unknown>;
            const blocked = ['is_consignment', 'consignor_user_id', 'commission_pct'];
            for (const key of blocked) {
                if (dto[key] !== undefined) {
                    throw new BadRequestException(`Cannot change ${key} on a Sell for Me product`);
                }
            }
            if (rest.stock_quantity !== undefined && Number(rest.stock_quantity) !== Number(existing.stock_quantity)) {
                throw new BadRequestException('Consignment stock is managed via Sell for Me admin (approve, sale, delist)');
            }
            if (dto.is_active === true && !existing.is_active) {
                throw new BadRequestException('Re-list consignment items from Admin → Sell for Me, not Products');
            }
        }

        await this.prisma.product.update({
            where: { id },
            data: rest as any,
        });
        if (variants !== undefined) {
            await this.prisma.productVariant.deleteMany({ where: { product_id: id } });
            if (variants?.length) {
                const consignmentStock = existing.is_consignment ? Number(existing.stock_quantity) : null;
                await this.prisma.productVariant.createMany({
                    data: variants.map((v) => ({
                        product_id: id,
                        variant_type: v.variant_type,
                        variant_value: v.variant_value,
                        sku: v.sku ?? null,
                        price_adjust: v.price_adjust ?? 0,
                        stock_quantity: consignmentStock ?? v.stock_quantity ?? 0,
                        image: v.image ?? null,
                    })),
                });
            }
        }
        return this.prisma.product.findUnique({
            where: { id },
            include: { category: true, variants: true },
        });
    }

    async remove(id: number) {
        const product = await this.prisma.product.findUnique({
            where: { id },
            include: { consignment_submission: { select: { id: true, status: true } } },
        });
        if (!product) {
            throw new NotFoundException(`Product #${id} not found`);
        }

        const orderItemCount = await this.prisma.orderItem.count({ where: { product_id: id } });
        if (orderItemCount > 0) {
            throw new BadRequestException(
                'Cannot delete product with order history. Deactivate it or remove it from Sell for Me instead.',
            );
        }

        return this.prisma.$transaction(async (tx) => {
            await tx.cartItem.deleteMany({ where: { product_id: id } });
            await tx.wishlist.deleteMany({ where: { product_id: id } });
            await tx.productReview.deleteMany({ where: { product_id: id } });
            await tx.productVariant.deleteMany({ where: { product_id: id } });

            if (product.consignment_submission) {
                await tx.consignmentSubmission.update({
                    where: { id: product.consignment_submission.id },
                    data: {
                        product_id: null,
                        ...(product.consignment_submission.status === 'listed'
                            ? { status: 'delisted' }
                            : {}),
                    },
                });
            }

            return tx.product.delete({ where: { id } });
        });
    }

    private async resolveLegacyCategoryIds(parentSlug: string): Promise<number[]> {
        const legacySlugs = LEGACY_CHILD_SLUGS[parentSlug] ?? [];
        if (legacySlugs.length === 0) return [];
        const legacy = await this.prisma.category.findMany({
            where: { slug: { in: legacySlugs }, is_active: true },
            select: { id: true },
        });
        return legacy.map((c) => c.id);
    }

    /** Same product set as a tree root (parent + subcategories + legacy aliases). */
    private async resolveTreeCatalogIds(rootSlug: string): Promise<number[]> {
        const root = await this.prisma.category.findUnique({
            where: { slug: rootSlug },
        });
        if (!root) {
            return [];
        }
        return this.resolveCategoryIdsForFilter(root);
    }

    private async resolveCategoryIdsForFilter(category: {
        id: number;
        parent_id: number | null;
        slug: string;
    }) {
        const mirrorRoot = LEGACY_MIRROR_TO_ROOT[category.slug];
        if (mirrorRoot) {
            const catalogIds = await this.resolveTreeCatalogIds(mirrorRoot);
            if (catalogIds.length > 0) {
                return catalogIds;
            }
        }
        if (category.parent_id != null) {
            const legacyIds = await this.resolveLegacyCategoryIds(category.slug);
            if (legacyIds.length === 0) {
                return [category.id];
            }
            return [...new Set([category.id, ...legacyIds])];
        }
        const children = await this.prisma.category.findMany({
            where: { parent_id: category.id, is_active: true },
            select: { id: true },
        });
        if (children.length > 0) {
            const legacyIds = await this.resolveLegacyCategoryIds(category.slug);
            const ids = new Set<number>([
                category.id,
                ...children.map((c) => c.id),
                ...legacyIds,
            ]);
            return [...ids];
        }
        const legacyIds = await this.resolveLegacyCategoryIds(category.slug);
        if (legacyIds.length > 0) {
            return [...new Set([category.id, ...legacyIds])];
        }
        return [category.id];
    }

    private async assertLeafCategory(categoryId: number) {
        const cat = await this.prisma.category.findUnique({
            where: { id: categoryId },
            include: { _count: { select: { children: true } } },
        });
        if (!cat) {
            throw new NotFoundException(`Category ${categoryId} not found`);
        }
        if (cat._count.children > 0) {
            throw new BadRequestException(
                'Products must be assigned to a subcategory, not a main category with children',
            );
        }
    }

    private async validateCategoryParent(parentId: number | null | undefined, categoryId?: number) {
        if (parentId == null || parentId === undefined) return;
        if (categoryId != null && parentId === categoryId) {
            throw new BadRequestException('A category cannot be its own parent');
        }
        const parent = await this.prisma.category.findUnique({ where: { id: parentId } });
        if (!parent) {
            throw new NotFoundException(`Parent category ${parentId} not found`);
        }
        if (parent.parent_id != null) {
            throw new BadRequestException('Subcategories cannot have children; choose a main category as parent');
        }
        if (categoryId != null) {
            const current = await this.prisma.category.findUnique({
                where: { id: categoryId },
                include: { _count: { select: { children: true } } },
            });
            if (!current) {
                throw new NotFoundException(`Category ${categoryId} not found`);
            }
            if (current._count.children > 0) {
                throw new BadRequestException(
                    'Cannot set a parent on a main category that already has subcategories',
                );
            }
        }
    }

    async getCategories(tree?: boolean) {
        const list = await this.prisma.category.findMany({
            where: { is_active: true },
            include: this.categoryIncludePublic,
            orderBy: [{ sort_order: 'asc' }, { name: 'asc' }],
        });
        if (tree) {
            return { roots: list.filter((c) => c.parent_id == null) };
        }
        return list;
    }

    async getCategoriesForAdmin() {
        return this.prisma.category.findMany({
            include: this.categoryIncludeAdmin,
            orderBy: [{ sort_order: 'asc' }, { name: 'asc' }],
        });
    }

    async createCategory(dto: CreateCategoryDto) {
        await this.validateCategoryParent(dto.parent_id ?? null);
        const slug = dto.slug || this.slugify(dto.name);
        return this.prisma.category.create({
            data: { ...dto, slug } as any,
            include: this.categoryIncludeAdmin,
        });
    }

    async updateCategory(id: number, dto: UpdateCategoryDto) {
        if (dto.parent_id !== undefined) {
            await this.validateCategoryParent(dto.parent_id ?? null, id);
        }
        const data: any = { ...dto };
        if (dto.name && !dto.slug) data.slug = this.slugify(dto.name);
        return this.prisma.category.update({
            where: { id },
            data,
            include: this.categoryIncludeAdmin,
        });
    }

    async removeCategory(id: number) {
        const childCount = await this.prisma.category.count({ where: { parent_id: id } });
        if (childCount > 0) {
            throw new BadRequestException(
                `Cannot delete: ${childCount} subcategor${childCount === 1 ? 'y' : 'ies'} under this category`,
            );
        }
        const count = await this.prisma.product.count({ where: { category_id: id } });
        if (count > 0) {
            throw new NotFoundException(`Cannot delete: ${count} product(s) use this category`);
        }
        return this.prisma.category.delete({ where: { id } });
    }
}
