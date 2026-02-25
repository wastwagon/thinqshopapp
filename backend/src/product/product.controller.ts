import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request, ParseIntPipe, ForbiddenException, Header } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { AuthGuard } from '../auth/auth.guard';

@Controller('products')
export class ProductController {
    constructor(private readonly productService: ProductService) { }

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
    async getCategoriesAdmin(@Request() req: any) {
        if (req.user?.role !== 'admin' && req.user?.role !== 'superadmin') {
            throw new ForbiddenException('Admin access required');
        }
        return this.productService.getCategoriesForAdmin();
    }

    @Post('categories')
    @UseGuards(AuthGuard)
    async createCategory(@Request() req: any, @Body() dto: CreateCategoryDto) {
        if (req.user?.role !== 'admin' && req.user?.role !== 'superadmin') {
            throw new ForbiddenException('Admin access required');
        }
        return this.productService.createCategory(dto);
    }

    @Patch('categories/:id')
    @UseGuards(AuthGuard)
    async updateCategory(@Request() req: any, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCategoryDto) {
        if (req.user?.role !== 'admin' && req.user?.role !== 'superadmin') {
            throw new ForbiddenException('Admin access required');
        }
        return this.productService.updateCategory(id, dto);
    }

    @Delete('categories/:id')
    @UseGuards(AuthGuard)
    async removeCategory(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
        if (req.user?.role !== 'admin' && req.user?.role !== 'superadmin') {
            throw new ForbiddenException('Admin access required');
        }
        return this.productService.removeCategory(id);
    }

    @Get('admin/list')
    @UseGuards(AuthGuard)
    async findAllAdmin(@Request() req: any, @Query() query: { page?: number; limit?: number; search?: string }) {
        if (req.user?.role !== 'admin' && req.user?.role !== 'superadmin') {
            throw new ForbiddenException('Admin access required');
        }
        return this.productService.findAllForAdmin(query);
    }

    @Post()
    @UseGuards(AuthGuard)
    async create(@Request() req: any, @Body() createProductDto: CreateProductDto) {
        if (req.user?.role !== 'admin' && req.user?.role !== 'superadmin') {
            throw new ForbiddenException('Admin access required');
        }
        return this.productService.create(createProductDto);
    }

    @Get(':slug')
    findOne(@Param('slug') slug: string) {
        return this.productService.findOne(slug);
    }

    @Patch(':id')
    @UseGuards(AuthGuard)
    async update(@Request() req: any, @Param('id', ParseIntPipe) id: number, @Body() updateProductDto: UpdateProductDto) {
        if (req.user?.role !== 'admin' && req.user?.role !== 'superadmin') {
            throw new ForbiddenException('Admin access required');
        }
        return this.productService.update(id, updateProductDto);
    }

    @Delete(':id')
    @UseGuards(AuthGuard)
    async remove(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
        if (req.user?.role !== 'admin' && req.user?.role !== 'superadmin') {
            throw new ForbiddenException('Admin access required');
        }
        return this.productService.remove(id);
    }
}
