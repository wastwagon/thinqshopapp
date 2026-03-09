import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { VariationService } from './variation.service';
import { CreateVariationOptionDto, UpdateVariationOptionDto } from './dto/variation-option.dto';
import { CreateVariationValueDto, UpdateVariationValueDto } from './dto/variation-value.dto';
import { AuthGuard } from '../auth/auth.guard';
import { ForbiddenException } from '@nestjs/common';

@Controller('variations')
export class VariationController {
    constructor(private variationService: VariationService) {}

    @Get('options')
    async getOptions() {
        return this.variationService.getOptionsPublic();
    }

    @Get('admin/options')
    @UseGuards(AuthGuard)
    async getOptionsAdmin(@Request() req: any) {
        if (req.user?.role !== 'admin' && req.user?.role !== 'superadmin') throw new ForbiddenException('Admin required');
        return this.variationService.getOptions();
    }

    @Post('admin/options')
    @UseGuards(AuthGuard)
    async createOption(@Request() req: any, @Body() dto: CreateVariationOptionDto) {
        if (req.user?.role !== 'admin' && req.user?.role !== 'superadmin') throw new ForbiddenException('Admin required');
        return this.variationService.createOption(dto);
    }

    @Patch('admin/options/:id')
    @UseGuards(AuthGuard)
    async updateOption(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateVariationOptionDto) {
        if (req.user?.role !== 'admin' && req.user?.role !== 'superadmin') throw new ForbiddenException('Admin required');
        return this.variationService.updateOption(Number(id), dto);
    }

    @Delete('admin/options/:id')
    @UseGuards(AuthGuard)
    async deleteOption(@Request() req: any, @Param('id') id: string) {
        if (req.user?.role !== 'admin' && req.user?.role !== 'superadmin') throw new ForbiddenException('Admin required');
        return this.variationService.deleteOption(Number(id));
    }

    @Post('admin/values')
    @UseGuards(AuthGuard)
    async createValue(@Request() req: any, @Body() dto: CreateVariationValueDto) {
        if (req.user?.role !== 'admin' && req.user?.role !== 'superadmin') throw new ForbiddenException('Admin required');
        return this.variationService.createValue(dto);
    }

    @Patch('admin/values/:id')
    @UseGuards(AuthGuard)
    async updateValue(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateVariationValueDto) {
        if (req.user?.role !== 'admin' && req.user?.role !== 'superadmin') throw new ForbiddenException('Admin required');
        return this.variationService.updateValue(Number(id), dto);
    }

    @Delete('admin/values/:id')
    @UseGuards(AuthGuard)
    async deleteValue(@Request() req: any, @Param('id') id: string) {
        if (req.user?.role !== 'admin' && req.user?.role !== 'superadmin') throw new ForbiddenException('Admin required');
        return this.variationService.deleteValue(Number(id));
    }
}
