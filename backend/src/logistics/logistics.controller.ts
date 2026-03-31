import { Controller, Post, Get, Patch, Delete, Body, Param, Query, UseGuards, Request, ForbiddenException, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { LogisticsService } from './logistics.service';
import { AuthGuard } from '../auth/auth.guard';
import { PermissionGuard } from '../auth/permission.guard';
import { RequirePermission } from '../auth/require-permission.decorator';
import { PERMISSION_MAP } from '../auth/permissions';
import { AuditService } from '../audit/audit.service';
import {
    BookShipmentDto,
    CalculatePriceDto,
    FreightRateDto,
    UpdateFreightRateDto,
    UpdateShipmentStatusDto,
} from './dto/logistics.dto';

const MAX_DECLARATION_FILE = 5 * 1024 * 1024;
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

@Controller('logistics')
export class LogisticsController {
    constructor(
        private logisticsService: LogisticsService,
        private auditService: AuditService,
    ) { }

    @Post('book')
    @UseGuards(AuthGuard)
    async bookShipment(@Request() req, @Body() body: BookShipmentDto) {
        return this.logisticsService.bookShipment(req.user.sub, body);
    }

    @Post('upload-declaration-image')
    @UseGuards(AuthGuard)
    @UseInterceptors(
        FileInterceptor('file', {
            storage: memoryStorage(),
            limits: { fileSize: MAX_DECLARATION_FILE },
            fileFilter: (_req, file, cb) => {
                if (file.mimetype && ALLOWED_MIMES.includes(file.mimetype)) cb(null, true);
                else cb(new Error('Invalid type. Use JPEG, PNG, GIF or WebP'), false);
            },
        }),
    )
    async uploadDeclarationImage(@Request() req: any, @UploadedFile() file: Express.Multer.File) {
        if (!file) throw new BadRequestException('No file uploaded');
        return this.logisticsService.uploadDeclarationImage(file);
    }

    @Get('history')
    @UseGuards(AuthGuard)
    async getHistory(@Request() req) {
        return this.logisticsService.getUserShipments(req.user.sub);
    }

    @Post('calculate-price')
    async calculatePrice(@Body() body: CalculatePriceDto) {
        // Return full breakdown
        return this.logisticsService.calculatePrice({
            zoneId: Number(body.zoneId),
            weight: Number(body.weight),
            serviceType: body.serviceType
        });
    }

    @Get('shipments/:id')
    @UseGuards(AuthGuard)
    async getShipment(@Request() req, @Param('id') id: string) {
        return this.logisticsService.getShipmentById(req.user.sub, Number(id));
    }

    @Get('track/:trackingNumber')
    async trackShipment(@Param('trackingNumber') trackingNumber: string) {
        return this.logisticsService.trackShipment(trackingNumber);
    }

    @Get('zones')
    async getZones() {
        return this.logisticsService.getZones();
    }

    @Get('warehouses')
    async getWarehouses() {
        return this.logisticsService.getWarehouses();
    }

    @Get('freight-rates')
    async getFreightRates(@Query('method') method?: string) {
        const m = method === 'sea_freight' ? 'sea_freight' : method === 'air_freight' ? 'air_freight' : undefined;
        return this.logisticsService.getFreightRates(m);
    }

    @Get('admin/freight-rates')
    @UseGuards(AuthGuard, PermissionGuard)
    @RequirePermission(PERMISSION_MAP.LOGISTICS_READ_ALL)
    async getAllFreightRates(@Request() req) {
        return this.logisticsService.getAllFreightRates();
    }

    @Post('admin/freight-rates')
    @UseGuards(AuthGuard, PermissionGuard)
    @RequirePermission(PERMISSION_MAP.FREIGHT_RATES_MANAGE)
    async createFreightRate(@Request() req, @Body() body: FreightRateDto) {
        const created = await this.logisticsService.createFreightRate(body);
        await this.auditService.logAdminAction(req, 'freight_rate.create', {
            tableName: 'shipping_method_rates',
            recordId: created.id,
            details: { rate_id: created.rate_id, method: created.method },
        });
        return created;
    }

    @Patch('admin/freight-rates/:id')
    @UseGuards(AuthGuard, PermissionGuard)
    @RequirePermission(PERMISSION_MAP.FREIGHT_RATES_MANAGE)
    async updateFreightRate(@Request() req, @Param('id') id: string, @Body() body: UpdateFreightRateDto) {
        const updated = await this.logisticsService.updateFreightRate(Number(id), body);
        await this.auditService.logAdminAction(req, 'freight_rate.update', {
            tableName: 'shipping_method_rates',
            recordId: Number(id),
        });
        return updated;
    }

    @Delete('admin/freight-rates/:id')
    @UseGuards(AuthGuard, PermissionGuard)
    @RequirePermission(PERMISSION_MAP.FREIGHT_RATES_MANAGE)
    async deleteFreightRate(@Request() req, @Param('id') id: string) {
        const deleted = await this.logisticsService.deleteFreightRate(Number(id));
        await this.auditService.logAdminAction(req, 'freight_rate.delete', {
            tableName: 'shipping_method_rates',
            recordId: Number(id),
        });
        return deleted;
    }

    @Get('admin/shipments')
    @UseGuards(AuthGuard, PermissionGuard)
    @RequirePermission(PERMISSION_MAP.LOGISTICS_READ_ALL)
    async getAllShipments(@Request() req) {
        return this.logisticsService.getAllShipments();
    }

    @Get('admin/shipments/:id')
    @UseGuards(AuthGuard, PermissionGuard)
    @RequirePermission(PERMISSION_MAP.LOGISTICS_READ_ALL)
    async getAdminShipmentById(@Request() req, @Param('id') id: string) {
        return this.logisticsService.getAdminShipmentById(Number(id));
    }

    @Patch('admin/shipments/:id/status')
    @UseGuards(AuthGuard, PermissionGuard)
    @RequirePermission(PERMISSION_MAP.LOGISTICS_MANAGE)
    async updateShipmentStatus(@Request() req, @Param('id') id: string, @Body() body: UpdateShipmentStatusDto) {
        const { status, notes } = body;
        const updated = await this.logisticsService.updateShipmentStatus(Number(id), status as any, notes);
        await this.auditService.logAdminAction(req, 'shipment.status.update', {
            tableName: 'shipments',
            recordId: Number(id),
            details: { status },
        });
        return updated;
    }

    @Post('admin/simulate-webhook/:id')
    @UseGuards(AuthGuard, PermissionGuard)
    @RequirePermission(PERMISSION_MAP.LOGISTICS_MANAGE)
    async simulateWebhook(@Request() req, @Param('id') id: string) {
        const updated = await this.logisticsService.simulateWebhookAdvance(Number(id));
        await this.auditService.logAdminAction(req, 'shipment.webhook.simulated', {
            tableName: 'shipments',
            recordId: Number(id),
        });
        return updated;
    }
}
