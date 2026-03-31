import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request, ParseIntPipe, Header } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { CreateReviewDto, UpdateReviewAdminDto } from './dto/review.dto';
import { AuthGuard } from '../auth/auth.guard';
import { Public } from '../auth/public.decorator';
import { RequirePermission } from '../auth/require-permission.decorator';
import { PERMISSION_MAP } from '../auth/permissions';
import { AuditService } from '../audit/audit.service';

@Controller('products')
export class ProductController {
    constructor(
        private readonly productService: ProductService,
        private readonly auditService: AuditService,
    ) { }

    @Get()
    @Header('Cache-Control', 'public, max-age=60')
    findAll(@Query() query: { category?: string; search?: string; page?: number; limit?: number }) {
        return this.productService.findAll(query);
    }

    @Get('categories')
    @Header('Cache-Control', 'public, max-age=60')
    getCategories() {
        return this.productService.getCategories();
    }

    @Get('categories/admin')
    @UseGuards(AuthGuard)
    @RequirePermission(PERMISSION_MAP.PRODUCTS_READ)
    async getCategoriesAdmin(@Request() req: any) {
        return this.productService.getCategoriesForAdmin();
    }

    @Post('categories')
    @UseGuards(AuthGuard)
    @RequirePermission(PERMISSION_MAP.CATEGORIES_MANAGE)
    async createCategory(@Request() req: any, @Body() dto: CreateCategoryDto) {
        const created = await this.productService.createCategory(dto);
        await this.auditService.logAdminAction(req, 'category.create', {
            tableName: 'categories',
            recordId: created.id,
        });
        return created;
    }

    @Patch('categories/:id')
    @UseGuards(AuthGuard)
    @RequirePermission(PERMISSION_MAP.CATEGORIES_MANAGE)
    async updateCategory(@Request() req: any, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCategoryDto) {
        const updated = await this.productService.updateCategory(id, dto);
        await this.auditService.logAdminAction(req, 'category.update', {
            tableName: 'categories',
            recordId: id,
        });
        return updated;
    }

    @Delete('categories/:id')
    @UseGuards(AuthGuard)
    @RequirePermission(PERMISSION_MAP.CATEGORIES_MANAGE)
    async removeCategory(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
        const deleted = await this.productService.removeCategory(id);
        await this.auditService.logAdminAction(req, 'category.delete', {
            tableName: 'categories',
            recordId: id,
        });
        return deleted;
    }

    @Get('admin/list')
    @UseGuards(AuthGuard)
    @RequirePermission(PERMISSION_MAP.PRODUCTS_READ)
    async findAllAdmin(@Request() req: any, @Query() query: { page?: number; limit?: number; search?: string }) {
        return this.productService.findAllForAdmin(query);
    }

    @Post()
    @UseGuards(AuthGuard)
    @RequirePermission(PERMISSION_MAP.PRODUCTS_MANAGE)
    async create(@Request() req: any, @Body() createProductDto: CreateProductDto) {
        const created = await this.productService.create(createProductDto);
        await this.auditService.logAdminAction(req, 'product.create', {
            tableName: 'products',
            recordId: created.id,
        });
        return created;
    }

    @Get('admin/reviews')
    @UseGuards(AuthGuard)
    @RequirePermission(PERMISSION_MAP.REVIEWS_MANAGE)
    async getReviewsAdmin(@Request() req: any, @Query() query: { page?: number; limit?: number; product_id?: number; is_approved?: string }) {
        return this.productService.getReviewsAdmin(query);
    }

    @Patch('admin/reviews/:id')
    @UseGuards(AuthGuard)
    @RequirePermission(PERMISSION_MAP.REVIEWS_MANAGE)
    async updateReviewAdmin(@Request() req: any, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateReviewAdminDto) {
        const updated = await this.productService.updateReviewAdmin(id, dto);
        await this.auditService.logAdminAction(req, 'review.update', {
            tableName: 'product_reviews',
            recordId: id,
        });
        return updated;
    }

    @Get(':slug/reviews')
    @Public()
    @Header('Cache-Control', 'public, max-age=60')
    getReviews(@Param('slug') slug: string, @Query() query: { page?: number; limit?: number }) {
        return this.productService.getReviewsByProductSlug(slug, query.page, query.limit);
    }

    @Post(':id/reviews')
    @UseGuards(AuthGuard)
    createReview(@Request() req: any, @Param('id', ParseIntPipe) id: number, @Body() dto: CreateReviewDto) {
        return this.productService.createReview(id, req.user.sub, dto);
    }

    @Get(':slug')
    findOne(@Param('slug') slug: string) {
        return this.productService.findOne(slug);
    }

    @Patch(':id')
    @UseGuards(AuthGuard)
    @RequirePermission(PERMISSION_MAP.PRODUCTS_MANAGE)
    async update(@Request() req: any, @Param('id', ParseIntPipe) id: number, @Body() updateProductDto: UpdateProductDto) {
        const updated = await this.productService.update(id, updateProductDto);
        await this.auditService.logAdminAction(req, 'product.update', {
            tableName: 'products',
            recordId: id,
        });
        return updated;
    }

    @Delete(':id')
    @UseGuards(AuthGuard)
    @RequirePermission(PERMISSION_MAP.PRODUCTS_MANAGE)
    async remove(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
        const deleted = await this.productService.remove(id);
        await this.auditService.logAdminAction(req, 'product.delete', {
            tableName: 'products',
            recordId: id,
        });
        return deleted;
    }
}
